import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

/**
 * Buka berkas privat (KTP, bukti bayar, foto keluhan). Berkas dialirkan lewat server ini setelah
 * pemeriksaan admin, jadi storage Supabase tidak perlu dibuka ke internet dan tidak ada tautan yang bisa dibagikan.
 */
export async function GET(request: Request) {
  const { supabase } = await requireAdmin();
  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  if (!path) return new NextResponse("Berkas tidak ditemukan", { status: 404 });

  // Pembukaan KTP dicatat (siapa, kapan) sesuai prinsip akuntabilitas UU PDP.
  if (path.startsWith("ktp/")) {
    await supabase.rpc("log_access", { p_entity: "tenants", p_entity_id: url.searchParams.get("id") ?? path, p_action: "lihat ktp" });
  }
  const { data, error } = await supabase.storage.from("kost-private").download(path);
  if (error || !data) return new NextResponse("Berkas tidak ditemukan", { status: 404 });
  return new NextResponse(data, {
    headers: {
      "Content-Type": data.type || "application/octet-stream",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
