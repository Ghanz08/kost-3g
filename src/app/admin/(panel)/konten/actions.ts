"use server";

import { updateTag } from "next/cache";
import { type ActionResult, fail, file, requireAdmin, text } from "@/lib/admin";
import { cleanContent, contentDefs } from "@/lib/content-schema";

export async function saveContent(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const def = contentDefs.find((d) => d.key === text(fd, "key"));
  if (!def) return { error: "Konten tidak dikenal." };
  let value: unknown;
  try {
    value = cleanContent(def, JSON.parse(String(fd.get("value") ?? "null")));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Isi tidak valid." };
  }
  const { error } = await supabase.from("content").upsert({ key: def.key, value: value as never });
  const bad = fail(error);
  if (bad) return bad;
  updateTag("content");
  return { ok: `${def.title} disimpan. Situs sudah diperbarui.` };
}

/** Kembalikan ke isi bawaan dari kode (hapus versi database). */
export async function resetContent(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const key = text(fd, "key")!;
  const { error } = await supabase.from("content").delete().eq("key", key);
  const bad = fail(error);
  if (bad) return bad;
  updateTag("content");
  return { ok: "Dikembalikan ke isi bawaan." };
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Unggah foto galeri ke bucket publik, kembalikan URL-nya. */
export async function uploadGalleryPhoto(fd: FormData): Promise<{ url?: string; error?: string }> {
  const { supabase } = await requireAdmin();
  const f = file(fd, "photo");
  if (!f) return { error: "Pilih foto." };
  if (!IMAGE_TYPES.includes(f.type)) return { error: "Gunakan JPG, PNG, atau WebP." };
  const path = `galeri/${crypto.randomUUID()}.${f.type.split("/")[1]}`;
  const { error } = await supabase.storage.from("kost-public").upload(path, f, { contentType: f.type, cacheControl: "31536000" });
  if (error) return { error: `Gagal mengunggah: ${error.message}` };
  return { url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/kost-public/${path}` };
}
