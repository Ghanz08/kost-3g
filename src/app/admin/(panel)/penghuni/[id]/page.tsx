import { Ban, FileLock2, KeyRound, LogOut, MessageSquareWarning, ShieldAlert, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActionForm, FormActions, Submit } from "@/components/admin/action-form";
import { ConfirmAction } from "@/components/admin/confirm";
import { Check, Field, Select, TextArea } from "@/components/admin/fields";
import { Dialog } from "@/components/admin/dialog";
import { Badge, Card, EmptyState, LinkButton, PageHeader, Table, Td, Tr, WaLink } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { getContent } from "@/lib/site-data";
import { rp, tgl, toE164, today } from "@/lib/format";
import { addViolation, anonymizeTenant, deleteKtp, deleteViolation, setDoNotRent, updateTenant, uploadKtp } from "../actions";
import { CheckoutForm } from "../../sewa/checkout-form";
import { TenantFields } from "../tenant-fields";

export const metadata: Metadata = { title: "Detail penghuni" };

export default async function PenghuniDetail({ params }: PageProps<"/admin/penghuni/[id]">) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const [{ data: t }, { data: leases }, { data: violations }, rules] = await Promise.all([
    supabase.from("tenants").select("*").eq("id", id).maybeSingle(),
    supabase.from("leases").select("*").eq("tenant_id", id).order("start_date", { ascending: false }),
    supabase.from("violations").select("*").eq("tenant_id", id).order("occurred_on", { ascending: false }),
    getContent("rules"),
  ]);
  if (!t) notFound();
  const activeLease = leases?.find((l) => l.status === "aktif");
  const ruleOptions = rules.flatMap((g) => g.items.map((it) => `${g.title}: ${it.label}`));
  const levelLabel: Record<string, string> = { lisan: "Teguran lisan", tertulis: "Teguran tertulis", terakhir: "Peringatan terakhir" };
  const reasonLabel: Record<string, string> = { "selesai-kontrak": "Kontrak selesai", "keluar-sendiri": "Keluar sendiri", dikeluarkan: "Dikeluarkan", "pindah-kamar": "Pindah kamar" };

  return (
    <>
      <PageHeader title={t.name} description={t.origin ?? undefined} back={{ href: "/admin/penghuni", label: "Semua penghuni" }}>
        <Badge value={t.status} />
        <WaLink phone={toE164(t.phone)} message={`Halo ${t.name}, `} size="md">
          Chat WhatsApp
        </WaLink>
        {t.status !== "aktif" && !t.anonymized_at && (
          <LinkButton href={`/admin/sewa?penghuni=${t.id}`} icon={KeyRound}>
            Mulai sewa
          </LinkButton>
        )}
      </PageHeader>

      {t.do_not_rent && (
        <p role="note" className="mb-6 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          <Ban aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            <b>Jangan terima lagi.</b> {t.do_not_rent_reason ?? ""}
          </span>
        </p>
      )}
      {t.anonymized_at && (
        <p role="note" className="mb-6 rounded-xl bg-filled px-4 py-3 text-sm text-navy-700">
          Data pribadi sudah dihapus pada {tgl(t.anonymized_at)}. Riwayat sewa dan pembayaran tetap disimpan.
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="flex flex-col gap-6">
          <Card title="Profil">
            <ActionForm action={updateTenant}>
              <input type="hidden" name="id" value={t.id} />
              <TenantFields t={t} />
              <FormActions>
                <Submit>Simpan profil</Submit>
              </FormActions>
            </ActionForm>
          </Card>

          <Card title="Riwayat sewa">
            {leases?.length ? (
              <Table caption="Riwayat sewa" head={["Kamar", "Masuk", "Keluar", "Skema", "Harga", "Status / alasan"]}>
                {leases.map((l) => (
                  <Tr key={l.id}>
                    <Td className="font-semibold text-navy-700">Kamar {l.room_number}</Td>
                    <Td label="Masuk">{tgl(l.start_date)}</Td>
                    <Td label="Keluar">{tgl(l.ended_on ?? l.end_date)}</Td>
                    <Td label="Skema" className="capitalize">{l.scheme}</Td>
                    <Td label="Harga" className="tabular-nums">{rp(l.price)}</Td>
                    <Td label="Status / alasan">
                      <Badge value={l.status} />
                      {l.end_reason && <p className="mt-1 text-sm text-subtle">{reasonLabel[l.end_reason]}{l.end_note ? `: ${l.end_note}` : ""}</p>}
                    </Td>
                  </Tr>
                ))}
              </Table>
            ) : (
              <EmptyState icon={KeyRound} title="Belum pernah menyewa">
                Mulai sewa untuk menghubungkan penghuni ini dengan kamar.
              </EmptyState>
            )}
          </Card>

          <Card
            title={`Teguran (${violations?.length ?? 0})`}
            description="Catat setiap pelanggaran tata tertib. Jejak ini jadi dasar yang adil kalau penghuni harus dikeluarkan."
            actions={
              !t.anonymized_at && (
                <Dialog trigger="Catat teguran" title={`Catat teguran untuk ${t.name}`} side variant="secondary" icon={<MessageSquareWarning aria-hidden className="size-4" />}>
                  <ActionForm action={addViolation} className="flex flex-col gap-4">
                    <input type="hidden" name="tenant_id" value={t.id} />
                    <Select label="Aturan yang dilanggar" name="rule" required options={ruleOptions} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Select
                        label="Tingkat"
                        name="level"
                        defaultValue={violations?.length ? (violations.length >= 2 ? "terakhir" : "tertulis") : "lisan"}
                        options={[["lisan", "Teguran lisan"], ["tertulis", "Teguran tertulis"], ["terakhir", "Peringatan terakhir"]]}
                        hint="Disarankan naik bertahap."
                      />
                      <Field label="Tanggal kejadian" name="occurred_on" type="date" defaultValue={today()} required />
                    </div>
                    <TextArea label="Kronologi singkat" name="description" rows={3} />
                    <Field label="Foto bukti (opsional)" name="photo" type="file" accept="image/*" />
                    <FormActions>
                      <Submit>Simpan teguran</Submit>
                    </FormActions>
                  </ActionForm>
                </Dialog>
              )
            }
          >
            {violations?.length ? (
              <ol className="relative ml-2 flex flex-col gap-4 border-l-2 border-line pl-5">
                {violations.map((v) => (
                  <li key={v.id} className="relative">
                    <span aria-hidden className={`absolute top-1.5 -left-[1.6rem] size-3 rounded-full ring-4 ring-surface ${v.level === "terakhir" ? "bg-red-600" : v.level === "tertulis" ? "bg-accent-500" : "bg-navy-700"}`} />
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-navy-700">{levelLabel[v.level]} · {tgl(v.occurred_on)}</p>
                        <p className="text-sm text-subtle">{v.rule}</p>
                        {v.description && <p className="mt-1 text-sm">{v.description}</p>}
                        {v.photo_path && (
                          <a href={`/admin/berkas?path=${encodeURIComponent(v.photo_path)}`} target="_blank" rel="noopener" className="mt-1 inline-block text-sm font-semibold text-brand-700 underline">
                            Lihat foto bukti<span className="sr-only"> (tab baru)</span>
                          </a>
                        )}
                      </div>
                      <ConfirmAction
                        action={deleteViolation}
                        fields={{ id: v.id }}
                        compact
                        label={<><Trash2 aria-hidden className="size-4" /><span className="sr-only">Hapus teguran {tgl(v.occurred_on)}</span></>}
                        title="Hapus teguran ini?"
                        message="Hanya hapus kalau salah catat. Teguran yang sah sebaiknya tetap tersimpan."
                        confirmLabel="Ya, hapus"
                      />
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-subtle">Belum ada teguran. 👍</p>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          {(activeLease || !t.anonymized_at) && (
            <Card title="Tindakan">
              <div className="flex flex-col gap-2">
                {activeLease && (
                  <Dialog
                    trigger="Keluarkan penghuni"
                    title={`Keluarkan ${t.name}`}
                    description={`Sewa kamar ${activeLease.room_number} diakhiri dan kamar tampil kosong di situs.`}
                    side
                    variant="danger"
                    icon={<LogOut aria-hidden className="size-4" />}
                  >
                    <CheckoutForm leaseId={activeLease.id} expel violations={violations?.length ?? 0} />
                  </Dialog>
                )}
                {!t.anonymized_at && (
                  <Dialog
                    trigger={t.do_not_rent ? "Cabut tanda “jangan terima lagi”" : "Tandai “jangan terima lagi”"}
                    title={t.do_not_rent ? "Cabut tanda?" : "Tandai “jangan terima lagi”"}
                    description="Hanya terlihat di admin. Muncul peringatan kalau nama atau nomor WA yang sama mendaftar lagi."
                    variant="secondary"
                    icon={<Ban aria-hidden className="size-4" />}
                  >
                    <ActionForm action={setDoNotRent} className="flex flex-col gap-4">
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="value" value={t.do_not_rent ? "off" : "on"} />
                      {!t.do_not_rent && <TextArea label="Alasan" name="reason" required rows={3} />}
                      <FormActions>
                        <Submit>{t.do_not_rent ? "Cabut tanda" : "Tandai"}</Submit>
                      </FormActions>
                    </ActionForm>
                  </Dialog>
                )}
              </div>
            </Card>
          )}
          <Card title="Foto KTP" description="Opsional. Penyimpanan privat; setiap kali dibuka tercatat di log.">
            {t.ktp_path ? (
              <div className="flex flex-col gap-3">
                <LinkButton href={`/admin/berkas?path=${encodeURIComponent(t.ktp_path)}&entity=tenants&id=${t.id}`} variant="secondary" icon={FileLock2} external>
                  Lihat KTP
                </LinkButton>
                {t.consent_at && <p className="text-sm text-subtle">Persetujuan penghuni dicatat {tgl(t.consent_at)}.</p>}
                <ConfirmAction
                  action={deleteKtp}
                  fields={{ id: t.id }}
                  label="Hapus foto KTP"
                  icon={<Trash2 aria-hidden className="size-4" />}
                  title="Hapus foto KTP?"
                  message="Berkas KTP dihapus permanen dari penyimpanan."
                  confirmLabel="Ya, hapus"
                />
              </div>
            ) : (
              <ActionForm action={uploadKtp} className="flex flex-col gap-4">
                <input type="hidden" name="id" value={t.id} />
                <Field label="Pilih foto atau PDF" name="ktp" type="file" accept="image/*,application/pdf" required />
                <Check name="consent" required label="Penghuni sudah setuju datanya disimpan untuk keperluan sewa." />
                <Submit>Unggah KTP</Submit>
              </ActionForm>
            )}
          </Card>

          {t.status === "keluar" && !t.anonymized_at && (
            <section aria-labelledby="zona-bahaya" className="rounded-2xl p-5 ring-1 ring-red-200 md:p-6">
              <h2 id="zona-bahaya" className="flex items-center gap-2 font-display text-lg font-bold text-red-700">
                <ShieldAlert aria-hidden className="size-5" />
                Hapus data pribadi
              </h2>
              <p className="mt-1 mb-4 text-sm text-subtle">
                Nama jadi inisial, kontak dan KTP dihapus. Riwayat sewa dan keuangan tetap. Tidak bisa dibatalkan.
              </p>
              <ConfirmAction
                action={anonymizeTenant}
                fields={{ id: t.id }}
                label="Hapus data pribadi"
                title={`Hapus data pribadi ${t.name}?`}
                message="Nama, kontak, kontak darurat, catatan, dan foto KTP dihapus permanen. Tindakan ini tidak bisa dibatalkan."
                confirmLabel="Ya, hapus permanen"
              />
            </section>
          )}
        </div>
      </div>
    </>
  );
}
