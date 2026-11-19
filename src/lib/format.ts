/** Format tanggal dan uang untuk halaman admin, zona waktu Medan (WIB). */
const TZ = "Asia/Jakarta";

const dFull = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
const dMonth = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: TZ });
const dTime = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TZ });
const idr = new Intl.NumberFormat("id-ID");

export const rp = (n: number | null | undefined) => (n == null ? "–" : `Rp${idr.format(n)}`);
export const tgl = (d: string | null | undefined) => (d ? dFull.format(new Date(d.length === 10 ? `${d}T00:00:00+07:00` : d)) : "–");
export const jam = (d: string) => dTime.format(new Date(d));
export const bulanLabel = (period: string) => dMonth.format(new Date(`${period}T00:00:00+07:00`));

/** Hari ini di WIB sebagai "YYYY-MM-DD". */
export const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());

/** "2026-11" → "2026-11-01". Tanpa argumen: bulan ini. */
export function monthStart(ym?: string | null) {
  const v = ym && /^\d{4}-\d{2}$/.test(ym) ? ym : today().slice(0, 7);
  return `${v}-01`;
}
export function shiftMonth(period: string, by: number) {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return d.toISOString().slice(0, 10);
}
/** Tanggal terakhir bulan itu, "YYYY-MM-DD". */
export function monthEnd(period: string) {
  const [y, m] = period.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}

/** "0852-7544-0791" / "+62 852..." → "6285275440791" untuk tautan wa.me. */
export function toE164(phone: string | null | undefined) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits || null;
}

/** Tanggal "YYYY-MM-DD" ditambah n hari. */
export function addDays(date: string, n: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
