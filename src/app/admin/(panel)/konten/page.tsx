import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import { Badge, PageHeader } from "@/components/admin/ui";
import { contentDefaults } from "@/data/content";
import { requireAdmin } from "@/lib/admin";
import { contentDefs } from "@/lib/content-schema";
import { jam } from "@/lib/format";
import { ContentEditor } from "./content-editor";

export const metadata: Metadata = { title: "Konten situs" };

export default async function KontenPage() {
  const { supabase } = await requireAdmin();
  const { data: saved } = await supabase.from("content").select("key, value, updated_at");

  return (
    <>
      <PageHeader
        title="Konten situs"
        description="Ubah isi situs tanpa menyentuh kode. Klik “Simpan & terbitkan” dan situs langsung berubah. Harga dan status kamar ada di menu Kamar."
      />
      <div className="flex flex-col gap-3">
        {contentDefs.map((def) => {
          const row = saved?.find((s) => s.key === def.key);
          return (
            <details key={def.key} className="group rounded-2xl bg-surface shadow-card ring-1 ring-line">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl p-5 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0">
                  <span className="block font-display text-lg font-bold text-navy-700">{def.title}</span>
                  <span className="block text-sm text-subtle">{def.description}</span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  {row ? <Badge value="aktif" label={`Diubah ${jam(row.updated_at)}`} /> : <Badge value="perbaikan" label="Isi bawaan" />}
                  <ChevronDown aria-hidden className="size-5 text-subtle transition-transform group-open:rotate-180" />
                </span>
              </summary>
              <div className="border-t border-line p-5">
                <ContentEditor def={def} initial={row?.value ?? contentDefaults[def.key]} custom={Boolean(row)} />
              </div>
            </details>
          );
        })}
      </div>
    </>
  );
}
