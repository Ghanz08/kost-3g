"use server";

import { createPublicClient } from "@/lib/supabase/server";

export type NotifyState = { ok?: boolean; error?: string } | undefined;

/**
 * Form "Kabari saya kalau ada kamar kosong". Pengunjung tidak login, jadi:
 * kolom jebakan (bot mengisinya), minimal 3 detik sejak form tampil, lalu validasi + batas harian di database.
 */
export async function requestNotify(_: NotifyState, fd: FormData): Promise<NotifyState> {
  if (String(fd.get("website") ?? "")) return { ok: true }; // bot: pura-pura berhasil
  const shownAt = Number(fd.get("t"));
  if (!shownAt || Date.now() - shownAt < 3000) return { ok: true };

  const name = String(fd.get("name") ?? "").trim();
  const phone = String(fd.get("phone") ?? "").trim();
  const interest = String(fd.get("interest") ?? "").trim();
  if (name.length < 2) return { error: "Tulis nama kamu." };
  if (phone.replace(/\D/g, "").length < 9) return { error: "Nomor WhatsApp belum lengkap." };

  const { data, error } = await createPublicClient().rpc("submit_interest", { p_name: name, p_phone: phone, p_interest: interest || undefined });
  if (error) return { error: "Maaf, sedang ada gangguan. Coba lagi sebentar, atau langsung chat WhatsApp." };
  if (data === "nama") return { error: "Nama terlalu pendek atau terlalu panjang." };
  if (data === "nomor") return { error: "Nomor WhatsApp tidak valid." };
  if (data === "penuh") return { error: "Hari ini sedang banyak permintaan. Langsung chat WhatsApp saja ya." };
  return { ok: true };
}
