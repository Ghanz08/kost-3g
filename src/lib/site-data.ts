import "server-only";
import { cacheTag } from "next/cache";
import { type ContentKey, type ContentMap, contentDefaults } from "@/data/content";
import type { Room } from "@/data/rooms";
import { createPublicClient } from "@/lib/supabase/server";

/*
 * Data publik situs dari Supabase. Di-cache dan ikut dirender statis; admin memanggil
 * updateTag("rooms") / updateTag("content") setelah menyimpan supaya situs langsung berubah.
 */

const tanggal = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });

export async function getRooms(): Promise<{ rooms: Room[]; updatedAt: string }> {
  "use cache";
  cacheTag("rooms");
  const { data, error } = await createPublicClient()
    .from("rooms")
    .select("number, floor, size, monthly, yearly, status, updated_at")
    .order("number");
  if (error) throw new Error(`Gagal membaca kamar dari Supabase: ${error.message}`);
  const latest = data.reduce((max, r) => (r.updated_at > max ? r.updated_at : max), "");
  return {
    rooms: data.map((r) => ({ number: r.number, floor: r.floor, size: r.size, monthly: r.monthly, yearly: r.yearly, status: r.status }) as Room),
    updatedAt: latest ? tanggal.format(new Date(latest)) : "",
  };
}

/** Isi konten dari database, atau isi bawaan dari `src/data/content.ts` kalau belum pernah diubah. */
export async function getContent<K extends ContentKey>(key: K): Promise<ContentMap[K]> {
  "use cache";
  cacheTag("content");
  const { data, error } = await createPublicClient().from("content").select("value").eq("key", key).maybeSingle();
  if (error) throw new Error(`Gagal membaca konten "${key}": ${error.message}`);
  return (data?.value as ContentMap[K] | undefined) ?? contentDefaults[key];
}
