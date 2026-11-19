import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Wajib dipanggil di setiap halaman dan server action admin.
 * Lapisan pertama: sesi Google valid. Lapisan kedua: email ada di kost.admins (dicek database).
 * Lapisan ketiga ada di RLS, jadi query tetap ditolak walau pemeriksaan ini terlewat.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email as string | undefined;
  if (!email) redirect("/admin/masuk");
  const { data: ok } = await supabase.rpc("is_admin");
  if (!ok) redirect("/admin/masuk?galat=tidak-terdaftar");
  return { supabase, email: email.toLowerCase() };
}

/** Hasil server action yang ditampilkan di form. */
export type ActionResult = { error?: string; ok?: string } | undefined;

export function fail(error: { message: string } | null | undefined, fallback = "Gagal menyimpan."): ActionResult | null {
  return error ? { error: `${fallback} ${error.message}` } : null;
}

/** Ambil teks dari FormData; string kosong jadi null. */
export const text = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};
/** Angka rupiah dari input ("550.000", "550000"). */
export const money = (fd: FormData, key: string) => {
  const v = text(fd, key);
  return v === null ? null : Number(v.replace(/[^\d-]/g, "")) || 0;
};
export const file = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return v instanceof File && v.size > 0 ? v : null;
};

/** Unggah berkas ke bucket privat, kembalikan path-nya. */
export async function uploadPrivate(supabase: Awaited<ReturnType<typeof createClient>>, folder: string, f: File) {
  const ext = f.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("kost-private").upload(path, f, { contentType: f.type });
  if (error) throw new Error(`Gagal mengunggah berkas: ${error.message}`);
  return path;
}
