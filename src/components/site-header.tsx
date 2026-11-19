"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/button";
import { ChatIcon, CloseIcon, MenuIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { transitionFor } from "@/components/page-transition";
import { cn } from "@/lib/cn";
import { nav, waLink, waMessages } from "@/lib/site";

/** Halaman aktif. Di beranda, "Kamar" menyala saat bagian kamar sedang di tengah layar. */
function useCurrent() {
  const pathname = usePathname();
  const [inRooms, setInRooms] = useState(false);
  useEffect(() => {
    const el = pathname === "/" ? document.getElementById("kamar") : null;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInRooms(e.isIntersecting), { rootMargin: "-45% 0px -50% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [pathname]);
  return pathname === "/" && inRooms ? "/#kamar" : pathname;
}

/**
 * Di paling atas: bilah penuh. Setelah scroll: latarnya merapat jadi pil melayang di sekitar isinya.
 * Isi (logo, menu, tombol) tidak bergeser dan tinggi <header> tetap, jadi transisinya tenang
 * dan konten di bawahnya tidak ikut melompat.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const current = useCurrent();
  const { scrollY } = useScroll();
  // 40px supaya tidak bolak-balik pada scroll kecil.
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 40));

  const close = () => setOpen(false);

  return (
    <header className="pointer-events-none sticky top-0 z-40 h-16 md:h-18">
      {/* view-transition-name di sini, bukan di <header>: nama itu membuat elemen jadi "backdrop root",
          sehingga blur latar tidak bisa melihat konten di belakangnya. */}
      <div
        className={cn(
          "pointer-events-auto relative mx-auto border [view-transition-name:site-header] transition-[max-width,margin,border-radius,border-color,box-shadow] duration-[350ms] ease-out",
          scrolled
            ? "mt-2 max-w-[min(80rem,calc(100%-1.5rem))] rounded-[1.75rem] border-line bg-surface/90 shadow-card backdrop-blur-md"
            : "max-w-full rounded-none border-transparent border-b-line bg-surface",
        )}
      >
        <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <span className="absolute inset-x-0 bottom-0 h-0.5 origin-left animate-scroll-progress bg-accent-500" />
        </span>
        {/* Padding dikurangi sebanyak pil menyempit, supaya isinya tetap di posisi yang sama. */}
        <div
          className={cn(
            "relative mx-auto flex w-full max-w-[80rem] items-center justify-between transition-[height,padding] duration-[350ms] ease-out",
            scrolled ? "h-14 px-3 md:px-7 min-[81.5rem]:px-10" : "h-16 px-6 md:h-18 md:px-10",
          )}
        >
        <Link href="/" aria-label="Kost 3g, ke beranda" transitionTypes={transitionFor("/")} onClick={close}>
          <Logo className="h-8 md:h-9" />
        </Link>
        <nav aria-label="Navigasi utama" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {nav.map((item) => {
              const active = current === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    transitionTypes={transitionFor(item.href)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative block py-2 text-sm font-semibold transition-colors hover:text-brand-500",
                      active ? "text-brand-500" : "text-navy-700",
                    )}
                  >
                    {item.label}
                    {/* Pintu kecil, bentuk yang sama dengan pintu di logo, menandai halaman aktif. */}
                    {active && (
                      <span
                        aria-hidden
                        className="absolute -bottom-1 left-[calc(50%-0.1875rem)] h-2 w-1.5 rounded-t-full bg-accent-500"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="hidden lg:block">
          <ButtonLink href={waLink(waMessages.general)} external icon={<ChatIcon />}>
            Chat WhatsApp
          </ButtonLink>
        </div>
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full text-navy-700 lg:hidden"
          aria-expanded={open}
          aria-controls="menu-hp"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>
        <AnimatePresence>
          {open && (
            // Kartu di bawah bilah, supaya tidak memanjangkan pil saat melayang.
            <motion.nav
              id="menu-hp"
              aria-label="Navigasi utama"
              className="absolute inset-x-3 top-[calc(100%+0.5rem)] rounded-card border border-line bg-surface shadow-raised lg:hidden"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="px-5 pb-5">
                <ul className="flex flex-col py-2">
                  {nav.map((item) => {
                    const active = current === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          transitionTypes={transitionFor(item.href)}
                          aria-current={active ? "page" : undefined}
                          onClick={close}
                          className={cn(
                            "flex items-center gap-3 py-3 text-lg font-semibold",
                            active ? "text-brand-500" : "text-navy-700",
                          )}
                        >
                          {item.label}
                          {active && <span aria-hidden className="h-3 w-2 rounded-t-full bg-accent-500" />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <ButtonLink href={waLink(waMessages.general)} external icon={<ChatIcon />} size="lg" className="w-full">
                  Chat WhatsApp
                </ButtonLink>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
