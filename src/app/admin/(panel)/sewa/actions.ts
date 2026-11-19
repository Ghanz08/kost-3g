"use server";

import { revalidatePath, updateTag } from "next/cache";
import { type ActionResult, fail, money, requireAdmin, text } from "@/lib/admin";
import { today } from "@/lib/format";

const CHECKIN = ["kunci", "kamar_bersih", "fasilitas_lengkap", "aturan_dijelaskan"];
const CHECKOUT = ["kunci_kembali", "kamar_bersih", "tidak_ada_kerusakan", "tagihan_lunas"];
const REASONS = ["selesai-kontrak", "keluar-sendiri", "dikeluarkan"] as const;
const checklist = (fd: FormData, keys: string[]) => ({
  ...Object.fromEntries(keys.map((k) => [k, fd.get(k) === "on"])),
  catatan: text(fd, "checklist_note"),
});

type Supabase = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

/** Status kamar dan penghuni mengikuti sewa: kamar kosong lagi, penghuni "keluar" bila tak punya sewa aktif lain. */
async function afterLeaseEnded(supabase: Supabase, room: number, tenantId: string) {
  const { count } = await supabase.from("leases").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "aktif");
  await Promise.all([
    supabase.from("rooms").update({ status: "kosong" }).eq("number", room),
    count ? null : supabase.from("tenants").update({ status: "keluar" }).eq("id", tenantId),
  ]);
}

export async function startLease(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const room_number = Number(fd.get("room_number"));
  const tenant_id = text(fd, "tenant_id");
  const price = money(fd, "price");
  const start_date = text(fd, "start_date") ?? today();
  if (!room_number || !tenant_id) return { error: "Pilih kamar dan penghuni." };
  if (!price) return { error: "Harga sewa wajib diisi." };

  // Penghuni bertanda "jangan terima lagi" (atau nomornya cocok) hanya bisa diterima bila admin sengaja melanjutkan.
  const { data: t } = await supabase.from("tenants").select("name, phone, do_not_rent").eq("id", tenant_id).single();
  const { data: phoneFlagged } = await supabase.rpc("flagged_phone", { p: t?.phone ?? "" });
  if ((t?.do_not_rent || phoneFlagged) && fd.get("override") !== "on") {
    return { error: `${t?.name} ditandai "jangan terima lagi". Centang "Tetap lanjutkan" kalau memang ingin menerimanya.` };
  }

  const { error } = await supabase.from("leases").insert({
    room_number,
    tenant_id,
    price,
    start_date,
    scheme: text(fd, "scheme") === "tahunan" ? "tahunan" : "bulanan",
    deposit: money(fd, "deposit") ?? 0,
    end_date: text(fd, "end_date"),
    notes: text(fd, "notes"),
    checkin: checklist(fd, CHECKIN),
  });
  if (error?.code === "23505") return { error: `Kamar ${room_number} masih punya sewa aktif. Akhiri dulu sewa sebelumnya.` };
  const bad = fail(error);
  if (bad) return bad;

  await Promise.all([
    supabase.from("rooms").update({ status: "terisi" }).eq("number", room_number),
    supabase.from("tenants").update({ status: "aktif" }).eq("id", tenant_id),
  ]);
  updateTag("rooms");
  revalidatePath("/admin", "layout");
  return { ok: `Sewa kamar ${room_number} dimulai. Kamar ditandai terisi di situs.` };
}

/** Akhiri sewa. "Dikeluarkan" wajib beralasan, dan bisa sekalian menandai "jangan terima lagi". */
export async function endLease(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const id = text(fd, "id")!;
  const reason = text(fd, "end_reason") as (typeof REASONS)[number];
  const note = text(fd, "end_note");
  if (!REASONS.includes(reason)) return { error: "Pilih alasan keluar." };
  if (reason === "dikeluarkan" && !note) return { error: "Tulis alasan penghuni dikeluarkan. Catatan ini jadi pegangan kalau ada sengketa." };

  const { data: lease } = await supabase.from("leases").select("room_number, tenant_id").eq("id", id).single();
  if (!lease) return { error: "Sewa tidak ditemukan." };

  const { error } = await supabase
    .from("leases")
    .update({ status: "selesai", ended_on: text(fd, "ended_on") ?? today(), checkout: checklist(fd, CHECKOUT), end_reason: reason, end_note: note })
    .eq("id", id);
  const bad = fail(error);
  if (bad) return bad;

  if (fd.get("do_not_rent") === "on") {
    await supabase.from("tenants").update({ do_not_rent: true, do_not_rent_reason: note }).eq("id", lease.tenant_id);
  }
  await afterLeaseEnded(supabase, lease.room_number, lease.tenant_id);
  updateTag("rooms");
  revalidatePath("/admin", "layout");
  return { ok: `Sewa diakhiri. Kamar ${lease.room_number} kembali kosong di situs.` };
}

/** Pindah kamar: sewa lama ditutup ("pindah-kamar"), sewa baru dimulai di kamar tujuan pada tanggal yang sama. */
export async function moveLease(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const id = text(fd, "id")!;
  const to = Number(fd.get("room_number"));
  const date = text(fd, "date") ?? today();
  const price = money(fd, "price");
  if (!to) return { error: "Pilih kamar tujuan." };
  if (!price) return { error: "Isi harga di kamar baru." };

  const { data: old } = await supabase.from("leases").select("*").eq("id", id).single();
  if (!old) return { error: "Sewa tidak ditemukan." };
  if (old.room_number === to) return { error: "Kamar tujuan sama dengan kamar sekarang." };

  const { error: endErr } = await supabase
    .from("leases")
    .update({ status: "selesai", ended_on: date, end_reason: "pindah-kamar", end_note: `Pindah ke kamar ${to}` })
    .eq("id", id);
  const bad = fail(endErr);
  if (bad) return bad;

  const { error } = await supabase.from("leases").insert({
    room_number: to,
    tenant_id: old.tenant_id,
    price,
    scheme: old.scheme,
    deposit: old.deposit,
    start_date: date,
    end_date: old.end_date,
    notes: `Pindahan dari kamar ${old.room_number}`,
    checkin: { pindahan: true },
  });
  if (error) {
    // Kembalikan sewa lama supaya data tidak setengah jadi.
    await supabase.from("leases").update({ status: "aktif", ended_on: null, end_reason: null, end_note: null }).eq("id", id);
    if (error.code === "23505") return { error: `Kamar ${to} masih punya sewa aktif.` };
    return { error: `Gagal memindahkan. ${error.message}` };
  }
  await Promise.all([
    supabase.from("rooms").update({ status: "kosong" }).eq("number", old.room_number),
    supabase.from("rooms").update({ status: "terisi" }).eq("number", to),
  ]);
  updateTag("rooms");
  revalidatePath("/admin", "layout");
  return { ok: `Pindah dari kamar ${old.room_number} ke kamar ${to}. Situs sudah diperbarui.` };
}

export async function extendLease(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const id = text(fd, "id")!;
  const end_date = text(fd, "end_date");
  if (!end_date) return { error: "Isi tanggal akhir kontrak yang baru." };
  const { error } = await supabase.from("leases").update({ end_date, price: money(fd, "price") ?? undefined }).eq("id", id);
  const bad = fail(error);
  if (bad) return bad;
  revalidatePath("/admin/sewa");
  return { ok: "Kontrak diperpanjang." };
}
