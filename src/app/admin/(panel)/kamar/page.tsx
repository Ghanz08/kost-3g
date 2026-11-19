import { KeyRound, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, FormActions, Submit } from "@/components/admin/action-form";
import { Dialog } from "@/components/admin/dialog";
import { Field, MoneyField, Select, TextArea } from "@/components/admin/fields";
import { Badge, LinkButton, PageHeader } from "@/components/admin/ui";
import { Door } from "@/components/door";
import { statusLabel } from "@/data/rooms";
import { requireAdmin } from "@/lib/admin";
import { rp, tgl } from "@/lib/format";
import { saveRoom } from "./actions";

export const metadata: Metadata = { title: "Kamar" };

export default async function KamarPage() {
  const { supabase } = await requireAdmin();
  const [{ data: rooms }, { data: leases }] = await Promise.all([
    supabase.from("rooms").select("*").order("number"),
    supabase.from("leases").select("id, room_number, start_date, end_date, tenants(id, name)").eq("status", "aktif"),
  ]);
  const leaseOf = (n: number) => leases?.find((l) => l.room_number === n);

  return (
    <>
      <PageHeader
        title="Kamar"
        description="Status dan harga di sini langsung tampil di situs. Status juga berubah otomatis saat sewa dimulai atau diakhiri."
      />
      {(["atas", "bawah"] as const).map((floor) => (
        <section key={floor} aria-labelledby={`lantai-${floor}`} className="mb-8 last:mb-0">
          <h2 id={`lantai-${floor}`} className="mb-3 font-display text-lg font-bold text-navy-700">
            Lantai {floor}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {rooms
              ?.filter((r) => r.floor === floor)
              .map((r) => {
                const lease = leaseOf(r.number);
                return (
                  <li key={r.number} className="flex flex-col rounded-2xl bg-surface p-5 shadow-card ring-1 ring-line">
                    <div className="flex items-start gap-4">
                      <Door number={r.number} open={r.status === "kosong"} className="w-12 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display text-lg font-bold text-navy-700">Kamar {r.number}</h3>
                        <p className="text-sm text-subtle">{r.size}</p>
                        <div className="mt-2">
                          <Badge value={r.status} />
                        </div>
                      </div>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-4 text-sm">
                      <dt className="text-subtle">Bulanan</dt>
                      <dd className="text-right font-semibold text-navy-700 tabular-nums">{rp(r.monthly)}</dd>
                      <dt className="text-subtle">Tahunan</dt>
                      <dd className="text-right text-navy-700 tabular-nums">{r.yearly ? rp(r.yearly) : "Tanya via chat"}</dd>
                      <dt className="text-subtle">Penghuni</dt>
                      <dd className="truncate text-right">
                        {lease?.tenants ? (
                          <Link href={`/admin/penghuni/${lease.tenants.id}`} className="font-semibold text-brand-700 underline-offset-2 hover:underline">
                            {lease.tenants.name}
                          </Link>
                        ) : (
                          "–"
                        )}
                      </dd>
                      {lease?.end_date && (
                        <>
                          <dt className="text-subtle">Kontrak s/d</dt>
                          <dd className="text-right">{tgl(lease.end_date)}</dd>
                        </>
                      )}
                    </dl>
                    {r.notes && <p className="mt-3 rounded-lg bg-paper px-3 py-2 text-sm text-subtle">{r.notes}</p>}
                    <div className="mt-auto flex flex-col gap-2 pt-4">
                      {r.status !== "terisi" && (
                        <LinkButton href={`/admin/sewa?kamar=${r.number}`} icon={KeyRound}>
                          Isi kamar {r.number}
                        </LinkButton>
                      )}
                      <Dialog
                        trigger={`Ubah kamar ${r.number}`}
                        title={`Ubah kamar ${r.number}`}
                        description="Perubahan langsung tampil di situs."
                        variant="secondary"
                        icon={<Pencil aria-hidden className="size-4" />}
                        triggerClassName="w-full"
                      >
                        <ActionForm action={saveRoom} className="flex flex-col gap-4">
                          <input type="hidden" name="number" value={r.number} />
                          <Select
                            label="Status"
                            name="status"
                            defaultValue={r.status}
                            options={Object.entries(statusLabel)}
                            hint="Dipesan dan Perbaikan tampil sebagai tidak tersedia di situs."
                          />
                          <Field label="Ukuran" name="size" defaultValue={r.size} placeholder="2,5 × 2,5 m" />
                          <MoneyField label="Harga bulanan" name="monthly" required defaultValue={r.monthly} />
                          <MoneyField label="Harga tahunan" name="yearly" defaultValue={r.yearly ?? ""} hint="Kosongkan bila ditanyakan lewat chat." />
                          <TextArea label="Catatan internal" name="notes" defaultValue={r.notes ?? ""} hint="Tidak tampil di situs." />
                          <FormActions>
                            <Submit>Simpan</Submit>
                          </FormActions>
                        </ActionForm>
                      </Dialog>
                    </div>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </>
  );
}
