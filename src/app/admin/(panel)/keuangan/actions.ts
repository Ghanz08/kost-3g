"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, fail, file, money, requireAdmin, text, uploadPrivate } from "@/lib/admin";
import { today } from "@/lib/format";
import { CATEGORIES } from "./categories";

export async function addExpense(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const amount = money(fd, "amount");
  if (!amount || amount <= 0) return { error: "Isi jumlah pengeluaran." };
  const category = text(fd, "category") as (typeof CATEGORIES)[number];
  if (!CATEGORIES.includes(category)) return { error: "Pilih kategori." };
  const proof = file(fd, "proof");
  const proof_path = proof ? await uploadPrivate(supabase, "pengeluaran", proof) : null;

  const { error } = await supabase
    .from("expenses")
    .insert({ amount, category, spent_on: text(fd, "spent_on") ?? today(), note: text(fd, "note"), proof_path });
  const bad = fail(error);
  if (bad) return bad;
  revalidatePath("/admin", "layout");
  return { ok: "Pengeluaran dicatat." };
}

export async function deleteExpense(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const id = text(fd, "id")!;
  const { data } = await supabase.from("expenses").select("proof_path").eq("id", id).single();
  if (data?.proof_path) await supabase.storage.from("kost-private").remove([data.proof_path]);
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  const bad = fail(error, "Gagal menghapus.");
  if (bad) return bad;
  revalidatePath("/admin", "layout");
  return { ok: "Pengeluaran dihapus." };
}
