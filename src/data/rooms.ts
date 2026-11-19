import type { StaticImageData } from "next/image";
import fotoKamar1 from "@/assets/foto/kamar-1.jpg";
import fotoKamar2 from "@/assets/foto/kamar-2.jpg";

/** "dipesan" dan "perbaikan" tampil sebagai tidak tersedia di situs. */
export type RoomStatus = "kosong" | "terisi" | "dipesan" | "perbaikan";
export type Floor = "atas" | "bawah";

export interface Room {
  number: number;
  floor: Floor;
  /** Ukuran kamar, atau keterangan singkat kalau belum diukur. */
  size: string;
  monthly: number;
  /** Harga promo tahunan. `null` berarti ditanyakan lewat WhatsApp. */
  yearly: number | null;
  status: RoomStatus;
}

/*
 * Data kamar sekarang ada di database (tabel kost.rooms) dan diubah lewat /admin/kamar.
 * Situs membacanya lewat `getRooms()` di `src/lib/site-data.ts`. File ini hanya berisi tipe,
 * info per lantai, dan fungsi bantu yang menerima daftar kamar.
 */

export const floors: Record<
  Floor,
  { label: string; summary: string; photo: StaticImageData; photoAlt: string }
> = {
  atas: {
    label: "Lantai atas",
    summary: "Empat kamar dan satu kamar mandi, termasuk kamar 4 yang paling luas.",
    photo: fotoKamar2,
    photoAlt: "Contoh kamar Kost 3g dengan tempat tidur, rak, dan lantai keramik",
  },
  bawah: {
    label: "Lantai bawah",
    summary: "Tiga kamar di lorong lantai bawah, dekat dapur bersama dan kamar mandi.",
    photo: fotoKamar1,
    photoAlt: "Contoh kamar Kost 3g dengan tempat tidur kayu dan rak besi",
  },
};

export const floorOrder: Floor[] = ["atas", "bawah"];

export const statusLabel: Record<RoomStatus, string> = {
  kosong: "Kosong",
  terisi: "Terisi",
  dipesan: "Dipesan",
  perbaikan: "Perbaikan",
};

export const isVacant = (r: Room) => r.status === "kosong";
export const vacantOf = (rooms: Room[]) => rooms.filter(isVacant);
export const roomsOn = (rooms: Room[], floor: Floor) => rooms.filter((r) => r.floor === floor);
export const lowestPrice = (rooms: Room[]) => Math.min(...rooms.map((r) => r.monthly));
export const highestPrice = (rooms: Room[]) => Math.max(...rooms.map((r) => r.monthly));

const idr = new Intl.NumberFormat("id-ID");
export const rupiah = (n: number) => `Rp${idr.format(n)}`;
export const shortRupiah = (n: number) => `${n / 1000}rb`;

const juta = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
export function yearlyLabel(room: Room) {
  if (room.yearly === null) return "Harga tahunan bisa ditanyakan lewat chat";
  const saving = room.monthly * 12 - room.yearly;
  return `${rupiah(room.yearly)} per tahun${saving > 0 ? `, hemat ${rupiah(saving)}` : ""}`;
}
export function yearlyShort(room: Room) {
  if (room.yearly === null) return "tahunan via chat";
  return `Rp${juta.format(room.yearly / 1_000_000)} jt setahun`;
}

const numberWords = ["Nol", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh"];
export const countWord = (n: number) => numberWords[n] ?? String(n);
