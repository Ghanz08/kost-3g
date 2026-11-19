/** Dari mana calon penyewa tahu Kost 3g. Harus sama dengan check constraint kost.leads.source. */
export const SOURCES = [
  ["situs", "Situs (chat WA)"],
  ["form-situs", "Form “Kabari saya” di situs"],
  ["google-maps", "Google Maps"],
  ["instagram", "Instagram"],
  ["tiktok", "TikTok"],
  ["teman", "Teman / kenalan"],
  ["spanduk", "Spanduk / papan"],
  ["lainnya", "Lainnya"],
] as const;
export type Source = (typeof SOURCES)[number][0];
export const sourceLabel = Object.fromEntries(SOURCES) as Record<Source, string>;
