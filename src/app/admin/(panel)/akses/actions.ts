"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, fail, requireAdmin, text } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Daftarkan email admin. Pendaftaran akun baru di Supabase Auth dimatikan (dipakai bersama aplikasi lain),
 * jadi akunnya dibuat di sini lewat service role. Login Google pertama kali akan menyambung ke akun ini.
 */
export async function addAdmin(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase, email: me } = await requireAdmin();
  const email = text(fd, "email")?.toLowerCase();
  if (!email || !EMAIL.test(email)) return { error: "Email tidak valid." };

  const { error } = await supabase.from("admins").insert({ email, name: text(fd, "name"), added_by: me });
  if (error?.code === "23505") return { error: "Email ini sudah terdaftar." };
  const bad = fail(error);
  if (bad) return bad;

  const { error: authErr } = await createServiceClient().auth.admin.createUser({ email, email_confirm: true });
  // Akun yang sudah ada (mis. pernah login sebelumnya) tidak masalah.
  if (authErr && !/already|registered|exists/i.test(authErr.message)) {
    return { error: `Email tersimpan, tapi akun login gagal dibuat: ${authErr.message}` };
  }
  revalidatePath("/admin/akses");
  return { ok: `${email} sekarang bisa masuk dengan Google.` };
}

export async function removeAdmin(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase, email: me } = await requireAdmin();
  const email = text(fd, "email")!;
  if (email === me) return { error: "Tidak bisa menghapus akses akunmu sendiri." };
  const { error } = await supabase.from("admins").delete().eq("email", email);
  const bad = fail(error, "Gagal menghapus.");
  if (bad) return bad;
  revalidatePath("/admin/akses");
  // Akun Auth sengaja tidak dihapus (bisa dipakai aplikasi lain); tanpa baris di kost.admins ia tidak bisa membuka apa pun.
  return { ok: `Akses ${email} dicabut.` };
}
