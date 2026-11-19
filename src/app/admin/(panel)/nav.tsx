"use client";

import {
  BedDouble,
  ChartColumn,
  CircleUserRound,
  FileText,
  History,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/cn";

const groups = [
  {
    title: "Kos",
    items: [
      ["/admin", "Dasbor", LayoutDashboard],
      ["/admin/laporan", "Laporan", ChartColumn],
      ["/admin/kamar", "Kamar", BedDouble],
      ["/admin/penghuni", "Penghuni", Users],
      ["/admin/sewa", "Sewa", KeyRound],
      ["/admin/tagihan", "Tagihan", ReceiptText],
    ],
  },
  {
    title: "Operasional",
    items: [
      ["/admin/keuangan", "Keuangan", Wallet],
      ["/admin/keluhan", "Keluhan", Wrench],
      ["/admin/calon", "Calon penyewa", UserPlus],
    ],
  },
  {
    title: "Situs & akses",
    items: [
      ["/admin/konten", "Konten situs", FileText],
      ["/admin/akses", "Akses admin", ShieldCheck],
      ["/admin/log", "Log aktivitas", History],
      ["/admin/pengaturan", "Pengaturan", Settings],
    ],
  },
] as const;

function NavList({ path, onNavigate }: { path: string; onNavigate?: () => void }) {
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));
  return (
    <div className="flex flex-col gap-6">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="mb-1 px-3 text-xs font-semibold tracking-wide text-subtle uppercase">{g.title}</p>
          <ul className="flex flex-col gap-0.5">
            {g.items.map(([href, label, Icon]) => {
              const on = active(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={on ? "page" : undefined}
                    className={cn(
                      "flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors",
                      on ? "bg-brand-500 text-white" : "text-navy-700 hover:bg-paper",
                    )}
                  >
                    <Icon aria-hidden className={cn("size-[1.125rem]", on ? "text-white" : "text-subtle")} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Menu samping di layar lebar (membaca URL, jadi harus di dalam <Suspense>). */
export function SideNav() {
  return <NavList path={usePathname()} />;
}
export function SideNavFallback() {
  return <NavList path="" />;
}

/** Bilah atas + laci menu untuk HP dan tablet. */
export function MobileNav({ account }: { account: ReactNode }) {
  const path = usePathname();
  const ref = useRef<HTMLDialogElement>(null);
  // Tutup laci kalau halaman berganti lewat tombol back.
  useEffect(() => ref.current?.close(), [path]);

  return (
    <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
      <Link href="/admin" aria-label="Dasbor admin Kost 3g" className="rounded-lg">
        <Logo className="h-8" />
      </Link>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        aria-label="Buka menu"
        className="grid size-11 place-items-center rounded-xl text-navy-700 hover:bg-paper"
      >
        <Menu aria-hidden className="size-6" />
      </button>
      <dialog
        ref={ref}
        aria-label="Menu admin"
        onClick={(e) => e.target === ref.current && ref.current?.close()}
        className="m-0 h-dvh max-h-dvh w-[min(20rem,85vw)] max-w-none bg-surface p-0 shadow-raised backdrop:bg-navy-900/40"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-line px-4">
            <Logo className="h-8" />
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label="Tutup menu"
              className="grid size-11 place-items-center rounded-xl text-navy-700 hover:bg-paper"
            >
              <X aria-hidden className="size-6" />
            </button>
          </div>
          <nav aria-label="Menu admin" className="flex-1 overflow-y-auto px-3 py-4">
            <NavList path={path} onNavigate={() => ref.current?.close()} />
          </nav>
          <div className="border-t border-line p-4">{account}</div>
        </div>
      </dialog>
    </div>
  );
}

/** Blok akun di bawah menu: email + keluar + lihat situs. */
export function AccountBlock({ email }: { email: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-1">
        <CircleUserRound aria-hidden className="size-5 shrink-0 text-subtle" />
        <p className="truncate text-sm text-navy-700" title={email}>
          {email}
        </p>
      </div>
      <div className="flex gap-1">
        <a href="/" target="_blank" rel="noopener" className="flex min-h-10 flex-1 items-center justify-center rounded-xl text-sm font-semibold text-brand-700 hover:bg-brand-50">
          Lihat situs
          <span className="sr-only">(tab baru)</span>
        </a>
        <form action="/admin/auth/keluar" method="post" className="flex-1">
          <button className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-navy-700 hover:bg-paper">
            <LogOut aria-hidden className="size-4" />
            Keluar
          </button>
        </form>
      </div>
    </div>
  );
}
