import type { ContentKey } from "@/data/content";

/*
 * Bentuk tiap konten yang bisa diubah di /admin/konten. Dipakai editor (browser) untuk menggambar form
 * dan server untuk memvalidasi isi sebelum disimpan, jadi keduanya selalu sepakat.
 */

export type FieldDef =
  | { key: string; label: string; type: "text" | "textarea" | "checkbox" | "image" }
  | { key: string; label: string; type: "select"; options: [string, string][] }
  | { key: string; label: string; type: "list"; item: string; fields: FieldDef[] };

/** `fields` untuk daftar objek; `strings` untuk daftar teks biasa. */
export type ContentDef = { key: ContentKey; title: string; description: string; item: string } & (
  | { fields: FieldDef[] }
  | { strings: true }
);

export const contentDefs: ContentDef[] = [
  {
    key: "costRows",
    title: "Rincian biaya",
    description: "Tabel “Yang kamu bayar tiap bulan” di beranda.",
    item: "baris",
    fields: [
      { key: "item", label: "Komponen", type: "text" },
      { key: "value", label: "Nilai", type: "text" },
      { key: "highlight", label: "Tandai hijau (mis. deposit Rp0)", type: "checkbox" },
    ],
  },
  {
    key: "sharedFacilities",
    title: "Fasilitas bersama",
    description: "Daftar “Dipakai bersama” di samping denah rumah.",
    item: "fasilitas",
    fields: [
      { key: "place", label: "Tempat", type: "text" },
      { key: "text", label: "Fasilitas", type: "text" },
      {
        key: "icon",
        label: "Ikon",
        type: "select",
        options: [["wifi", "Wi-Fi"], ["motor", "Parkir (P)"], ["mandi", "Kamar mandi"], ["dapur", "Dapur"], ["jemuran", "Jemuran"], ["cctv", "CCTV"]],
      },
    ],
  },
  {
    key: "gallery",
    title: "Galeri foto",
    description: "Foto di bagian “Isi rumahnya”. Urutan di sini = urutan di situs.",
    item: "foto",
    fields: [
      { key: "src", label: "Foto", type: "image" },
      { key: "caption", label: "Keterangan", type: "text" },
      { key: "alt", label: "Deskripsi untuk pembaca layar", type: "text" },
    ],
  },
  {
    key: "ruleHighlights",
    title: "Aturan singkat",
    description: "Empat aturan utama di beranda.",
    item: "aturan",
    strings: true,
  },
  {
    key: "rules",
    title: "Tata tertib lengkap",
    description: "Halaman /tata-tertib, dikelompokkan per topik.",
    item: "kelompok",
    fields: [
      { key: "title", label: "Judul kelompok", type: "text" },
      {
        key: "items",
        label: "Aturan",
        type: "list",
        item: "aturan",
        fields: [
          { key: "label", label: "Label", type: "text" },
          { key: "text", label: "Isi", type: "textarea" },
        ],
      },
    ],
  },
  {
    key: "faq",
    title: "Pertanyaan umum (FAQ)",
    description: "Halaman /faq. Centang “tampil di beranda” untuk pertanyaan yang muncul di beranda.",
    item: "kategori",
    fields: [
      { key: "title", label: "Kategori", type: "text" },
      {
        key: "items",
        label: "Pertanyaan",
        type: "list",
        item: "pertanyaan",
        fields: [
          { key: "q", label: "Pertanyaan", type: "text" },
          { key: "a", label: "Jawaban", type: "textarea" },
          { key: "highlight", label: "Tampil di beranda", type: "checkbox" },
        ],
      },
    ],
  },
];

/** Bentuk satu baris kosong untuk tombol "tambah". */
export function emptyItem(fields: FieldDef[]): Record<string, unknown> {
  return Object.fromEntries(
    fields.map((f) => [f.key, f.type === "checkbox" ? false : f.type === "list" ? [] : f.type === "select" ? f.options[0][0] : ""]),
  );
}

/** Validasi dan bersihkan isi dari editor. Melempar Error berbahasa manusia kalau tidak sesuai. */
export function cleanContent(def: ContentDef, value: unknown): unknown {
  if (!Array.isArray(value)) throw new Error("Isi harus berupa daftar.");
  if ("strings" in def) {
    return value.map((v, i) => {
      if (typeof v !== "string" || !v.trim()) throw new Error(`${def.item} ke-${i + 1} masih kosong.`);
      return v.trim();
    });
  }
  return cleanList(def.fields, value, def.item);
}

function cleanList(fields: FieldDef[], value: unknown[], item: string): Record<string, unknown>[] {
  return value.map((row, i) => {
    if (!row || typeof row !== "object") throw new Error(`${item} ke-${i + 1} tidak valid.`);
    const r = row as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const f of fields) {
      const v = r[f.key];
      if (f.type === "checkbox") {
        if (v) out[f.key] = true; // false tidak disimpan, sama seperti isi bawaan
      } else if (f.type === "list") {
        out[f.key] = cleanList(f.fields, Array.isArray(v) ? v : [], f.item);
      } else if (f.type === "select") {
        if (!f.options.some(([o]) => o === v)) throw new Error(`${f.label} pada ${item} ke-${i + 1} tidak valid.`);
        out[f.key] = v;
      } else {
        if (typeof v !== "string" || !v.trim()) throw new Error(`${f.label} pada ${item} ke-${i + 1} masih kosong.`);
        out[f.key] = v.trim();
      }
    }
    return out;
  });
}
