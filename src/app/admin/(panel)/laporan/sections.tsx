import { ArrowRight, CalendarRange, Clock, Coins, Repeat } from "lucide-react";
import Link from "next/link";
import { cache } from "react";
import { BarList, ColumnChart, pct, RoomTimeline, rpShort, Sparkline } from "@/components/admin/charts";
import { Card, Stat } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { addDays, rp, tgl, today } from "@/lib/format";
import { computeInsights, since30 } from "@/lib/insights";
import { siteStats } from "@/lib/umami";
import { sourceLabel, type Source } from "../calon/sources";

const short = new Intl.DateTimeFormat("id-ID", { month: "short", timeZone: "UTC" });
const longM = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" });
const dayM = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" });
const mLabel = (p: string) => short.format(new Date(`${p}T00:00:00Z`)).replace(".", "");
const mLong = (p: string) => longM.format(new Date(`${p}T00:00:00Z`));
const income = { name: "Uang masuk", color: "bg-chart-1" };
const expense = { name: "Pengeluaran", color: "bg-chart-2" };

/** Data 12 bulan, dipakai dasbor (garis tren) dan Laporan. `cache` = satu kali query per permintaan. */
export const getInsights = cache(async () => {
  const { supabase } = await requireAdmin();
  const now = today();
  const from = addDays(`${now.slice(0, 7)}-01`, -366);
  const [rooms, leases, payments, expenses, invoices, utilities] = await Promise.all([
    supabase.from("rooms").select("number").order("number"),
    supabase.from("leases").select("room_number, start_date, ended_on, status, end_reason, tenants(name)").or(`status.eq.aktif,ended_on.gte.${from}`),
    supabase.from("payments").select("amount, paid_on").gte("paid_on", from),
    supabase.from("expenses").select("amount, spent_on").gte("spent_on", from),
    supabase.from("invoice_status").select("period, due_date, total, paid").or(`period.gte.${from},status.neq.lunas`),
    supabase.from("utility_bills").select("period, per_tenant").gte("period", from),
  ]);
  const r = computeInsights(
    {
      rooms: rooms.data?.map((x) => x.number) ?? [],
      leases: leases.data ?? [],
      payments: payments.data?.map((p) => ({ amount: p.amount, date: p.paid_on })) ?? [],
      expenses: expenses.data?.map((e) => ({ amount: e.amount, date: e.spent_on })) ?? [],
      invoices: invoices.data ?? [],
      utilities: utilities.data ?? [],
    },
    now,
  );
  return { ...r, roomCount: rooms.data?.length ?? 0 };
});

const head = (title: string, text: string) => (
  <div className="mb-4">
    <h2 className="font-display text-xl font-bold text-navy-700">{title}</h2>
    <p className="text-sm text-subtle">{text}</p>
  </div>
);

export async function HunianReport() {
  const r = await getInsights();
  const m = r.monthly;
  return (
    <section aria-label="Hunian">
      {head("Hunian 12 bulan", `${mLong(m[0].period)} sampai ${mLong(m[11].period)}. Arahkan kursor atau tekan Tab pada grafik untuk melihat angkanya.`)}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={CalendarRange} label="Rata-rata keterisian" value={pct(r.kpi.occupancy12)} hint="Hari-kamar terisi dalam 12 bulan" />
        <Stat
          icon={Clock}
          label="Lama kamar kosong"
          value={r.kpi.daysToFill == null ? "–" : `${r.kpi.daysToFill} hari`}
          hint={r.kpi.fills ? `Rata-rata dari ${r.kpi.fills} pergantian penghuni` : "Belum ada pergantian penghuni"}
        />
        <Stat icon={Repeat} label="Penghuni keluar" value={String(r.kpi.moveOuts)} hint={`Turnover ${pct(r.kpi.turnover)} dari ${r.roomCount} kamar`} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Linimasa kamar" description="Hijau = terisi. Celah abu-abu = kamar kosong." className="xl:col-span-2">
          <RoomTimeline
            ticks={r.ticks.map((t) => ({ label: mLabel(t.period), left: t.left }))}
            rows={r.timeline.map((row) => ({
              room: row.room,
              current: row.segments.find((s) => !s.end)?.name,
              segments: row.segments.map((s) => ({ ...s, range: `${tgl(s.start)} – ${s.end ? tgl(s.end) : "sekarang"}` })),
            }))}
          />
        </Card>

        <Card title="Keterisian per bulan" description="Persentase hari-kamar yang terisi.">
          <ColumnChart
            series={[{ name: "Keterisian", color: "bg-chart-1" }]}
            rows={m.map((x) => ({ label: mLabel(x.period), long: mLong(x.period), values: [x.occupancy] }))}
            format={pct}
            max={1}
          />
        </Card>

      </div>
    </section>
  );
}

