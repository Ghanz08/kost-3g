import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Grafik admin dari HTML biasa (tanpa JS): teks tetap tajam, responsif, dan tooltip muncul saat hover atau fokus keyboard.
 * Batang ≤ 24px dengan ujung bulat 4px, celah 2px, garis bantu tipis; teks memakai warna teks, bukan warna data.
 * Setiap grafik punya "Lihat tabel" agar angka tidak hanya bisa dibaca lewat hover.
 */

export type Series = { name: string; color: string };
type Row = { label: string; long: string; values: (number | null)[]; extra?: string };

const compact = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 });
export const rpShort = (n: number) => `Rp${compact.format(n)}`;
export const pct = (n: number) => `${Math.round(n * 100)}%`;

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  return ([1, 2, 2.5, 5, 10].find((x) => x * p >= v) ?? 10) * p;
}

function Legend({ series }: { series: Series[] }) {
  return (
    <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-subtle">
      {series.map((s) => (
        <li key={s.name} className="flex items-center gap-2">
          <span aria-hidden className={cn("size-3 rounded-[3px]", s.color)} />
          {s.name}
        </li>
      ))}
    </ul>
  );
}

function Tip({ children, align }: { children: ReactNode; align: "left" | "center" | "right" }) {
  return (
    <div
      role="presentation"
      className={cn(
        "pointer-events-none absolute bottom-full z-20 mb-2 hidden w-max max-w-60 rounded-lg bg-navy-900 px-3 py-2 text-sm text-white shadow-lg group-hover:block group-focus-visible:block",
        align === "center" && "left-1/2 -translate-x-1/2",
        align === "left" && "left-0",
        align === "right" && "right-0",
      )}
    >
      {children}
    </div>
  );
}

