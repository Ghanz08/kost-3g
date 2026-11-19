"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { type ActionResult, fail, requireAdmin, text } from "@/lib/admin";
import { SOURCES, type Source } from "./sources";

const source = (fd: FormData) => {
  const v = text(fd, "source") as Source;
  return SOURCES.some(([s]) => s === v) ? v : "lainnya";
};

const STATUSES = ["baru", "survey", "jadi", "batal"] as const;
type Status = (typeof STATUSES)[number];

export async function addLead(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const name = text(fd, "name");
  if (!name) return { error: "Isi nama." };
  const survey = text(fd, "survey_at");
  const { error } = await supabase.from("leads").insert({
    name,
    phone: text(fd, "phone"),
    interest: text(fd, "interest"),
    notes: text(fd, "notes"),
    source: source(fd),
    survey_at: survey ? new Date(`${survey}:00+07:00`).toISOString() : null,
    status: survey ? "survey" : "baru",
  });
  const bad = fail(error);
  if (bad) return bad;
  revalidatePath("/admin", "layout");
  return { ok: "Calon penyewa dicatat." };
}

export async function updateLead(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const status = text(fd, "status") as Status;
  if (!STATUSES.includes(status)) return { error: "Status tidak valid." };
  const survey = text(fd, "survey_at");
  const { error } = await supabase
    .from("leads")
    .update({ status, notes: text(fd, "notes"), source: source(fd), survey_at: survey ? new Date(`${survey}:00+07:00`).toISOString() : null })
    .eq("id", text(fd, "id")!);
  const bad = fail(error);
  if (bad) return bad;
  revalidatePath("/admin", "layout");
  return { ok: "Disimpan." };
}

/** Calon yang jadi menyewa: salin ke data penghuni, lalu lanjut ke form sewa. */
export async function convertLead(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const id = text(fd, "id")!;
  const { data: lead } = await supabase.from("leads").select("name, phone, notes").eq("id", id).single();
  if (!lead) return { error: "Data tidak ditemukan." };
  const { data: tenant, error } = await supabase
    .from("tenants")
    .insert({ name: lead.name, phone: lead.phone, notes: lead.notes, status: "calon" })
    .select("id")
    .single();
  const bad = fail(error);
  if (bad) return bad;
  await supabase.from("leads").update({ status: "jadi" }).eq("id", id);
  redirect(`/admin/sewa?penghuni=${tenant!.id}`);
}
