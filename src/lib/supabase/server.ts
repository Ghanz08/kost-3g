import "server-only";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { authCookie } from "./cookie";
import type { Database } from "./database.types";

/*
 * Server memanggil Supabase lewat alamat internal (SUPABASE_URL, mis. http://127.0.0.1:8000 di VPS).
 * Browser memakai NEXT_PUBLIC_SUPABASE_URL yang publik, hanya untuk login.
 * Semua tabel ada di schema "kost".
 */
const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Klien dengan sesi admin yang sedang login (cookie). Untuk halaman admin dan server action. */
export async function createClient() {
  // Sesi dibaca per permintaan; tanpa ini Next menolak Date.now() (cek kedaluwarsa token) saat prerender.
  await connection();
  const store = await cookies();
  return createServerClient<Database, "kost">(url, anonKey, {
    db: { schema: "kost" },
    cookieOptions: authCookie,
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        // Server Component tidak boleh menulis cookie; sesi disegarkan di proxy.ts.
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {}
      },
    },
  });
}

/** Klien tanpa sesi untuk data publik situs (kamar, konten). Aman dipakai di dalam "use cache". */
export function createPublicClient() {
  return createPlainClient<Database, "kost">(url, anonKey, {
    db: { schema: "kost" },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Klien service-role. Hanya untuk operasi Auth admin (mendaftarkan email admin). Jangan untuk query data. */
export function createServiceClient() {
  return createPlainClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
