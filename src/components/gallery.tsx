"use client";

import { useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArchReveal } from "@/components/motion";
import { cn } from "@/lib/cn";
import { type GalleryItem, builtinPhotos } from "@/data/content";

/**
 * Galeri foto. Di HP: geser ke samping, foto berikutnya mengintip, dan pintu kecil di bawahnya
 * menunjukkan foto ke berapa (bisa diketuk). Di layar lebar: lima kolom tanpa indikator.
 */
export function Gallery({ items: gallery }: { items: GalleryItem[] }) {
  const listRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
      },
      // Garis tipis di 30% dari kiri: foto yang melewatinya dianggap sedang tampil.
      { root: list, rootMargin: "0px -69% 0px -30%" },
    );
    for (const li of list.children) io.observe(li);
    return () => io.disconnect();
  }, []);

  function goTo(i: number) {
    listRef.current?.children[i]?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", inline: "start", block: "nearest" });
  }

  return (
    <div className="flex flex-col gap-4">
      <ul
        ref={listRef}
        tabIndex={0}
        aria-label="Galeri foto, geser ke samping"
        className="-mx-6 flex snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0"
      >
        {gallery.map((g, i) => (
          <li key={g.src} data-index={i} className="w-[74vw] max-w-72 shrink-0 snap-start md:w-auto md:max-w-none">
            <figure className="group">
              <ArchReveal delay={i * 0.12} className="aspect-[3/4] rounded-t-full">
                <Image
                  src={builtinPhotos[g.src] ?? g.src}
                  alt={g.alt}
                  fill
                  sizes="(max-width: 768px) 74vw, 20vw"
                  // Foto unggahan (URL Supabase Storage) tidak punya blur bawaan.
                  placeholder={builtinPhotos[g.src] ? "blur" : "empty"}
                  unoptimized={!builtinPhotos[g.src]}
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </ArchReveal>
              <figcaption className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-sm font-bold text-accent-700 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-semibold text-navy-700">{g.caption}</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      <div className="flex items-end justify-center md:hidden" role="group" aria-label="Pilih foto">
        {gallery.map((g, i) => (
          <button
            key={g.src}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Foto ${i + 1}: ${g.caption}`}
            aria-current={i === active}
            className="grid h-8 w-6 place-items-end justify-center pb-2"
          >
            <span
              className={cn(
                "block rounded-t-full transition-all duration-300",
                i === active ? "h-4 w-3 bg-accent-500" : "h-2.5 w-2 bg-brand-200",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
