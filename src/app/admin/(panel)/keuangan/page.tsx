import { Download, Plus, Receipt, Scale, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import { ActionForm, FormActions, Submit } from "@/components/admin/action-form";
import { ConfirmAction } from "@/components/admin/confirm";
import { Dialog } from "@/components/admin/dialog";
import { Field, MoneyField, Select } from "@/components/admin/fields";
import { Card, EmptyState, LinkButton, MonthSwitcher, PageHeader, Stat, Table, Td, Tr } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { bulanLabel, monthEnd, monthStart, rp, shiftMonth, tgl, today } from "@/lib/format";
import { addExpense, deleteExpense } from "./actions";
import { CATEGORIES } from "./categories";

export const metadata: Metadata = { title: "Keuangan" };

const label = (c: string) => c[0].toUpperCase() + c.slice(1);

export default async function KeuanganPage({ searchParams }: PageProps<"/admin/keuangan">) {
  const { supabase } = await requireAdmin();
  const period = monthStart((await searchParams).bulan as string | undefined);
  const ym = (p: string) => p.slice(0, 7);
  const yearStart = shiftMonth(period, -11);

  // Arus kas: masuk = pembayaran diterima di bulan itu, keluar = tanggal belanja.
  const [{ data: payments }, { data: expenses }] = await Promise.all([
    supabase.from("payments").select("amount, paid_on").gte("paid_on", yearStart).lte("paid_on", monthEnd(period)),
    supabase.from("expenses").select("*").gte("spent_on", yearStart).lte("spent_on", monthEnd(period)).order("spent_on", { ascending: false }),
  ]);
  const inMonth = (d: string, p: string) => d.slice(0, 7) === ym(p);
  const total = (rows: { amount: number }[] | undefined) => rows?.reduce((s, r) => s + r.amount, 0) ?? 0;
  const income = (p: string) => total(payments?.filter((r) => inMonth(r.paid_on, p)));
  const spend = (p: string) => total(expenses?.filter((r) => inMonth(r.spent_on, p)));
  const monthExpenses = expenses?.filter((e) => inMonth(e.spent_on, period)) ?? [];
  const byCategory = CATEGORIES.map((c) => [c, total(monthExpenses.filter((e) => e.category === c))] as const).filter(([, v]) => v);
  const net = income(period) - spend(period);
  const months = Array.from({ length: 12 }, (_, k) => shiftMonth(period, -k));

  const addDialog = (
    <Dialog trigger="Catat pengeluaran" title="Catat pengeluaran" description="Token listrik, perbaikan, kebersihan, dan lainnya." icon={<Plus aria-hidden className="size-4" />}>
      <ActionForm action={addExpense} className="flex flex-col gap-4">
        <MoneyField label="Jumlah" name="amount" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Kategori" name="category" required options={CATEGORIES.map((c) => [c, label(c)] as const)} />
          <Field label="Tanggal" name="spent_on" type="date" defaultValue={today()} required />
        </div>
        <Field label="Keterangan" name="note" placeholder="Token listrik, ganti keran, …" />
        <Field label="Nota / bukti (opsional)" name="proof" type="file" accept="image/*,application/pdf" />
        <FormActions>
          <Submit>Simpan pengeluaran</Submit>
        </FormActions>
      </ActionForm>
    </Dialog>
  );

  return (
    <>
      <PageHeader title="Keuangan" description="Arus kas per bulan: uang masuk dari pembayaran penghuni, uang keluar dari pengeluaran.">
        <MonthSwitcher basePath="/admin/keuangan" period={period} label={bulanLabel(period)} prev={ym(shiftMonth(period, -1))} next={ym(shiftMonth(period, 1))} />
        <LinkButton href={`/admin/keuangan/export?bulan=${ym(period)}`} variant="secondary" icon={Download}>
          Unduh CSV
        </LinkButton>
        {addDialog}
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={TrendingUp} tone="good" label="Uang masuk" value={rp(income(period))} />
        <Stat icon={TrendingDown} label="Uang keluar" value={rp(spend(period))} />
        <Stat icon={Scale} tone={net < 0 ? "bad" : "good"} label="Bersih" value={rp(net)} hint={net < 0 ? "Pengeluaran lebih besar" : undefined} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Card title={`Pengeluaran ${bulanLabel(period)}`}>
          {monthExpenses.length ? (
            <Table caption={`Pengeluaran ${bulanLabel(period)}`} head={["Tanggal", "Kategori", "Keterangan", "Jumlah", ""]}>
              {monthExpenses.map((e) => (
                <Tr key={e.id}>
                  <Td className="whitespace-nowrap">{tgl(e.spent_on)}</Td>
                  <Td label="Kategori">{label(e.category)}</Td>
                  <Td label="Keterangan">
                    {e.note ?? "–"}
                    {e.proof_path && (
                      <a href={`/admin/berkas?path=${encodeURIComponent(e.proof_path)}`} target="_blank" rel="noopener" className="ml-2 font-semibold text-brand-700 underline">
                        Nota<span className="sr-only"> (tab baru)</span>
                      </a>
                    )}
                  </Td>
                  <Td label="Jumlah" className="font-semibold tabular-nums">{rp(e.amount)}</Td>
                  <Td className="md:text-right">
                    <ConfirmAction
                      action={deleteExpense}
                      fields={{ id: e.id }}
                      compact
                      label={<><Trash2 aria-hidden className="size-4" /><span className="sr-only">Hapus pengeluaran {rp(e.amount)} {tgl(e.spent_on)}</span></>}
                      title="Hapus pengeluaran?"
                      message={`${label(e.category)} ${rp(e.amount)} tanggal ${tgl(e.spent_on)} akan dihapus.`}
                      confirmLabel="Ya, hapus"
                    />
                  </Td>
                </Tr>
              ))}
            </Table>
          ) : (
            <EmptyState icon={Receipt} title="Belum ada pengeluaran bulan ini" action={addDialog}>
              Catat token listrik, air, perbaikan, dan belanja kebutuhan supaya laporan bersih akurat.
            </EmptyState>
          )}
        </Card>

        <Card title="Per kategori">
          {byCategory.length ? (
            <Table caption="Pengeluaran per kategori" head={["Kategori", "Jumlah", "Porsi"]}>
              {byCategory.map(([c, v]) => (
                <Tr key={c}>
                  <Td>{label(c)}</Td>
                  <Td label="Jumlah" className="tabular-nums">{rp(v)}</Td>
                  <Td label="Porsi" className="tabular-nums">{Math.round((v / spend(period)) * 100)}%</Td>
                </Tr>
              ))}
            </Table>
          ) : (
            <p className="text-sm text-subtle">Belum ada data.</p>
          )}
        </Card>
      </div>

      <Card title="12 bulan terakhir" className="mt-6">
        <Table caption="Ringkasan 12 bulan" head={["Bulan", "Masuk", "Keluar", "Bersih"]}>
          {months.map((m) => {
            const n = income(m) - spend(m);
            return (
              <Tr key={m}>
                <Td className="font-semibold text-navy-700">{bulanLabel(m)}</Td>
                <Td label="Masuk" className="tabular-nums">{rp(income(m))}</Td>
                <Td label="Keluar" className="tabular-nums">{rp(spend(m))}</Td>
                <Td label="Bersih" className={`font-semibold tabular-nums ${n < 0 ? "text-red-700" : "text-navy-700"}`}>
                  {n < 0 ? `−${rp(-n)}` : rp(n)}
                </Td>
              </Tr>
            );
          })}
        </Table>
      </Card>
    </>
  );
}
