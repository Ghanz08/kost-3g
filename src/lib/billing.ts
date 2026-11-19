import { bulanLabel, rp, tgl } from "@/lib/format";

type InvoiceLike = {
  period: string;
  due_date: string;
  rent: number;
  electricity: number;
  water: number;
  other: number;
  other_note: string | null;
  total: number;
  paid: number;
};

/** Pesan pengingat tagihan untuk WhatsApp, rinci per komponen. */
export function reminderMessage(name: string, room: number, i: InvoiceLike) {
  const lines = [
    `Halo ${name}, ini pengingat tagihan Kost 3g bulan ${bulanLabel(i.period)} untuk kamar ${room}:`,
    i.rent ? `• Sewa: ${rp(i.rent)}` : null,
    i.electricity ? `• Listrik: ${rp(i.electricity)}` : null,
    i.water ? `• Air: ${rp(i.water)}` : null,
    i.other ? `• ${i.other_note ?? "Lainnya"}: ${rp(i.other)}` : null,
    `Total ${rp(i.total)}${i.paid ? `, sudah dibayar ${rp(i.paid)}, sisa ${rp(i.total - i.paid)}` : ""}.`,
    `Jatuh tempo ${tgl(i.due_date)}. Terima kasih 🙏`,
  ];
  return lines.filter(Boolean).join("\n");
}