export function TableView({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="inline-flex min-h-10 cursor-pointer items-center rounded-lg px-1 font-semibold text-brand-700">Lihat tabel</summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full tabular-nums">
          <thead>
            <tr className="border-b border-line text-left text-subtle">
              {head.map((h, i) => (
                <th key={h} scope="col" className={cn("py-1.5 pr-3 font-semibold", i > 0 && "text-right")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-line/60 last:border-0">
                {r.map((c, j) =>
                  j === 0 ? (
                    <th key={j} scope="row" className="py-1.5 pr-3 text-left font-normal">
                      {c}
                    </th>
                  ) : (
                    <td key={j} className="py-1.5 pr-3 text-right">
                      {c}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/** Kolom per periode, satu atau dua seri berdampingan, satu sumbu. */
export function ColumnChart({
  series,
  rows,
  format,
  max,
  labelEvery = 2,
  extraHead,
}: {
  series: Series[];
  rows: Row[];
  format: (n: number) => string;
  max?: number;
  labelEvery?: number;
  extraHead?: string;
}) {
  const top = max ?? niceMax(Math.max(0, ...rows.flatMap((r) => r.values.map((v) => v ?? 0))));
  const last = rows.length - 1;
  const lastValue = series.length === 1 ? rows[last]?.values[0] : null;
  return (
    <figure>
      {series.length > 1 && <Legend series={series} />}
      <div className="grid grid-cols-[auto_1fr] gap-x-2">
        <div aria-hidden className="relative h-44 w-12 text-right text-xs text-subtle tabular-nums">
          {[1, 0.5, 0].map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - t) * 100}%` }}>
              {format(top * t)}
            </span>
          ))}
        </div>
        <div className="relative h-44">
          {[0, 0.5, 1].map((t) => (
            <div key={t} aria-hidden className="absolute inset-x-0 border-t border-line" style={{ top: `${t * 100}%` }} />
          ))}
          <ol className="relative flex h-full items-end">
            {rows.map((r, i) => (
              <li
                key={r.label + i}
                tabIndex={0}
                aria-label={`${r.long}: ${series.map((s, k) => `${s.name} ${r.values[k] == null ? "tidak ada data" : format(r.values[k]!)}`).join(", ")}${r.extra ? `, ${r.extra}` : ""}`}
                className="group relative flex h-full flex-1 items-end justify-center gap-[2px] rounded-md px-0.5 outline-offset-0 hover:bg-paper focus-visible:bg-paper"
              >
                {series.map((s, k) => {
                  const v = r.values[k];
                  return v == null || v <= 0 ? (
                    <span key={s.name} className="w-full max-w-6" />
                  ) : (
                    <span
                      key={s.name}
                      className={cn("w-full max-w-6 rounded-t-[4px] transition-opacity group-hover:opacity-85", s.color)}
                      style={{ height: `${Math.max(1.5, Math.min(1, v / top) * 100)}%` }}
                    />
                  );
                })}
                {i === last && lastValue != null && (
                  <span
                    aria-hidden
                    className="absolute left-1/2 -translate-x-1/2 -translate-y-full pb-1 text-xs font-semibold whitespace-nowrap text-ink tabular-nums group-hover:invisible"
                    style={{ bottom: `${Math.min(1, lastValue / top) * 100}%` }}
                  >
                    {format(lastValue)}
                  </span>
                )}
                <Tip align={i < 2 ? "left" : i > last - 2 ? "right" : "center"}>
                  <p className="text-white/80">{r.long}</p>
                  {series.map((s, k) => (
                    <p key={s.name} className="flex items-center gap-2">
                      <span aria-hidden className={cn("h-0.5 w-3 rounded", s.color)} />
                      <b className="tabular-nums">{r.values[k] == null ? "–" : format(r.values[k]!)}</b>
                      <span className="text-white/80">{s.name}</span>
                    </p>
                  ))}
                  {r.extra && <p className="mt-0.5 text-white/80">{r.extra}</p>}
                </Tip>
              </li>
            ))}
          </ol>
        </div>
        <span />
        <ol aria-hidden className="mt-1.5 flex text-xs text-subtle">
          {rows.map((r, i) => (
            <li key={r.label + i} className="flex-1 text-center whitespace-nowrap">
              {i % labelEvery === 0 ? r.label : ""}
            </li>
          ))}
        </ol>
      </div>
      <TableView
        head={["Periode", ...series.map((s) => s.name), ...(extraHead ? [extraHead] : [])]}
        rows={rows.map((r) => [r.long, ...r.values.map((v) => (v == null ? "–" : format(v))), ...(extraHead ? [r.extra ?? "–"] : [])])}
      />
    </figure>
  );
}

/** Batang mendatar berlabel di ujung: funnel, umur tunggakan, sumber calon. */
export function BarList({
  rows,
  color,
  format = (n) => String(n),
  empty,
}: {
  rows: { label: string; value: number; note?: string }[];
  color: string;
  format?: (n: number) => string;
  empty?: string;
}) {
  const top = Math.max(0, ...rows.map((r) => r.value));
  if (!top && empty) return <p className="text-sm text-subtle">{empty}</p>;
  return (
    <ul className="grid grid-cols-[minmax(5.5rem,auto)_1fr_auto] items-center gap-x-3 gap-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="contents">
          <span className="text-sm text-ink">{r.label}</span>
          <span aria-hidden className="flex h-5 items-center">
            {r.value > 0 && <span className={cn("h-full rounded-r-[4px]", color)} style={{ width: `max(4px, ${(r.value / top) * 100}%)` }} />}
          </span>
          <span className="text-right text-sm whitespace-nowrap tabular-nums">
            <b className="text-ink">{format(r.value)}</b>
            {r.note && <span className="text-subtle"> · {r.note}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Linimasa 12 bulan: tiap kamar satu baris, potongan hijau = terisi. */
export function RoomTimeline({
  rows,
  ticks,
}: {
  rows: { room: number; current?: string; segments: { name: string; start: string; end: string | null; left: number; width: number; range: string }[] }[];
  ticks: { label: string; left: number }[];
}) {
  return (
    <figure>
      <div className="grid grid-cols-[5.5rem_1fr] gap-x-3">
        <span />
        <div aria-hidden className="relative mb-1 h-4 text-xs text-subtle">
          {ticks.map((t, i) => (
            <span key={t.label + i} className={cn("absolute", i % 2 === 1 && "max-sm:hidden")} style={{ left: `${t.left}%` }}>
              {t.label}
            </span>
          ))}
        </div>
        {rows.map((r) => (
          <div key={r.room} className="contents">
            <div className="py-1.5">
              <p className="text-sm font-semibold text-navy-700">Kamar {r.room}</p>
              <p className="truncate text-xs text-subtle">{r.current ?? "Kosong"}</p>
            </div>
            <div className="relative my-1.5 rounded-[4px] bg-filled">
              {ticks.map((t, i) => (
                <span key={i} aria-hidden className="absolute inset-y-0 border-l border-surface" style={{ left: `${t.left}%` }} />
              ))}
              {r.segments.map((s, i) => (
                <span
                  key={i}
                  tabIndex={0}
                  aria-label={`Kamar ${r.room}: ${s.name}, ${s.range}`}
                  className="group absolute inset-y-0 rounded-[4px] bg-chart-1 hover:opacity-85 focus-visible:opacity-85"
                  style={{ left: `calc(${s.left}% + 1px)`, width: `max(4px, calc(${s.width}% - 2px))` }}
                >
                  <Tip align={s.left > 60 ? "right" : s.left < 15 ? "left" : "center"}>
                    <b>{s.name}</b>
                    <p className="text-white/80">{s.range}</p>
                  </Tip>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <TableView head={["Kamar", "Penghuni", "Periode"]} rows={rows.flatMap((r) => r.segments.map((s) => [`Kamar ${r.room}`, s.name, s.range]))} />
    </figure>
  );
}

/** Garis tren kecil untuk kartu KPI (12 titik). Hiasan pendukung: angkanya ada di kartu dan di halaman Laporan. */
export function Sparkline({ values, label }: { values: (number | null)[]; label: string }) {
  const v = values.map((x) => x ?? 0);
  const max = Math.max(0, ...v) || 1;
  const n = v.length - 1 || 1;
  const y = (x: number) => 29 - (x / max) * 26;
  return (
    <div className="flex items-center gap-2">
      <svg aria-hidden viewBox="0 0 100 30" preserveAspectRatio="none" className="h-7 min-w-0 flex-1 overflow-visible">
        <polyline
          points={v.map((x, i) => `${(i / n) * 100},${y(x)}`).join(" ")}
          fill="none"
          stroke="var(--color-chart-1)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span className="shrink-0 text-xs text-subtle">{label}</span>
    </div>
  );
}
