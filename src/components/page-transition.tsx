import { type ReactNode, ViewTransition } from "react";

const byType = { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" };

/**
 * Animasi pindah halaman: maju = masuk ke dalam rumah, kembali = keluar ke beranda.
 * Dipasang di tiap page.tsx, bukan layout, karena layout tidak ikut berganti.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={byType} exit={byType} default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}

/** Tautan ke beranda dianggap "kembali", sisanya "maju". */
export const transitionFor = (href: string) => [href === "/" || href.startsWith("/#") ? "nav-back" : "nav-forward"];
