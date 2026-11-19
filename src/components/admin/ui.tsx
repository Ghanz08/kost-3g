import { ChevronLeft, ChevronRight, type LucideIcon, MessageCircle } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { buttonClass, type ButtonVariant } from "./button-class";

/* Komponen tampilan admin (server-safe). Teks penting minimal 14px, kontras ≥ 4,5:1, target klik ≥ 40px. */

export function PageHeader({ title, description, children, back }: { title: string; description?: string; children?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <header className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-2 inline-flex min-h-10 items-center gap-1 rounded-lg text-sm font-semibold text-brand-700 hover:underline">
            <ChevronLeft aria-hidden className="size-4" />
            {back.label}
          </Link>
        )}
        <h1 className="font-display text-2xl font-bold tracking-tight text-navy-700 md:text-[1.75rem]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-subtle">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

export function Card({ title, description, children, className, actions, flush }: { title?: string; description?: string; children: ReactNode; className?: string; actions?: ReactNode; flush?: boolean }) {
  return (
    <section className={cn("rounded-2xl bg-surface shadow-card ring-1 ring-line", !flush && "p-5 md:p-6", className)}>
      {(title || actions) && (
        <div className={cn("mb-4 flex flex-wrap items-start justify-between gap-3", flush && "px-5 pt-5 md:px-6 md:pt-6")}>
          <div>
            {title && <h2 className="font-display text-lg font-bold text-navy-700">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-subtle">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

const toneClass = {
  default: "bg-paper text-navy-700",
  good: "bg-brand-50 text-brand-700",
  warn: "bg-accent-50 text-accent-700",
  bad: "bg-red-50 text-red-700",
};

export function Stat({ label, value, hint, tone = "default", icon: Icon, trend }: { label: string; value: ReactNode; hint?: string; tone?: keyof typeof toneClass; icon: LucideIcon; trend?: ReactNode }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl bg-surface p-5 shadow-card ring-1 ring-line">
      <span aria-hidden className={cn("grid size-10 shrink-0 place-items-center rounded-xl", toneClass[tone])}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-subtle">{label}</p>
        <p className="mt-0.5 font-display text-2xl font-bold text-navy-700 tabular-nums">{value}</p>
        {hint && <p className="mt-0.5 text-sm text-subtle">{hint}</p>}
        {trend && <div className="mt-2">{trend}</div>}
      </div>
    </div>
  );
}

/** Status dengan titik warna + teks (warna tidak jadi satu-satunya penanda, WCAG 1.4.1). */
const badgeTone: Record<string, { box: string; dot: string; label: string }> = {
  kosong: { box: "bg-accent-50 text-accent-700", dot: "bg-accent-500", label: "Kosong" },
  terisi: { box: "bg-brand-50 text-brand-700", dot: "bg-brand-500", label: "Terisi" },
  dipesan: { box: "bg-navy-700/10 text-navy-700", dot: "bg-navy-700", label: "Dipesan" },
  perbaikan: { box: "bg-filled text-subtle", dot: "bg-subtle", label: "Perbaikan" },
  aktif: { box: "bg-brand-50 text-brand-700", dot: "bg-brand-500", label: "Aktif" },
  calon: { box: "bg-accent-50 text-accent-700", dot: "bg-accent-500", label: "Calon" },
  keluar: { box: "bg-filled text-subtle", dot: "bg-subtle", label: "Sudah keluar" },
  selesai: { box: "bg-filled text-subtle", dot: "bg-subtle", label: "Selesai" },
  lunas: { box: "bg-brand-50 text-brand-700", dot: "bg-brand-500", label: "Lunas" },
  sebagian: { box: "bg-accent-50 text-accent-700", dot: "bg-accent-500", label: "Dibayar sebagian" },
  belum: { box: "bg-filled text-navy-700", dot: "bg-navy-700", label: "Belum bayar" },
  telat: { box: "bg-red-50 text-red-700", dot: "bg-red-600", label: "Telat" },
  baru: { box: "bg-accent-50 text-accent-700", dot: "bg-accent-500", label: "Baru" },
  dikerjakan: { box: "bg-navy-700/10 text-navy-700", dot: "bg-navy-700", label: "Dikerjakan" },
  survey: { box: "bg-navy-700/10 text-navy-700", dot: "bg-navy-700", label: "Jadwal survey" },
  jadi: { box: "bg-brand-50 text-brand-700", dot: "bg-brand-500", label: "Jadi menyewa" },
  batal: { box: "bg-filled text-subtle", dot: "bg-subtle", label: "Batal" },
};

export function Badge({ value, label }: { value: string; label?: string }) {
  const t = badgeTone[value] ?? { box: "bg-filled text-subtle", dot: "bg-subtle", label: value };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold whitespace-nowrap", t.box)}>
      <span aria-hidden className={cn("size-1.5 rounded-full", t.dot)} />
      {label ?? t.label}
    </span>
  );
}

/** Keadaan kosong yang menjelaskan apa yang akan muncul di sini dan apa yang bisa dilakukan. */
export function EmptyState({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-line px-6 py-10 text-center">
      <span aria-hidden className="grid size-12 place-items-center rounded-2xl bg-paper text-brand-500">
        <Icon className="size-6" />
      </span>
      <p className="mt-3 font-semibold text-navy-700">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-subtle">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * Tabel data. Di layar lebar tabel biasa; di HP tiap baris jadi kartu dengan label kolom
 * (data-label), jadi tidak perlu geser ke samping (WCAG 1.4.10).
 */
export function Table({ head, children, caption }: { head: string[]; children: ReactNode; caption?: string }) {
  return (
    <table className="w-full text-left text-sm max-md:block">
      {caption && <caption className="sr-only">{caption}</caption>}
      <thead className="max-md:sr-only">
        <tr className="border-b border-line">
          {head.map((h, i) => (
            <th key={i} scope="col" className="px-4 py-3 text-xs font-semibold tracking-wide text-subtle uppercase first:pl-0 last:pr-0">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="max-md:flex max-md:flex-col max-md:gap-3 md:divide-y md:divide-line">{children}</tbody>
    </table>
  );
}

export function Tr({ className, ...p }: ComponentProps<"tr">) {
  return <tr className={cn("transition-colors md:hover:bg-paper/60 max-md:flex max-md:flex-col max-md:gap-2 max-md:rounded-xl max-md:border max-md:border-line max-md:p-4", className)} {...p} />;
}

export function Td({ label, className, children, ...p }: ComponentProps<"td"> & { label?: string }) {
  return (
    <td
      data-label={label}
      className={cn(
        "px-4 py-3 align-middle text-ink first:pl-0 last:pr-0 max-md:flex max-md:items-start max-md:justify-between max-md:gap-4 max-md:p-0",
        label && "max-md:before:shrink-0 max-md:before:text-sm max-md:before:text-subtle max-md:before:content-[attr(data-label)]",
        className,
      )}
      {...p}
    >
      {children}
    </td>
  );
}

export function LinkButton({ href, children, variant = "primary", icon: Icon, external }: { href: string; children: ReactNode; variant?: ButtonVariant; icon?: LucideIcon; external?: boolean }) {
  const content = (
    <>
      {Icon && <Icon aria-hidden className="size-4" />}
      {children}
    </>
  );
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClass(variant)}>
      {content}
    </a>
  ) : (
    <Link href={href} className={buttonClass(variant)}>
      {content}
    </Link>
  );
}

/** Tautan wa.me dengan pesan terisi. Teks tautan menyebut tujuannya; ikon dekoratif. */
export function WaLink({ phone, message, children, size = "sm" }: { phone: string | null; message: string; children: ReactNode; size?: "sm" | "md" }) {
  if (!phone) return <span className="text-sm text-subtle">No. WA belum diisi</span>;
  return (
    <a
      href={`https://wa.me/${phone}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonClass("secondary", size), "text-brand-700")}
    >
      <MessageCircle aria-hidden className="size-4" />
      {children}
      <span className="sr-only">(membuka WhatsApp di tab baru)</span>
    </a>
  );
}

/** Pemilih bulan ← November 2026 →. */
export function MonthSwitcher({ basePath, period, label, prev, next }: { basePath: string; period: string; label: string; prev: string; next: string }) {
  const btn = "grid size-10 place-items-center rounded-xl text-navy-700 ring-1 ring-field ring-inset hover:bg-paper";
  return (
    <nav aria-label="Pilih bulan" className="flex items-center gap-2">
      <Link href={`${basePath}?bulan=${prev}`} className={btn} aria-label="Bulan sebelumnya">
        <ChevronLeft aria-hidden className="size-5" />
      </Link>
      <span className="min-w-36 text-center font-semibold text-navy-700" aria-current="date" data-period={period}>
        {label}
      </span>
      <Link href={`${basePath}?bulan=${next}`} className={btn} aria-label="Bulan berikutnya">
        <ChevronRight aria-hidden className="size-5" />
      </Link>
    </nav>
  );
}

/** Tab penyaring (status, dll.) berupa tautan, jadi bisa dibuka di tab baru dan dibagikan. */
export function FilterTabs({ items, active, label }: { items: { href: string; label: string; count?: number; value: string }[]; active: string; label: string }) {
  return (
    <nav aria-label={label} className="-mx-1 mb-4 flex gap-1 overflow-x-auto px-1 pb-1">
      {items.map((it) => {
        const on = it.value === active;
        return (
          <Link
            key={it.value}
            href={it.href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition-colors",
              on ? "bg-navy-700 text-white" : "text-navy-700 hover:bg-surface",
            )}
          >
            {it.label}
            {it.count !== undefined && (
              <span className={cn("rounded-full px-1.5 text-xs tabular-nums", on ? "bg-white/20" : "bg-surface ring-1 ring-line")}>{it.count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/** Daftar keterangan dua kolom (label – nilai). */
export function DescList({ items }: { items: [label: string, value: ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[10rem_1fr]">
      {items.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-sm text-subtle">{k}</dt>
          <dd className="text-ink max-sm:-mt-2">{v ?? "–"}</dd>
        </div>
      ))}
    </dl>
  );
}
