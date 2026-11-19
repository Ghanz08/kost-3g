import { requireAdmin } from "@/lib/admin";
import { monthEnd, monthStart } from "@/lib/format";

const csvCell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  // Cegah formula injection saat dibuka di Excel/Sheets.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** CSV arus kas sebulan: pembayaran masuk dan pengeluaran, siap dibuka di Excel/Sheets. */
export async function GET(request: Request) {
  const { supabase } = await requireAdmin();
  const period = monthStart(new URL(request.url).searchParams.get("bulan"));
  const end = monthEnd(period);
  const [{ data: payments }, { data: expenses }] = await Promise.all([
    supabase
      .from("payments")
      .select("paid_on, amount, method, note, invoices(period, leases(room_number, tenants(name)))")
      .gte("paid_on", period)
      .lte("paid_on", end)
      .order("paid_on"),
    supabase.from("expenses").select("spent_on, amount, category, note").gte("spent_on", period).lte("spent_on", end).order("spent_on"),
  ]);

  const rows: unknown[][] = [["tanggal", "jenis", "kategori/metode", "kamar", "nama", "keterangan", "jumlah"]];
  for (const p of payments ?? []) {
    const lease = p.invoices?.leases;
    rows.push([p.paid_on, "masuk", p.method, lease?.room_number, lease?.tenants?.name, p.note, p.amount]);
  }
  for (const e of expenses ?? []) rows.push([e.spent_on, "keluar", e.category, "", "", e.note, -e.amount]);

  const body = "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\n"); // BOM supaya Excel membaca UTF-8
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kost3g-keuangan-${period.slice(0, 7)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
