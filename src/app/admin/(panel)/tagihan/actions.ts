"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, fail, file, money, requireAdmin, text, uploadPrivate } from "@/lib/admin";
import { monthEnd, monthStart, today } from "@/lib/format";

/** Jatuh tempo = tanggal masuk di bulan itu (31 Jan → 28/29 Feb). */
function dueDate(period: string, startDate: string) {
  const day = Math.min(Number(startDate.slice(8, 10)), Number(monthEnd(period).slice(8, 10)));
  return `${period.slice(0, 8)}${String(day).padStart(2, "0")}`;
}

/**
 * Buat tagihan bulan ini untuk semua sewa aktif yang belum punya.
 * Bulanan: sewa = harga. Tahunan: sewa ditagih di bulan ulang tahun kontrak saja, bulan lain Rp0
 * (tagihan tetap dibuat supaya listrik dan air bisa dibagi).
 */
export async function generateInvoices(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const period = monthStart(text(fd, "period"));
  const { data: leases, error } = await supabase
    .from("leases")
    .select("id, price, scheme, start_date")
    .eq("status", "aktif")
    .lte("start_date", monthEnd(period));
  const bad = fail(error, "Gagal membaca sewa.");
  if (bad) return bad;
  if (!leases?.length) return { error: "Tidak ada sewa aktif di bulan ini." };

  const rows = leases.map((l) => ({
    lease_id: l.id,
    period,
    due_date: dueDate(period, l.start_date),
    rent: l.scheme === "tahunan" && l.start_date.slice(5, 7) !== period.slice(5, 7) ? 0 : l.price,
  }));
  const { data, error: insErr } = await supabase
    .from("invoices")
    .upsert(rows, { onConflict: "lease_id,period", ignoreDuplicates: true })
    .select("id");
  const bad2 = fail(insErr, "Gagal membuat tagihan.");
  if (bad2) return bad2;
  revalidatePath("/admin", "layout");
  return { ok: data?.length ? `${data.length} tagihan dibuat.` : "Semua tagihan bulan ini sudah ada." };
}

/** Bagi rata listrik/air bulan ini ke semua tagihan bulan itu, setelah dikurangi tanggungan pemilik. */
export async function splitUtility(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const period = monthStart(text(fd, "period"));
  const kind = text(fd, "kind") === "air" ? "air" : "listrik";
  const total = money(fd, "total");
  if (total === null || total < 0) return { error: "Isi total biaya." };

  const [{ data: settings }, { data: invoices }] = await Promise.all([
    supabase.from("settings").select("owner_water_share, owner_electric_share").single(),
    supabase.from("invoices").select("id").eq("period", period),
  ]);
  if (!invoices?.length) return { error: "Buat tagihan bulan ini dulu, baru bagi biayanya." };

  const owner = kind === "air" ? settings!.owner_water_share : settings!.owner_electric_share;
  const share = Math.max(total - owner, 0);
  const perTenant = Math.ceil(share / invoices.length / 100) * 100; // dibulatkan ke atas Rp100

  const { error } = await supabase.from("utility_bills").upsert(
    { period, kind, total, owner_share: Math.min(owner, total), tenants_count: invoices.length, per_tenant: perTenant },
    { onConflict: "period,kind" },
  );
  const bad = fail(error);
  if (bad) return bad;
  const { error: upErr } = await supabase.from("invoices").update(kind === "air" ? { water: perTenant } : { electricity: perTenant }).eq("period", period);
  const bad2 = fail(upErr);
  if (bad2) return bad2;
  revalidatePath("/admin", "layout");
  return { ok: `${kind === "air" ? "Air" : "Listrik"}: ${invoices.length} penghuni, masing-masing Rp${perTenant.toLocaleString("id-ID")}.` };
}

export async function addPayment(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const invoice_id = text(fd, "invoice_id")!;
  const amount = money(fd, "amount");
  if (!amount || amount <= 0) return { error: "Isi jumlah pembayaran." };
  const method = text(fd, "method");
  const proof = file(fd, "proof");
  const proof_path = proof ? await uploadPrivate(supabase, `bukti/${invoice_id}`, proof) : null;

  const { error } = await supabase.from("payments").insert({
    invoice_id,
    amount,
    method: method === "tunai" || method === "qris" ? method : "transfer",
    paid_on: text(fd, "paid_on") ?? today(),
    note: text(fd, "note"),
    proof_path,
  });
  const bad = fail(error);
  if (bad) return bad;
  revalidatePath("/admin", "layout");
  return { ok: "Pembayaran dicatat." };
}

export async function updateInvoice(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("invoices")
    .update({
      rent: money(fd, "rent") ?? 0,
      electricity: money(fd, "electricity") ?? 0,
      water: money(fd, "water") ?? 0,
      other: money(fd, "other") ?? 0,
      other_note: text(fd, "other_note"),
      due_date: text(fd, "due_date") ?? undefined,
    })
    .eq("id", text(fd, "id")!);
  const bad = fail(error);
  if (bad) return bad;
  revalidatePath("/admin", "layout");
  return { ok: "Tagihan diperbarui." };
}

export async function deletePayment(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const id = text(fd, "id")!;
  const { data } = await supabase.from("payments").select("proof_path").eq("id", id).single();
  if (data?.proof_path) await supabase.storage.from("kost-private").remove([data.proof_path]);
  const { error } = await supabase.from("payments").delete().eq("id", id);
  const bad = fail(error, "Gagal menghapus.");
  if (bad) return bad;
  revalidatePath("/admin", "layout");
  return { ok: "Pembayaran dihapus." };
}