export async function KeuanganReport() {
  const r = await getInsights();
  const m = r.monthly;
  const hasMoney = m.some((x) => x.income || x.expense);
  const lateTotal = r.aging.reduce((s, a) => s + a.amount, 0);
  return (
    <section aria-label="Keuangan">
      {head("Keuangan 12 bulan", `${mLong(m[0].period)} sampai ${mLong(m[11].period)}.`)}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Coins} tone="good" label="Pendapatan per kamar" value={r.kpi.revenuePerRoom == null ? "–" : rp(r.kpi.revenuePerRoom)} hint="Rata-rata per bulan" />
        <Stat icon={Coins} label="Uang masuk 12 bulan" value={rp(m.reduce((s, x) => s + x.income, 0))} hint={`Bersih ${rp(m.reduce((s, x) => s + x.net, 0))}`} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="xl:col-span-2" title="Uang masuk dan pengeluaran" description="Bersih = uang masuk dikurangi pengeluaran.">
          {hasMoney ? (
            <ColumnChart
              series={[income, expense]}
              rows={m.map((x) => ({ label: mLabel(x.period), long: mLong(x.period), values: [x.income, x.expense], extra: `Bersih ${rp(x.net)}` }))}
              format={rpShort}
              extraHead="Bersih"
            />
          ) : (
            <p className="text-sm text-subtle">Belum ada pembayaran atau pengeluaran tercatat.</p>
          )}
        </Card>

        <Card title="Tagihan yang terbayar" description="Bagian dari total tagihan tiap bulan yang sudah dibayar.">
          <ColumnChart
            series={[{ name: "Terbayar", color: "bg-chart-1" }]}
            rows={m.map((x) => ({ label: mLabel(x.period), long: mLong(x.period), values: [x.collection] }))}
            format={pct}
            max={1}
          />
        </Card>

        <Card title="Umur tunggakan" description={lateTotal ? `Total ${rp(lateTotal)} lewat jatuh tempo.` : "Sisa tagihan yang lewat jatuh tempo."}>
          <BarList
            rows={r.aging.map((a) => ({ label: a.label, value: a.amount, note: a.count ? `${a.count} tagihan` : undefined }))}
            color="bg-chart-2"
            format={rpShort}
            empty="Tidak ada tunggakan. 👍"
          />
        </Card>

        <Card title="Listrik & air per penghuni" description="Jumlah tagihan utilitas yang dibebankan ke tiap penghuni.">
          <ColumnChart
            series={[{ name: "Per penghuni", color: "bg-chart-1" }]}
            rows={m.map((x) => ({ label: mLabel(x.period), long: mLong(x.period), values: [x.utilityPerTenant] }))}
            format={rpShort}
          />
        </Card>
      </div>
    </section>
  );
}

