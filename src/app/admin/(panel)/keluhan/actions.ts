"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, fail, file, money, requireAdmin, text, uploadPrivate } from "@/lib/admin";
import { today } from "@/lib/format";

export async function addTicket(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const title = text(fd, "title");
  if (!title) return { error: "Tulis judul keluhan." };
  const room = text(fd, "room_number");
  const photo = file(fd, "photo");
  const { error } = await supabase.from("tickets").insert({
    title,
    description: text(fd, "description"),
    room_number: room ? Number(room) : null,
    area: room ? null : text(fd, "area"),
    photo_path: photo ? await uploadPrivate(supabase, "keluhan", photo) : null,
  });
  const bad = fail(error);
  if (bad) return bad;
  revalidatePath("/admin", "layout");
  return { ok: "Keluhan dicatat." };
}

/** Ubah status. Saat selesai dengan biaya, biaya otomatis masuk ke pengeluaran kategori perbaikan. */
export async function updateTicket(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const id = text(fd, "id")!;
  const status = text(fd, "status") as "baru" | "dikerjakan" | "selesai";
  const cost = money(fd, "cost");
  const { data: ticket } = await supabase.from("tickets").select("title, status").eq("id", id).single();

  const { error } = await supabase
    .from("tickets")
    .update({ status, cost, resolved_at: status === "selesai" ? new Date().toISOString() : null })
    .eq("id", id);
  const bad = fail(error);
  if (bad) return bad;

  if (status === "selesai" && ticket?.status !== "selesai" && cost && cost > 0) {
    const { error: e2 } = await supabase
      .from("expenses")
      .insert({ amount: cost, category: "perbaikan", spent_on: today(), note: ticket?.title, ticket_id: id });
    const bad2 = fail(e2, "Keluhan selesai, tapi gagal mencatat pengeluaran.");
    if (bad2) return bad2;
  }
  revalidatePath("/admin", "layout");
  return { ok: status === "selesai" && cost ? "Selesai. Biaya dicatat di pengeluaran." : "Status diperbarui." };
}
