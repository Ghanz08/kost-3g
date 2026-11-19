import { Banknote, CircleAlert, Droplets, FilePlus2, ListChecks, ReceiptText, Trash2, Wallet } from "lucide-react";
import type { Metadata } from "next";
import { ActionForm, FormActions, Submit } from "@/components/admin/action-form";
import { ConfirmAction } from "@/components/admin/confirm";
import { Dialog } from "@/components/admin/dialog";
import { Field, MoneyField, Select } from "@/components/admin/fields";
import { Badge, Card, EmptyState, MonthSwitcher, PageHeader, Stat, Table, Td, Tr, WaLink } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { reminderMessage } from "@/lib/billing";
import { bulanLabel, monthStart, rp, shiftMonth, tgl, toE164, today } from "@/lib/format";
import { addPayment, deletePayment, generateInvoices, splitUtility, updateInvoice } from "./actions";

export const metadata: Metadata = { title: "Tagihan" };

export default async function TagihanPage({ searchParams }: PageProps<"/admin/tagihan">) {
  const { supabase } = await requireAdmin();
  const period = monthStart((await searchParams).bulan as string | undefined);
  const ym = (p: string) => p.slice(0, 7);

  const [{ data: invoices }, { data: utilities }, { data: settings }] = await Promise.all([
    supabase
      .from("invoice_status")
      .select("*, leases(room_number, tenants(id, name, phone)), payments(id, amount, method, paid_on, proof_path, note)")
      .eq("period", period)
      .order("due_date"),
    supabase.from("utility_bills").select("*").eq("period", period),
    supabase.from("settings").select("*").single(),
  ]);
  const list = invoices ?? [];
  const billed = list.reduce((s, i) => s + (i.total ?? 0), 0);
  const paid = list.reduce((s, i) => s + (i.paid ?? 0), 0);
  const late = list.filter((i) => i.status === "telat").length;
  const util = (kind: string) => utilities?.find((u) => u.kind === kind);

  const generate = (variant: "primary" | "secondary") => (
    <ActionForm action={generateInvoices}>
      <input type="hidden" name="period" value={ym(period)} />
      <Submit variant={variant} pendingText="Membuat…">
        <FilePlus2 aria-hidden className="size-4" />
        {list.length ? "Buat yang belum ada" : `Buat tagihan ${bulanLabel(period)}`}
      </Submit>
    </ActionForm>
  );

  return (
    <>
      <PageHeader title="Tagihan" description="Buat tagihan bulanan, bagi biaya listrik & air, lalu catat pembayaran.">
        <MonthSwitcher basePath="/admin/tagihan" period={period} label={bulanLabel(period)} prev={ym(shiftMonth(period, -1))} next={ym(shiftMonth(period, 1))} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={ReceiptText} label="Ditagih" value={rp(billed)} hint={`${list.length} tagihan`} />
        <Stat icon={Wallet} tone="good" label="Sudah masuk" value={rp(paid)} />
        <Stat icon={Banknote} tone={billed - paid > 0 ? "warn" : "default"} label="Sisa" value={rp(billed - paid)} />
        <Stat icon={CircleAlert} tone={late ? "bad" : "default"} label="Telat bayar" value={late ? `${late} tagihan` : "Tidak ada"} />
      </div>

      <Card
        className="mt-6"
        title={`Tagihan ${bulanLabel(period)}`}
        actions={
          <>
            <Dialog
              trigger="Bagi listrik & air"
              title="Bagi listrik & air"
              description={`Tanggungan pemilik (${rp(settings?.owner_electric_share)} listrik, ${rp(settings?.owner_water_share)} air) dikurangi dulu, sisanya dibagi rata ke semua tagihan bulan ini dan dibulatkan ke atas Rp100.`}
              variant="secondary"
              icon={<Droplets aria-hidden className="size-4" />}
            >
              <div className="flex flex-col gap-6">
                {(["listrik", "air"] as const).map((kind) => {
                  const u = util(kind);
                  return (
                    <ActionForm key={kind} action={splitUtility} className="flex flex-col gap-3">
                      <input type="hidden" name="period" value={ym(period)} />
                      <input type="hidden" name="kind" value={kind} />
                      <MoneyField
                        label={`Total ${kind} ${bulanLabel(period)}`}
                        name="total"
                        required
                        defaultValue={u?.total ?? ""}
                        hint={u ? `Terakhir dibagi: ${u.tenants_count} penghuni × ${rp(u.per_tenant)}.` : undefined}
                      />
                      <Submit variant="secondary">Bagi {kind}</Submit>
                    </ActionForm>
                  );
                })}
              </div>
            </Dialog>
            {generate("primary")}
          </>
        }
      >
        {list.length ? (
          <Table caption={`Tagihan ${bulanLabel(period)}`} head={["Kamar & penghuni", "Total", "Dibayar", "Status", "Jatuh tempo", "Aksi"]}>
            {list.map((i) => {
              const tenant = i.leases?.tenants;
              const total = i.total ?? 0;
              const remaining = total - (i.paid ?? 0);
              const room = i.leases?.room_number;
              return (
                <Tr key={i.id}>
                  <Td>
                    <p className="font-semibold text-navy-700">Kamar {room}</p>
                    <p className="text-sm text-subtle">{tenant?.name}</p>
                  </Td>
                  <Td label="Total" className="font-semibold tabular-nums">{rp(total)}</Td>
                  <Td label="Dibayar" className="tabular-nums">{rp(i.paid)}</Td>
                  <Td label="Status">
                    <Badge value={i.status ?? "belum"} />
                  </Td>
                  <Td label="Jatuh tempo">{tgl(i.due_date)}</Td>
                  <Td label="Aksi">
                    <div className="flex flex-wrap gap-2">
                      {remaining > 0 && (
                        <Dialog trigger="Catat bayar" title={`Catat pembayaran kamar ${room}`} description={`${tenant?.name} · sisa ${rp(remaining)}`} icon={<Banknote aria-hidden className="size-4" />}>
                          <ActionForm action={addPayment} className="flex flex-col gap-4">
                            <input type="hidden" name="invoice_id" value={i.id!} />
                            <MoneyField label="Jumlah dibayar" name="amount" required defaultValue={remaining} />
                            <div className="grid gap-4 sm:grid-cols-2">
                              <Select label="Metode" name="method" options={[["transfer", "Transfer"], ["tunai", "Tunai"], ["qris", "QRIS"]]} />
                              <Field label="Tanggal" name="paid_on" type="date" defaultValue={today()} required />
                            </div>
                            <Field label="Bukti (opsional)" name="proof" type="file" accept="image/*,application/pdf" />
                            <Field label="Catatan" name="note" />
                            <FormActions>
                              <Submit>Catat pembayaran</Submit>
                            </FormActions>
                          </ActionForm>
                        </Dialog>
                      )}
                      <Dialog trigger="Rincian" title={`Rincian tagihan kamar ${room}`} description={tenant?.name} variant="secondary" side icon={<ListChecks aria-hidden className="size-4" />}>
                        <ActionForm action={updateInvoice} className="flex flex-col gap-4">
                          <input type="hidden" name="id" value={i.id!} />
                          <div className="grid gap-4 sm:grid-cols-2">
                            <MoneyField label="Sewa" name="rent" defaultValue={i.rent ?? 0} />
                            <Field label="Jatuh tempo" name="due_date" type="date" defaultValue={i.due_date ?? ""} />
                            <MoneyField label="Listrik" name="electricity" defaultValue={i.electricity ?? 0} />
                            <MoneyField label="Air" name="water" defaultValue={i.water ?? 0} />
                            <MoneyField label="Lainnya" name="other" defaultValue={i.other ?? 0} />
                            <Field label="Keterangan lainnya" name="other_note" defaultValue={i.other_note ?? ""} />
                          </div>
                          <FormActions>
                            <Submit>Simpan rincian</Submit>
                          </FormActions>
                        </ActionForm>
                        <section aria-labelledby={`bayar-${i.id}`} className="mt-8">
                          <h3 id={`bayar-${i.id}`} className="font-semibold text-navy-700">
                            Pembayaran
                          </h3>
                          {i.payments?.length ? (
                            <ul className="mt-2 flex flex-col divide-y divide-line">
                              {i.payments.map((p) => (
                                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                                  <span className="text-sm">
                                    <b className="text-navy-700 tabular-nums">{rp(p.amount)}</b> · {p.method} · {tgl(p.paid_on)}
                                    {p.proof_path && (
                                      <a href={`/admin/berkas?path=${encodeURIComponent(p.proof_path)}`} target="_blank" rel="noopener" className="ml-2 font-semibold text-brand-700 underline">
                                        Lihat bukti<span className="sr-only"> (tab baru)</span>
                                      </a>
                                    )}
                                  </span>
                                  <ConfirmAction
                                    action={deletePayment}
                                    fields={{ id: p.id }}
                                    compact
                                    label={<><Trash2 aria-hidden className="size-4" /><span className="sr-only">Hapus pembayaran {rp(p.amount)}</span></>}
                                    title="Hapus catatan pembayaran?"
                                    message={`Pembayaran ${rp(p.amount)} tanggal ${tgl(p.paid_on)} akan dihapus dan sisa tagihan bertambah.`}
                                    confirmLabel="Ya, hapus"
                                  />
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-2 text-sm text-subtle">Belum ada pembayaran.</p>
                          )}
                        </section>
                      </Dialog>
                      {remaining > 0 && tenant && room && (
                        <WaLink
                          phone={toE164(tenant.phone)}
                          message={reminderMessage(tenant.name, room, {
                            period: i.period!, due_date: i.due_date!, rent: i.rent ?? 0, electricity: i.electricity ?? 0,
                            water: i.water ?? 0, other: i.other ?? 0, other_note: i.other_note, total, paid: i.paid ?? 0,
                          })}
                        >
                          Ingatkan
                        </WaLink>
                      )}
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </Table>
        ) : (
          <EmptyState icon={ReceiptText} title={`Belum ada tagihan ${bulanLabel(period)}`} action={generate("primary")}>
            Tagihan dibuat untuk semua sewa aktif. Jatuh tempo mengikuti tanggal masuk tiap penghuni.
          </EmptyState>
        )}
      </Card>
    </>
  );
}