/** Dari pengunjung situs sampai menyewa, 30 hari terakhir. Data situs dari Umami; sisanya dari database. */
export async function PemasaranReport() {
  const { supabase } = await requireAdmin();
  const now = today();
  const from = since30(now);
  const [site, leads, leases] = await Promise.all([
    siteStats(30),
    supabase.from("leads").select("status, survey_at, source").gte("created_at", `${from}T00:00:00+07:00`),
    supabase.from("leases").select("id", { count: "exact", head: true }).gte("start_date", from).is("checkin->>pindahan", null),
  ]);
  const L = leads.data ?? [];
  const steps = [
    ...(site ? [{ label: "Pengunjung situs", value: site.visitors }, { label: "Klik WhatsApp", value: site.waClicks }] : []),
    { label: "Calon tercatat", value: L.length },
    { label: "Survey", value: L.filter((l) => l.survey_at || l.status === "survey" || l.status === "jadi").length },
    { label: "Menyewa", value: leases.count ?? 0 },
  ];
  const withRate = steps.map((s, i) => ({ ...s, note: i && steps[i - 1].value ? `lanjut ${pct(s.value / steps[i - 1].value)}` : undefined }));
  const bySource = Object.entries(
    L.reduce<Record<string, number>>((acc, l) => ((acc[l.source] = (acc[l.source] ?? 0) + 1), acc), {}),
  )
    .map(([k, v]) => ({ label: sourceLabel[k as Source] ?? k, value: v }))
    .sort((a, b) => b.value - a.value);

  // Isi hari tanpa kunjungan dengan 0, supaya sumbu waktu tidak melompat.
  const visits = new Map(site?.daily.map((d) => [d.date, d.visitors]));
  const daily = Array.from({ length: 30 }, (_, i) => addDays(from, i)).map((d) => ({ d, v: visits.get(d) ?? 0 }));

  return (
    <section aria-labelledby="judul-situs" className="mt-10">
      <h2 id="judul-situs" className="font-display text-xl font-bold text-navy-700">
        Situs & calon penyewa
      </h2>
      <p className="mb-4 text-sm text-subtle">30 hari terakhir. Analitik tanpa cookie (Umami), tidak menyimpan data pribadi pengunjung.</p>
      {!site && (
        <p role="note" className="mb-4 rounded-xl bg-paper px-4 py-3 text-sm text-navy-700">
          Data kunjungan situs belum tersedia (Umami tidak terhubung). Funnel di bawah hanya dari data calon penyewa.
        </p>
      )}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Dari kunjungan sampai menyewa" description="Persen = bagian yang lanjut dari langkah sebelumnya.">
          <BarList rows={withRate} color="bg-chart-1" />
        </Card>
        <Card title="Tahu dari mana?" description="Sumber calon penyewa 30 hari terakhir.">
          <BarList rows={bySource} color="bg-chart-1" empty="Belum ada calon penyewa bulan ini." />
        </Card>
        {site && (
          <>
            <Card title="Pengunjung per hari" description={`${site.visitors} pengunjung, ${site.pageviews} tampilan halaman.`}>
              <ColumnChart
                series={[{ name: "Pengunjung", color: "bg-chart-1" }]}
                rows={daily.map(({ d, v }) => ({ label: dayM.format(new Date(`${d}T00:00:00Z`)), long: tgl(d), values: [v] }))}
                format={(n) => String(Math.round(n))}
                labelEvery={7}
              />
            </Card>
            <Card title="Tombol WhatsApp yang diklik" description={`${site.waClicks} klik. Bagian situs tempat pengunjung menekan tombol.`}>
              <BarList rows={site.spots} color="bg-chart-1" empty="Belum ada klik WhatsApp." />
              {site.referrers.length > 0 && (
                <>
                  <h3 className="mt-6 mb-3 text-sm font-semibold text-subtle">Datang dari</h3>
                  <BarList rows={site.referrers} color="bg-chart-1" />
                </>
              )}
            </Card>
          </>
        )}
      </div>
    </section>
  );
}

/** Garis tren kecil untuk kartu dasbor. Dimuat terpisah agar kartu tampil lebih dulu. */
export async function TrendLine({ kind }: { kind: "occupancy" | "income" | "expense" }) {
  const r = await getInsights();
  const values = r.monthly.map((m) => m[kind]);
  return <Sparkline values={values} label="12 bln" />;
}

/** Ringkasan 12 bulan untuk dasbor: tiga angka kunci + satu grafik kecil. Selebihnya ada di Laporan. */
export async function DashboardSummary() {
  const r = await getInsights();
  const m = r.monthly;
  const last = m[11];
  const facts: [string, string][] = [
    ["Keterisian rata-rata", pct(r.kpi.occupancy12)],
    ["Tagihan terbayar bulan ini", last.collection == null ? "–" : pct(last.collection)],
    ["Lama kamar kosong", r.kpi.daysToFill == null ? "–" : `${r.kpi.daysToFill} hari`],
  ];
  return (
    <Card
      title="Ringkasan 12 bulan"
      description="Uang masuk dan pengeluaran per bulan."
      className="mt-6"
      actions={
        <Link href="/admin/laporan" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-1 text-sm font-semibold text-brand-700 hover:underline">
          Laporan lengkap
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-center">
        <ColumnChart
          series={[income, expense]}
          rows={m.map((x) => ({ label: mLabel(x.period), long: mLong(x.period), values: [x.income, x.expense], extra: `Bersih ${rp(x.net)}` }))}
          format={rpShort}
          labelEvery={3}
          extraHead="Bersih"
        />
        <dl className="grid grid-cols-3 gap-3 lg:grid-cols-1">
          {facts.map(([k, v]) => (
            <div key={k} className="rounded-xl bg-paper px-4 py-3">
              <dt className="text-sm text-subtle">{k}</dt>
              <dd className="font-display text-xl font-bold text-navy-700 tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Card>
  );
}
