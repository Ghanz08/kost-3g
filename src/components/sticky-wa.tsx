"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChatIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

/**
 * Tombol WhatsApp yang menempel di bawah layar HP.
 * Di beranda baru muncul setelah tombol hero terlewati, supaya tidak dobel.
 */
export function StickyWa({ href }: { href: string }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [heroCtaVisible, setHeroCtaVisible] = useState(true);

  useEffect(() => {
    if (!isHome) return;
    const target = document.getElementById("hero-cta");
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setHeroCtaVisible(entry.isIntersecting));
    observer.observe(target);
    return () => observer.disconnect();
  }, [isHome]);

  const visible = !isHome || !heroCtaVisible;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-sticky transition-transform duration-300 md:hidden",
        visible ? "translate-y-0" : "translate-y-full",
      )}
      aria-hidden={!visible}
    >
      <a
        data-lokasi="tombol-melayang"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={visible ? 0 : -1}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-brand-500 font-semibold text-white"
      >
        <ChatIcon />
        Chat via WhatsApp
      </a>
    </div>
  );
}
