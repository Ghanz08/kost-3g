"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { type ActionResult, fail, file, requireAdmin, text, uploadPrivate } from "@/lib/admin";

function profile(fd: FormData) {
  return {
    name: text(fd, "name"),
    phone: text(fd, "phone"),
    origin: text(fd, "origin"),
    emergency_name: text(fd, "emergency_name"),
    emergency_relation: text(fd, "emergency_relation"),
    emergency_phone: text(fd, "emergency_phone"),
    notes: text(fd, "notes"),
  };
}

export async function createTenant(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { name, ...rest } = profile(fd);
  if (!name) return { error: "Nama wajib diisi." };
  const { data: row, error } = await supabase.from("tenants").insert({ name, ...rest }).select("id").single();
  const bad = fail(error);
  if (bad) return bad;
  redirect(`/admin/penghuni/${row!.id}`);
}

export async function updateTenant(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const id = text(fd, "id")!;
  const { name, ...rest } = profile(fd);
  if (!name) return { error: "Nama wajib diisi." };
  const { error } = await supabase.from("tenants").update({ name, ...rest }).eq("id", id);
  const bad = fail(error);
  if (bad) return bad;
  revalidatePath(`/admin/penghuni/${id}`);
  return { ok: "Data penghuni disimpan." };
}

/** KTP hanya boleh diunggah setelah persetujuan penghuni dicentang (UU PDP). */
export async function uploadKtp(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const id = text(fd, "id")!;
  if (fd.get("consent") !== "on") return { error: "Centang persetujuan penghuni dulu." };
  const ktp = file(fd, "ktp");
  if (!ktp) return { error: "Pilih foto KTP." };

  const { data: old } = await supabase.from("tenants").select("ktp_path").eq("id", id).single();
  const path = await uploadPrivate(supabase, `ktp/${id}`, ktp);
  const { error } = await supabase.from("tenants").update({ ktp_path: path, consent_at: new Date().toISOString() }).eq("id", id);
  const bad = fail(error);
  if (bad) return bad;
  if (old?.ktp_path) await supabase.storage.from("kost-private").remove([old.ktp_path]);
  revalidatePath(`/admin/penghuni/${id}`);
  return { ok: "Foto KTP tersimpan di penyimpanan privat." };
}

export async function deleteKtp(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const id = text(fd, "id")!;
  const { data } = await supabase.from("tenants").select("ktp_path").eq("id", id).single();
  if (data?.ktp_path) await supabase.storage.from("kost-private").remove([data.ktp_path]);
  const { error } = await supabase.from("tenants").update({ ktp_path: null }).eq("id", id);
  const bad = fail(error, "Gagal menghapus.");
  if (bad) return bad;
  revalidatePath(`/admin/penghuni/${id}`);
  return { ok: "Foto KTP dihapus." };
}

/** Hapus data pribadi satu penghuni yang sudah keluar; riwayat sewa dan pembayaran tetap. */
export async function anonymizeTenant(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const id = text(fd, "id")!;
  const { data: t } = await supabase.from("tenants").select("status, name, ktp_path").eq("id", id).single();
  if (t?.status !== "keluar") return { error: "Hanya penghuni yang sudah keluar yang bisa dianonimkan." };
  if (t.ktp_path) await supabase.storage.from("kost-private").remove([t.ktp_path]);
  const { error } = await supabase
    .from("tenants")
    .update({
      name: `${t.name.charAt(0).toUpperCase()}.`,
      phone: null, origin: null, emergency_name: null, emergency_relation: null, emergency_phone: null,
      notes: null, ktp_path: null, anonymized_at: new Date().toISOString(),
    })
    .eq("id", id);
  const bad = fail(error);
  if (bad) return bad;
  revalidatePath(`/admin/penghuni/${id}`);
  return { ok: "Data pribadi dihapus." };
}

const LEVELS = ["lisan", "tertulis", "terakhir"] as const;

/** Catat teguran. Jejak ini yang membuat keputusan mengeluarkan penghuni adil dan bisa dipertanggungjawabkan. */
export async function addViolation(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const tenant_id = text(fd, "tenant_id")!;
  const rule = text(fd, "rule");
  const level = text(fd, "level") as (typeof LEVELS)[number];
  if (!rule) return { error: "Pilih atau tulis aturan yang dilanggar." };
  if (!LEVELS.includes(level)) return { error: "Pilih tingkat teguran." };
  const photo = file(fd, "photo");
  const { error } = await supabase.from("violations").insert({
    tenant_id,
    rule,
    level,
    occurred_on: text(fd, "occurred_on") ?? undefined,
    description: text(fd, "description"),
    photo_path: photo ? await uploadPrivate(supabase, `teguran/${tenant_id}`, photo) : null,
  });
  const bad = fail(error);
  if (bad) return bad;
  revalidatePath(`/admin/penghuni/${tenant_id}`);
  return { ok: "Teguran dicatat." };
}

export async function deleteViolation(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const id = text(fd, "id")!;
  const { data } = await supabase.from("violations").select("tenant_id, photo_path").eq("id", id).single();
  if (data?.photo_path) await supabase.storage.from("kost-private").remove([data.photo_path]);
  const { error } = await supabase.from("violations").delete().eq("id", id);
  const bad = fail(error, "Gagal menghapus.");
  if (bad) return bad;
  revalidatePath(`/admin/penghuni/${data?.tenant_id}`);
  return { ok: "Teguran dihapus." };
}

export async function setDoNotRent(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const id = text(fd, "id")!;
  const on = text(fd, "value") === "on";
  const reason = text(fd, "reason");
  if (on && !reason) return { error: "Tulis alasannya, supaya admin lain paham kenapa." };
  const { error } = await supabase.from("tenants").update({ do_not_rent: on, do_not_rent_reason: on ? reason : null }).eq("id", id);
  const bad = fail(error);
  if (bad) return bad;
  revalidatePath(`/admin/penghuni/${id}`);
  return { ok: on ? "Ditandai “jangan terima lagi”." : "Tanda dicabut." };
}
