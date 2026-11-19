"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, fail, money, requireAdmin } from "@/lib/admin";

export async function saveSettings(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const months = Number(fd.get("retention_months"));
  if (!Number.isInteger(months) || months < 1 || months > 120) return { error: "Masa simpan harus 1–120 bulan." };
  const { error } = await supabase
    .from("settings")
    .update({
      owner_water_share: money(fd, "owner_water_share") ?? 0,
      owner_electric_share: money(fd, "owner_electric_share") ?? 0,
      retention_months: months,
    })
    .eq("id", true);
  const bad = fail(error);
  if (bad) return bad;
  revalidatePath("/admin", "layout");
  return { ok: "Pengaturan disimpan." };
}

/** Anonimkan penghuni yang keluar lebih lama dari masa simpan, dan hapus berkas KTP mereka. */
export async function runRetention(): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc("anonymize_old_tenants");
  const bad = fail(error, "Gagal menjalankan pembersihan.");
  if (bad) return bad;
  const paths = (data ?? []).map((r) => r.old_ktp_path).filter((p): p is string => Boolean(p));
  if (paths.length) await supabase.storage.from("kost-private").remove(paths);
  revalidatePath("/admin", "layout");
  return { ok: data?.length ? `${data.length} penghuni lama dianonimkan.` : "Tidak ada data yang perlu dibersihkan." };
}
