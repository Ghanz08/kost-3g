/** Hitungan grafik dasbor (12 bulan terakhir). Fungsi murni: data masuk, angka keluar — mudah diuji. */
import { addDays, monthEnd, shiftMonth } from "./format";

export type LeaseRow = {
  room_number: number;
  start_date: string;
  ended_on: string | null;
  status: string;
  end_reason: string | null;
  tenants: { name: string } | null;
};
export type InvoiceRow = { period: string | null; due_date: string | null; total: number | null; paid: number | null };
type Dated = { amount: number; date: string };
export type UtilityRow = { period: string; per_tenant: number };

const DAY = 86400e3;
const days = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / DAY);
const minD = (a: string, b: string) => (a < b ? a : b);
const maxD = (a: string, b: string) => (a > b ? a : b);
/** Hari yang tumpang tindih antara [a1, a2] dan [b1, b2], inklusif. */
const overlap = (a1: string, a2: string, b1: string, b2: string) => Math.max(0, days(maxD(a1, b1), minD(a2, b2)) + 1);

export function computeInsights(
  input: { rooms: number[]; leases: LeaseRow[]; payments: Dated[]; expenses: Dated[]; invoices: InvoiceRow[]; utilities: UtilityRow[] },
  today: string,
) {
  const thisMonth = `${today.slice(0, 7)}-01`;
  const months = Array.from({ length: 12 }, (_, i) => shiftMonth(thisMonth, i - 11));
  const from = months[0];
  const spans = input.leases
    .filter((l) => l.status === "aktif" || l.ended_on)
    .map((l) => ({ ...l, end: l.status === "aktif" ? today : l.ended_on! }))
    .filter((l) => l.end >= from && l.start_date <= today);

  const monthly = months.map((m) => {
    const end = minD(monthEnd(m), today);
    const roomDays = input.rooms.length * (days(m, end) + 1);
    const occupiedDays = spans.reduce((s, l) => s + overlap(l.start_date, l.end, m, end), 0);
    const inMonth = (r: Dated) => r.date >= m && r.date <= end;
    const income = input.payments.filter(inMonth).reduce((s, r) => s + r.amount, 0);
    const expense = input.expenses.filter(inMonth).reduce((s, r) => s + r.amount, 0);
    const inv = input.invoices.filter((i) => i.period === m);
    const billed = inv.reduce((s, i) => s + (i.total ?? 0), 0);
    const collected = inv.reduce((s, i) => s + Math.min(i.paid ?? 0, i.total ?? 0), 0);
    const util = input.utilities.filter((u) => u.period === m);
    return {
      period: m,
      occupancy: roomDays ? occupiedDays / roomDays : 0,
      income,
      expense,
      net: income - expense,
      collection: billed ? collected / billed : null,
      utilityPerTenant: util.length ? util.reduce((s, u) => s + u.per_tenant, 0) : null,
    };
  });

  // Linimasa: potongan sewa per kamar, dalam persen lebar jendela 12 bulan.
  const windowDays = days(from, today) + 1;
  const timeline = input.rooms.map((room) => ({
    room,
    segments: spans
      .filter((l) => l.room_number === room)
      .map((l) => {
        const s = maxD(l.start_date, from);
        return { name: l.tenants?.name ?? "Penghuni", start: l.start_date, end: l.status === "aktif" ? null : l.end, left: (days(from, s) / windowDays) * 100, width: ((days(s, l.end) + 1) / windowDays) * 100 };
      }),
  }));

  const ticks = months.map((m) => ({ period: m, left: (Math.max(0, days(from, m)) / windowDays) * 100 }));

  // Lama kamar kosong: jarak antara sewa selesai dan sewa berikutnya di kamar yang sama.
  const gaps: number[] = [];
  for (const room of input.rooms) {
    const list = input.leases.filter((l) => l.room_number === room).sort((a, b) => a.start_date.localeCompare(b.start_date));
    for (let i = 1; i < list.length; i++) {
      const prevEnd = list[i - 1].ended_on;
      if (prevEnd && prevEnd >= from) gaps.push(Math.max(0, days(prevEnd, list[i].start_date)));
    }
  }
  const moveOuts = input.leases.filter((l) => l.ended_on && l.ended_on >= from && l.end_reason !== "pindah-kamar").length;
  const activeMonths = monthly.filter((m) => m.income > 0).length;
  const income12 = monthly.reduce((s, m) => s + m.income, 0);

  // Umur tunggakan: sisa tagihan yang lewat jatuh tempo.
  const buckets = [
    { label: "1–30 hari", min: 1, max: 30 },
    { label: "31–60 hari", min: 31, max: 60 },
    { label: "61–90 hari", min: 61, max: 90 },
    { label: "> 90 hari", min: 91, max: Infinity },
  ].map((b) => ({ ...b, amount: 0, count: 0 }));
  for (const i of input.invoices) {
    const left = (i.total ?? 0) - (i.paid ?? 0);
    if (left <= 0 || !i.due_date) continue;
    const late = days(i.due_date, today);
    const b = buckets.find((x) => late >= x.min && late <= x.max);
    if (b) {
      b.amount += left;
      b.count++;
    }
  }

  return {
    monthly,
    timeline,
    ticks,
    aging: buckets.map(({ label, amount, count }) => ({ label, amount, count })),
    kpi: {
      daysToFill: gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : null,
      fills: gaps.length,
      moveOuts,
      turnover: input.rooms.length ? moveOuts / input.rooms.length : 0,
      revenuePerRoom: activeMonths && input.rooms.length ? Math.round(income12 / activeMonths / input.rooms.length) : null,
      occupancy12: monthly.reduce((s, m) => s + m.occupancy, 0) / monthly.length,
    },
  };
}

/** Untuk funnel 30 hari: batas awal jendela. */
export const since30 = (today: string) => addDays(today, -29);
