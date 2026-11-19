import { ArrowLeftRight, CalendarPlus, DoorOpen, History, KeyRound, LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, FormActions, Submit } from "@/components/admin/action-form";
import { Dialog } from "@/components/admin/dialog";
import { Check, Field, FieldGroup, MoneyField, Select, TextArea } from "@/components/admin/fields";
import { Badge, Card, EmptyState, LinkButton, PageHeader, Table, Td, Tr } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { addDays, rp, tgl, today } from "@/lib/format";
import { extendLease, moveLease, startLease } from "./actions";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Sewa" };

export default async function SewaPage({ searchParams }: PageProps<"/admin/sewa">) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const preselect = sp.penghuni as string | undefined;
  const preRoom = sp.kamar as string | undefined;
  const [{ data: active }, { data: history }, { data: rooms }, { data: tenants }] = await Promise.all([
    supabase.from("leases").select("*, tenants(id, name)").eq("status", "aktif").order("room_number"),
    supabase.from("leases").select("*, tenants(id, name)").eq("status", "selesai").order("ended_on", { ascending: false }).limit(20),
    supabase.from("rooms").select("number, status, monthly, yearly").order("number"),
    supabase.from("tenants").select("id, name, status, do_not_rent").neq("status", "keluar").is("anonymized_at", null).order("name"),
  ]);
  const free = rooms?.filter((r) => r.status !== "terisi") ?? [];
  const soon = addDays(today(), 30);
  const canStart = free.length > 0 && (tenants?.length ?? 0) > 0;

  const startDialog = (autoOpen: boolean) => (
    <Dialog trigger="Mulai sewa" defaultOpen={autoOpen} title="Mulai sewa (check-in)" description="Kamar otomatis jadi terisi di situs." side icon={<KeyRound aria-hidden className="size-4" />}>
      <ActionForm action={startLease} className="flex flex-col gap-4">
        <Select
          label="Penghuni"
          name="tenant_id"
          required
          defaultValue={preselect}
          options={(tenants ?? []).map((t) => [t.id, `${t.name}${t.status === "calon" ? " (calon)" : ""}${t.do_not_rent ? " ⚠ jangan terima lagi" : ""}`] as const)}
        />
        <Select
          label="Kamar"
          name="room_number"
          required
          defaultValue={preRoom}
          options={free.map((r) => [String(r.number), `Kamar ${r.number} · ${rp(r.monthly)}/bulan${r.yearly ? ` · ${rp(r.yearly)}/tahun` : ""}`] as const)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Skema" name="scheme" options={[["bulanan", "Bulanan"], ["tahunan", "Tahunan"]]} />
          <MoneyField label="Harga disepakati" name="price" required hint="Per bulan atau per tahun, sesuai skema." />
          <Field label="Tanggal masuk" name="start_date" type="date" defaultValue={today()} required />
          <Field label="Akhir kontrak" name="end_date" type="date" hint="Opsional." />
        </div>
        <MoneyField label="Deposit" name="deposit" defaultValue={0} />
        <FieldGroup legend="Checklist check-in">
          <Check name="kunci" label="Kunci kamar diserahkan" />
          <Check name="kamar_bersih" label="Kamar dalam keadaan bersih" />
          <Check name="fasilitas_lengkap" label="Tempat tidur, kipas, rak lengkap" />
          <Check name="aturan_dijelaskan" label="Tata tertib sudah dijelaskan" />
        </FieldGroup>
        <TextArea label="Catatan" name="checklist_note" rows={2} />
        <Check name="override" label="Tetap lanjutkan walau ditandai “jangan terima lagi”" hint="Hanya berlaku bila penghuni ini bertanda." />
        <FormActions>
          <Submit>Mulai sewa</Submit>
        </FormActions>
      </ActionForm>
    </Dialog>
  );

  return (
    <>
      <PageHeader title="Sewa" description="Hubungkan penghuni dengan kamar. Memulai atau mengakhiri sewa langsung mengubah status kamar di situs.">
        {canStart ? startDialog(Boolean(preselect || preRoom)) : null}
      </PageHeader>

      <div className="flex flex-col gap-6">
        <Card title={`Sewa aktif (${active?.length ?? 0})`}>
          {active?.length ? (
            <Table caption="Sewa aktif" head={["Kamar", "Penghuni", "Harga", "Masuk", "Kontrak s/d", "Aksi"]}>
              {active.map((l) => (
                <Tr key={l.id}>
                  <Td className="font-semibold text-navy-700">Kamar {l.room_number}</Td>
                  <Td label="Penghuni">
                    <Link href={`/admin/penghuni/${l.tenants?.id}`} className="font-semibold text-brand-700 underline-offset-2 hover:underline">
                      {l.tenants?.name}
                    </Link>
                  </Td>
                  <Td label="Harga" className="tabular-nums">
                    {rp(l.price)} / {l.scheme === "tahunan" ? "tahun" : "bulan"}
                  </Td>
                  <Td label="Masuk">{tgl(l.start_date)}</Td>
                  <Td label="Kontrak s/d">
                    {l.end_date ? (
                      <span className="inline-flex items-center gap-2">
                        {tgl(l.end_date)}
                        {l.end_date <= soon && <Badge value="telat" label="Segera habis" />}
                      </span>
                    ) : (
                      "Tanpa batas"
                    )}
                  </Td>
                  <Td label="Aksi">
                    <div className="flex flex-wrap gap-2">
                      <Dialog trigger="Perpanjang" title={`Perpanjang kamar ${l.room_number}`} variant="secondary" icon={<CalendarPlus aria-hidden className="size-4" />}>
                        <ActionForm action={extendLease} className="flex flex-col gap-4">
                          <input type="hidden" name="id" value={l.id} />
                          <Field label="Akhir kontrak baru" name="end_date" type="date" required defaultValue={l.end_date ?? ""} />
                          <MoneyField label="Harga baru" name="price" placeholder={String(l.price)} hint="Kosongkan bila harga tetap." />
                          <FormActions>
                            <Submit>Simpan</Submit>
                          </FormActions>
                        </ActionForm>
                      </Dialog>
                      {free.length > 0 && (
                        <Dialog trigger="Pindah kamar" title={`Pindahkan ${l.tenants?.name}`} description={`Dari kamar ${l.room_number}. Sewa lama ditutup, sewa baru dimulai di kamar tujuan.`} variant="secondary" icon={<ArrowLeftRight aria-hidden className="size-4" />}>
                          <ActionForm action={moveLease} className="flex flex-col gap-4">
                            <input type="hidden" name="id" value={l.id} />
                            <Select
                              label="Kamar tujuan"
                              name="room_number"
                              required
                              options={free.map((r) => [String(r.number), `Kamar ${r.number} · ${rp(r.monthly)}/bulan`] as const)}
                            />
                            <div className="grid gap-4 sm:grid-cols-2">
                              <Field label="Tanggal pindah" name="date" type="date" defaultValue={today()} required />
                              <MoneyField label="Harga di kamar baru" name="price" required defaultValue={l.price} hint="Per bulan atau per tahun, sesuai skema." />
                            </div>
                            <FormActions>
                              <Submit>Pindahkan</Submit>
                            </FormActions>
                          </ActionForm>
                        </Dialog>
                      )}
                      <Dialog
                        trigger="Check-out"
                        title={`Akhiri sewa kamar ${l.room_number}`}
                        description={`${l.tenants?.name} keluar; kamar ${l.room_number} akan tampil kosong di situs.`}
                        variant="danger"
                        side
                        icon={<LogOut aria-hidden className="size-4" />}
                      >
                        <CheckoutForm leaseId={l.id} />
                      </Dialog>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>
          ) : (
            <EmptyState
              icon={DoorOpen}
              title="Belum ada sewa aktif"
              action={canStart ? startDialog(false) : <LinkButton href="/admin/penghuni">Tambah penghuni dulu</LinkButton>}
            >
              Mulai sewa untuk menandai kamar terisi dan mulai membuat tagihan.
            </EmptyState>
          )}
        </Card>

        <Card title="Riwayat" description="20 sewa terakhir yang sudah selesai.">
          {history?.length ? (
            <Table caption="Riwayat sewa" head={["Kamar", "Penghuni", "Masuk", "Keluar", "Harga"]}>
              {history.map((l) => (
                <Tr key={l.id}>
                  <Td className="font-semibold text-navy-700">Kamar {l.room_number}</Td>
                  <Td label="Penghuni">{l.tenants?.name}</Td>
                  <Td label="Masuk">{tgl(l.start_date)}</Td>
                  <Td label="Keluar">{tgl(l.ended_on)}</Td>
                  <Td label="Harga" className="tabular-nums">{rp(l.price)}</Td>
                </Tr>
              ))}
            </Table>
          ) : (
            <EmptyState icon={History} title="Belum ada riwayat">
              Sewa yang diakhiri akan tercatat di sini.
            </EmptyState>
          )}
        </Card>
      </div>
    </>
  );
}
