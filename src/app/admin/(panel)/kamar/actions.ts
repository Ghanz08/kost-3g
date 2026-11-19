"use server";

import { updateTag } from "next/cache";
import { type ActionResult, fail, money, requireAdmin, text } from "@/lib/admin";

const STATUSES = ["kosong", "terisi", "dipesan", "perbaikan"];

export async function saveRoom(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const number = Number(fd.get("number"));
  const status = text(fd, "status");
  if (!status || !STATUSES.includes(status)) return { error: "Status tidak valid." };
  const monthly = money(fd, "monthly");
  if (!monthly || monthly <= 0) return { error: "Harga bulanan wajib diisi." };

  const { error } = await supabase
    .from("rooms")
    .update({ status, monthly, yearly: money(fd, "yearly"), size: text(fd, "size") ?? "", notes: text(fd, "notes") })
    .eq("number", number);
  const bad = fail(error);
  if (bad) return bad;
  updateTag("rooms"); // situs publik (hero, rumah, denah, tombol WA) langsung ikut berubah
  return { ok: `Kamar ${number} disimpan. Situs sudah diperbarui.` };
}
