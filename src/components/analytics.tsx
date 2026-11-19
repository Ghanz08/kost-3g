"use client";

import Script from "next/script";
import { useEffect } from "react";

const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, string>) => void };
  }
}

/**
 * Umami tanpa cookie. Satu pendengar klik untuk semua tautan WhatsApp, jadi tombol baru otomatis terhitung.
 * Event "wa-klik" membawa halaman dan bagian tempat tombol berada (header, hero, kamar-3, penutup, …).
 */
export function Analytics() {
  useEffect(() => {
    if (!websiteId) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href^="https://wa.me/"]');
      if (!a) return;
      const spot = a.closest("[data-lokasi]")?.getAttribute("data-lokasi") ?? a.closest("header, footer, section[aria-labelledby]")?.getAttribute("aria-labelledby") ?? a.closest("header, footer")?.tagName.toLowerCase() ?? "lain";
      window.umami?.track("wa-klik", { lokasi: spot.replace(/^judul-/, ""), halaman: location.pathname });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  if (!websiteId) return null;
  return <Script src="/u/script.js" data-website-id={websiteId} data-host-url="/u" data-do-not-track="true" strategy="afterInteractive" />;
}
