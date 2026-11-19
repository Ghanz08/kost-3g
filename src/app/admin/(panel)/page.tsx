import { AlarmClock, BedDouble, CalendarClock, CircleAlert, PartyPopper, ReceiptText, TrendingDown, TrendingUp, UserPlus, Wrench } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Card, EmptyState, LinkButton, PageHeader, Stat, WaLink } from "@/components/admin/ui";
import { Door } from "@/components/door";
import { requireAdmin } from "@/lib/admin";
import { reminderMessage } from "@/lib/billing";
import { DashboardSummary, TrendLine } from "./laporan/sections";
import { addDays, bulanLabel, monthEnd, monthStart, rp, tgl, toE164, today } from "@/lib/format";

export const metadata: Metadata = { title: "Dasbor" };

export default async function Dasbor() {
  const { supabase } = await requireAdmin();
  const period = monthStart();
  const now = today();

  const [rooms, leases, unpaid, payments, expenses, ending, tickets, leads] = await Promise.all([
    supabase.from("rooms").select("number, status, floor").order("number"),
    supabase.from("leases").select("room_number, tenants(name)").eq("status", "aktif"),
    supabase.from("invoice_status").select("*, leases(room_number, tenants(name, phone))").neq("status", "lunas").lte("due_date", addDays(now, 7)).order("due_date"),
    supabase.from("payments").select("amount").gte("paid_on", period).lte("paid_on", monthEnd(period)),
    supabase.from("expenses").select("amount").gte("spent_on", period).lte("spent_on", monthEnd(period)),
    supabase.from("leases").select("id, room_number, end_date, tenants(id, name)").eq("status", "aktif").not("end_date", "is", null).lte("end_date", addDays(now, 30)).order("end_date"),
    supabase.from("tickets").select("id", { count: "exact", head: true }).neq("status", "selesai"),
    supabase.from("leads").select("id", { count: "exact", head: true }).in("status", ["baru", "survey"]),
  ]);

  const all = rooms.data ?? [];
  const occupied = all.filter((r) => r.status === "terisi").length;
  const vacant = all.filter((r) => r.status === "kosong");
  const sum = (rows: { amount: number }[] | null) => rows?.reduce((s, r) => s + r.amount, 0) ?? 0;
  const income = sum(payments.data);
  const spent = sum(expenses.data);
  const late = unpaid.data?.filter((i) => i.status === "telat") ?? [];
  const dueSoon = unpaid.data?.filter((i) => i.status !== "telat") ?? [];
  const lateTotal = late.reduce((s, i) => s + (i.total ?? 0) - (i.paid ?? 0), 0);
  const tenantOf = (n: number) => leases.data?.find((l) => l.room_number === n)?.tenants?.name;

  type Item = { key: string; icon: typeof CircleAlert; tone: string; title: string; detail: string; action?: React.ReactNode };
  const attention: Item[] = [
    ...late.map((i) => ({
      key: `late-${i.id}`,
      icon: CircleAlert,
      tone: "bg-red-50 text-red-700",
      title: `Kamar ${i.leases?.room_number} · ${i.leases?.tenants?.name} telat bayar`,
      detail: `Sisa ${rp((i.total ?? 0) - (i.paid ?? 0))}, jatuh tempo ${tgl(i.due_date)}`,
      action: i.leases?.tenants && (
        <WaLink
          phone={toE164(i.leases.tenants.phone)}
          message={reminderMessage(i.leases.tenants.name, i.leases.room_number, {
            period: i.period!, due_date: i.due_date!, rent: i.rent ?? 0, electricity: i.electricity ?? 0,
            water: i.water ?? 0, other: i.other ?? 0, other_note: i.other_note, total: i.total ?? 0, paid: i.paid ?? 0,
          })}
        >
          Ingatkan
        </WaLink>
      ),
    })),
    ...dueSoon.map((i) => ({
      key: `due-${i.id}`,
      icon: AlarmClock,
      tone: "bg-accent-50 text-accent-700",
      title: `Kamar ${i.leases?.room_number} · ${i.leases?.tenants?.name} jatuh tempo ${tgl(i.due_date)}`,
      detail: `Sisa ${rp((i.total ?? 0) - (i.paid ?? 0))}`,
    })),
    ...(ending.data ?? []).map((l) => ({
      key: `end-${l.id}`,
      icon: CalendarClock,
      tone: "bg-navy-700/10 text-navy-700",
      title: `Kontrak kamar ${l.room_number} · ${l.tenants?.name} habis ${tgl(l.end_date)}`,
      detail: "Tanyakan apakah akan diperpanjang.",
      action: <LinkButton href="/admin/sewa" variant="secondary">Buka sewa</LinkButton>,
    })),
  ];

  return (
    <>
      <PageHeader title="Dasbor" description={`Ringkasan ${bulanLabel(period)}.`}>
        <LinkButton href={`/admin/tagihan?bulan=${now.slice(0, 7)}`} icon={ReceiptText}>
          Tagihan bulan ini
        </LinkButton>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={BedDouble} label="Kamar terisi" value={`${occupied} dari ${all.length}`} trend={trend("occupancy")} hint={vacant.length ? `Kosong: kamar ${vacant.map((r) => r.number).join(", ")}` : "Semua terisi"} />
        <Stat icon={TrendingUp} tone="good" label="Uang masuk bulan ini" value={rp(income)} trend={trend("income")} />
        <Stat icon={TrendingDown} label="Pengeluaran bulan ini" value={rp(spent)} trend={trend("expense")} hint={`Bersih ${rp(income - spent)}`} />
        <Stat icon={CircleAlert} tone={late.length ? "bad" : "default"} label="Tunggakan" value={late.length ? rp(lateTotal) : "Tidak ada"} hint={late.length ? `${late.length} tagihan telat` : undefined} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Card title="Perlu perhatian" description="Diurutkan dari yang paling mendesak.">
          {attention.length ? (
            <ul className="flex flex-col divide-y divide-line">
              {attention.map((a) => (
                <li key={a.key} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                  <span aria-hidden className={`grid size-9 shrink-0 place-items-center rounded-xl ${a.tone}`}>
                    <a.icon className="size-[1.125rem]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-navy-700">{a.title}</p>
                    <p className="text-sm text-subtle">{a.detail}</p>
                  </div>
                  {a.action}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={PartyPopper} title="Semua beres">
              Tidak ada tagihan telat, jatuh tempo minggu ini, atau kontrak yang segera habis.
            </EmptyState>
          )}
          {(tickets.count || leads.count) ? (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
              {tickets.count ? (
                <LinkButton href="/admin/keluhan" variant="secondary" icon={Wrench}>
                  {tickets.count} keluhan belum selesai
                </LinkButton>
              ) : null}
              {leads.count ? (
                <LinkButton href="/admin/calon" variant="secondary" icon={UserPlus}>
                  {leads.count} calon penyewa
                </LinkButton>
              ) : null}
            </div>
          ) : null}
        </Card>

        <Card title="Papan kamar" description="Pintu oranye = kosong. Klik untuk mengubah.">
          {(["atas", "bawah"] as const).map((floor) => (
            <div key={floor} className="mb-4 last:mb-0">
              <p className="mb-2 text-sm font-semibold text-subtle">Lantai {floor}</p>
              <ul className="grid grid-cols-4 gap-2">
                {all.filter((r) => r.floor === floor).map((r) => {
                  const who = tenantOf(r.number);
                  return (
                    <li key={r.number}>
                      <Link
                        href="/admin/kamar"
                        className="flex flex-col items-center gap-1 rounded-xl p-2 text-center hover:bg-paper"
                        aria-label={`Kamar ${r.number}: ${r.status}${who ? `, ${who}` : ""}`}
                      >
                        <Door number={r.number} open={r.status === "kosong"} className="w-10" />
                        <span className="w-full truncate text-xs text-subtle">{who ?? r.status}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </Card>
      </div>

      <Suspense fallback={<div aria-hidden className="mt-6 h-72 animate-pulse rounded-2xl bg-surface ring-1 ring-line" />}>
        <DashboardSummary />
      </Suspense>
    </>
  );
}

const trend = (kind: "occupancy" | "income" | "expense") => (
  <Suspense fallback={<div aria-hidden className="h-7" />}>
    <TrendLine kind={kind} />
  </Suspense>
);
