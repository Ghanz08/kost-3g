import { createHash } from "node:crypto";
import { ArrowRight, Ban, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import { ActionForm, FormActions, Submit } from "@/components/admin/action-form";
import { Dialog } from "@/components/admin/dialog";
import { Field, Select, TextArea } from "@/components/admin/fields";
import { Badge, Card, EmptyState, FilterTabs, PageHeader, WaLink } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { jam, toE164 } from "@/lib/format";
import { addLead, convertLead, updateLead } from "./actions";
import { SOURCES, sourceLabel, type Source } from "./sources";

export const metadata: Metadata = { title: "Calon penyewa" };

/** datetime-local butuh "YYYY-MM-DDTHH:mm" dalam WIB. */
const toLocalInput = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() + 7 * 3600e3).toISOString().slice(0, 16) : "");

export default async function CalonPage({ searchParams }: PageProps<"/admin/calon">) {
  const { supabase } = await requireAdmin();
  const tab = ((await searchParams).tab as string) === "selesai" ? "selesai" : "aktif";
  const [{ data: leads }, { data: vacant }, { data: flagged }] = await Promise.all([
    supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("rooms").select("number").eq("status", "kosong").order("number"),
    supabase.from("tenants").select("name, do_not_rent_phone_hash").eq("do_not_rent", true),
  ]);
  // Cocokkan dengan penghuni bertanda "jangan terima lagi": lewat hash nomor (tetap jalan setelah data dianonimkan) atau nama sama persis.
  const hash = (p: string | null) => {
    const n = toE164(p);
    return n ? createHash("sha256").update(n).digest("hex") : null;
  };
  const flaggedHashes = new Set(flagged?.map((f) => f.do_not_rent_phone_hash).filter(Boolean));
  const flaggedNames = new Set(flagged?.map((f) => f.name.trim().toLowerCase()));
  // Nomor sama = kuat. Nama sama saja bisa kebetulan (nama umum), jadi hanya diberi tanda "periksa".
  const flagOf = (l: { phone: string | null; name: string }) =>
    flaggedHashes.has(hash(l.phone)) ? "nomor" : flaggedNames.has(l.name.trim().toLowerCase()) ? "nama" : null;
  const vacantText = vacant?.length ? `kamar ${vacant.map((r) => r.number).join(" dan ")}` : null;
  const active = leads?.filter((l) => l.status === "baru" || l.status === "survey") ?? [];
  const closed = leads?.filter((l) => l.status === "jadi" || l.status === "batal") ?? [];
  const shown = tab === "selesai" ? closed : active;

  const addDialog = (
    <Dialog trigger="Catat calon" title="Catat calon penyewa" side icon={<UserPlus aria-hidden className="size-4" />}>
      <ActionForm action={addLead} className="flex flex-col gap-4">
        <Field label="Nama" name="name" required />
        <Field label="No. WhatsApp" name="phone" type="tel" inputMode="tel" />
        <Field label="Minat" name="interest" placeholder="Kamar 3, lantai atas, tahunan, …" />
        <Select label="Tahu dari mana?" name="source" defaultValue="situs" options={SOURCES} hint="Untuk tahu promosi mana yang paling berhasil." />
        <Field label="Jadwal survey" name="survey_at" type="datetime-local" hint="Opsional. Status otomatis jadi “Jadwal survey”." />
        <TextArea label="Catatan" name="notes" />
        <FormActions>
          <Submit>Simpan</Submit>
        </FormActions>
      </ActionForm>
    </Dialog>
  );

  return (
    <>
      <PageHeader
        title="Calon penyewa"
        description={vacantText ? `Saat ini ${vacantText} kosong. Tombol “Kabari” mengirim info itu lewat WhatsApp.` : "Semua kamar terisi. Catat yang bertanya supaya bisa dikabari saat ada kamar kosong."}
      >
        {addDialog}
      </PageHeader>
      <FilterTabs
        label="Saring calon penyewa"
        active={tab}
        items={[
          { value: "aktif", label: "Sedang diproses", count: active.length, href: "/admin/calon" },
          { value: "selesai", label: "Selesai", count: closed.length, href: "/admin/calon?tab=selesai" },
        ]}
      />
      <Card>
        {shown.length ? (
          <ul className="flex flex-col divide-y divide-line">
            {shown.map((l) => (
              <li key={l.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-navy-700">{l.name}</p>
                    <Badge value={l.status} />
                    {flagOf(l) && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-sm font-semibold text-red-700">
                        <Ban aria-hidden className="size-3.5" />
                        {flagOf(l) === "nomor" ? "Nomor sama dengan penghuni “jangan terima lagi”" : "Nama sama dengan penghuni “jangan terima lagi”, periksa dulu"}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-subtle">
                    {sourceLabel[l.source as Source] ?? l.source} · {l.interest ? `minat: ${l.interest} · ` : ""}dicatat {jam(l.created_at)}
                    {l.survey_at && ` · survey ${jam(l.survey_at)}`}
                  </p>
                  {l.notes && <p className="mt-1 text-sm">{l.notes}</p>}
                </div>
                {tab === "aktif" && (
                  <div className="flex flex-wrap gap-2">
                    {vacantText && (
                      <WaLink phone={toE164(l.phone)} message={`Halo ${l.name}, ${vacantText} di Kost 3g sedang kosong. Masih berminat? Bisa survey kapan saja, kabari jadwalnya ya.`}>
                        Kabari
                      </WaLink>
                    )}
                    <Dialog trigger="Perbarui" title={l.name} variant="secondary">
                      <ActionForm action={updateLead} className="flex flex-col gap-4">
                        <input type="hidden" name="id" value={l.id} />
                        <Select label="Status" name="status" defaultValue={l.status} options={[["baru", "Baru"], ["survey", "Jadwal survey"], ["jadi", "Jadi menyewa"], ["batal", "Batal"]]} />
                        <Select label="Tahu dari mana?" name="source" defaultValue={l.source} options={SOURCES} />
                        <Field label="Jadwal survey" name="survey_at" type="datetime-local" defaultValue={toLocalInput(l.survey_at)} />
                        <TextArea label="Catatan" name="notes" defaultValue={l.notes ?? ""} />
                        <FormActions>
                          <Submit>Simpan</Submit>
                        </FormActions>
                      </ActionForm>
                    </Dialog>
                    <ActionForm action={convertLead}>
                      <input type="hidden" name="id" value={l.id} />
                      <Submit pendingText="Memindahkan…">
                        Jadi menyewa
                        <ArrowRight aria-hidden className="size-4" />
                      </Submit>
                    </ActionForm>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={UserPlus} title={tab === "selesai" ? "Belum ada yang selesai" : "Belum ada calon penyewa"} action={tab === "aktif" ? addDialog : undefined}>
            {tab === "selesai" ? "Calon yang jadi menyewa atau batal muncul di sini." : "Catat orang yang bertanya lewat WhatsApp supaya bisa dikabari saat ada kamar kosong."}
          </EmptyState>
        )}
      </Card>
    </>
  );
}
