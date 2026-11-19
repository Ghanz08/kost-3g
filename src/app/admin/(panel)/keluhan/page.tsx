import { ImageIcon, Plus, Wrench } from "lucide-react";
import type { Metadata } from "next";
import { ActionForm, FormActions, Submit } from "@/components/admin/action-form";
import { Dialog } from "@/components/admin/dialog";
import { Field, MoneyField, Select, TextArea } from "@/components/admin/fields";
import { Badge, Card, EmptyState, FilterTabs, LinkButton, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { jam, rp } from "@/lib/format";
import { addTicket, updateTicket } from "./actions";

export const metadata: Metadata = { title: "Keluhan" };

const AREAS = ["Kamar mandi bawah", "Kamar mandi atas", "Dapur", "Ruang bersama", "Lorong", "Parkir", "Jemuran", "Teras", "Lainnya"];

export default async function KeluhanPage({ searchParams }: PageProps<"/admin/keluhan">) {
  const { supabase } = await requireAdmin();
  const tab = ((await searchParams).tab as string) === "selesai" ? "selesai" : "terbuka";
  const [{ data: tickets }, { data: rooms }] = await Promise.all([
    supabase.from("tickets").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("rooms").select("number").order("number"),
  ]);
  const open = tickets?.filter((t) => t.status !== "selesai") ?? [];
  const done = tickets?.filter((t) => t.status === "selesai") ?? [];
  const shown = tab === "selesai" ? done : open;

  const addDialog = (
    <Dialog trigger="Catat keluhan" title="Catat keluhan" description="Kerusakan atau masalah dari penghuni." side icon={<Plus aria-hidden className="size-4" />}>
      <ActionForm action={addTicket} className="flex flex-col gap-4">
        <Field label="Judul" name="title" required placeholder="Keran bocor, lampu putus, …" />
        <Select
          label="Kamar"
          name="room_number"
          options={[["", "Bukan kamar (area bersama)"], ...(rooms ?? []).map((r) => [String(r.number), `Kamar ${r.number}`] as const)]}
        />
        <Select label="Area" name="area" options={AREAS} hint="Dipakai kalau bukan di kamar." />
        <TextArea label="Keterangan" name="description" />
        <Field label="Foto (opsional)" name="photo" type="file" accept="image/*" />
        <FormActions>
          <Submit>Simpan keluhan</Submit>
        </FormActions>
      </ActionForm>
    </Dialog>
  );

  return (
    <>
      <PageHeader title="Keluhan & perbaikan" description="Biaya perbaikan yang ditandai selesai otomatis masuk ke pengeluaran.">
        {addDialog}
      </PageHeader>
      <FilterTabs
        label="Saring keluhan"
        active={tab}
        items={[
          { value: "terbuka", label: "Belum selesai", count: open.length, href: "/admin/keluhan" },
          { value: "selesai", label: "Selesai", count: done.length, href: "/admin/keluhan?tab=selesai" },
        ]}
      />
      <Card>
        {shown.length ? (
          <ul className="flex flex-col divide-y divide-line">
            {shown.map((t) => (
              <li key={t.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-navy-700">{t.title}</p>
                    <Badge value={t.status} />
                  </div>
                  <p className="mt-0.5 text-sm text-subtle">
                    {t.room_number ? `Kamar ${t.room_number}` : t.area} · dicatat {jam(t.created_at)}
                    {t.cost ? ` · biaya ${rp(t.cost)}` : ""}
                  </p>
                  {t.description && <p className="mt-1 text-sm">{t.description}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {t.photo_path && (
                    <LinkButton href={`/admin/berkas?path=${encodeURIComponent(t.photo_path)}`} variant="secondary" icon={ImageIcon} external>
                      Foto
                    </LinkButton>
                  )}
                  {t.status !== "selesai" && (
                    <Dialog trigger="Perbarui" title={t.title} description={t.room_number ? `Kamar ${t.room_number}` : (t.area ?? undefined)} variant="secondary">
                      <ActionForm action={updateTicket} className="flex flex-col gap-4">
                        <input type="hidden" name="id" value={t.id} />
                        <Select label="Status" name="status" defaultValue={t.status} options={[["baru", "Baru"], ["dikerjakan", "Dikerjakan"], ["selesai", "Selesai"]]} />
                        <MoneyField label="Biaya perbaikan" name="cost" defaultValue={t.cost ?? ""} hint="Kalau status Selesai, biaya dicatat sebagai pengeluaran." />
                        <FormActions>
                          <Submit>Simpan</Submit>
                        </FormActions>
                      </ActionForm>
                    </Dialog>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={Wrench} title={tab === "selesai" ? "Belum ada keluhan selesai" : "Tidak ada keluhan terbuka"} action={tab === "terbuka" ? addDialog : undefined}>
            {tab === "selesai" ? "Keluhan yang ditandai selesai muncul di sini." : "Catat kerusakan dari penghuni supaya tidak terlupa."}
          </EmptyState>
        )}
      </Card>
    </>
  );
}
