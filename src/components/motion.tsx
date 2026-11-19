"use client";

import {
  animate,
  MotionConfig,
  motion,
  useAnimate,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { type CSSProperties, Fragment, type ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { ease } from "@/lib/ease";

/** Pengguna yang memilih kurangi gerakan hanya mendapat fade, tanpa geser atau skala. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/**
 * Sekali terlihat, tetap dianggap terlihat. Sengaja tidak memakai `whileInView`:
 * saat scroll cepat (misalnya lompat lewat menu), elemen bisa keluar layar sebelum
 * jeda animasinya habis, lalu macet tersembunyi.
 */
function useSeen<T extends Element>(margin: `${number}px ${number}px ${number}% ${number}px` = "0px 0px -12% 0px") {
  const ref = useRef<T>(null);
  const seen = useInView(ref, { once: true, margin });
  return [ref, seen] as const;
}

const tags = { div: motion.div, li: motion.li, section: motion.section, p: motion.p, g: motion.g };

/** Muncul saat masuk layar: naik pelan sambil memudar dan menajam. */
export function Reveal({
  as = "div",
  delay = 0,
  x = 0,
  y = 28,
  immediate = false,
  className,
  children,
  ...aria
}: {
  id?: string;
  "aria-labelledby"?: string;
  as?: keyof typeof tags;
  delay?: number;
  x?: number;
  y?: number;
  /** Di bagian atas halaman: animasi CSS yang jalan saat dicat, tanpa menunggu hidrasi dan scroll. */
  immediate?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const Tag = tags[as] as typeof motion.div;
  const [ref, seen] = useSeen<HTMLDivElement>();
  if (immediate) {
    const Plain = as as "div";
    return (
      <Plain {...aria} className={cn("animate-reveal", className)} style={{ "--d": `${delay}s`, "--rx": `${x}px`, "--ry": `${y}px` } as CSSProperties}>
        {children}
      </Plain>
    );
  }
  const hidden = { opacity: 0, x, y, filter: "blur(6px)" };
  return (
    <Tag
      ref={ref}
      {...aria}
      className={className}
      initial={hidden}
      animate={seen ? { opacity: 1, x: 0, y: 0, filter: "blur(0px)" } : hidden}
      transition={{ duration: 0.8, delay, ease }}
    >
      {children}
    </Tag>
  );
}

/**
 * Judul yang katanya naik satu per satu dari balik garis, seperti orang muncul dari balik pintu.
 * `onView` = tunggu sampai terlihat; tanpa itu langsung main saat halaman dimuat.
 */
export function WordsRise({ text, delay = 0, onView = false }: { text: string; delay?: number; onView?: boolean }) {
  const words = text.split(" ");
  const shown = { y: "0%", rotate: 0 };
  const [ref, seen] = useSeen<HTMLSpanElement>("0px 0px -10% 0px");
  // Di bagian atas halaman: murni CSS agar teks (kandidat LCP) tampil tanpa menunggu hidrasi.
  if (!onView) {
    return (
      <span style={{ "--d": `${delay}s` } as CSSProperties}>
        {words.map((word, i) => (
          <Fragment key={i}>
            <span className="-mb-[0.08em] inline-block overflow-hidden pb-[0.08em] align-bottom">
              <span className="animate-word inline-block origin-bottom-left" style={{ "--i": i } as CSSProperties}>
                {word}
              </span>
            </span>
            {i < words.length - 1 && " "}
          </Fragment>
        ))}
      </span>
    );
  }
  return (
    <motion.span
      ref={ref}
      initial="hidden"
      animate={!onView || seen ? "shown" : "hidden"}
      transition={{ staggerChildren: 0.07, delayChildren: delay }}
    >
      {words.map((word, i) => (
        <Fragment key={i}>
          <span className="-mb-[0.08em] inline-block overflow-hidden pb-[0.08em] align-bottom">
            <motion.span
              className="inline-block origin-bottom-left"
              variants={{ hidden: { y: "105%", rotate: 6 }, shown }}
              transition={{ duration: 0.75, ease }}
            >
              {word}
            </motion.span>
          </span>
          {i < words.length - 1 && " "}
        </Fragment>
      ))}
    </motion.span>
  );
}

/**
 * Angka yang berhitung saat terlihat. Teks awal di HTML sudah nilai akhirnya,
 * jadi tanpa JavaScript (atau dengan kurangi gerakan) angkanya tetap benar.
 */
export function CountUp({ value, from = 0, className }: { value: string; from?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    const match = value.match(/\d+/);
    if (!inView || reduce || !el || !match || match.index === undefined) return;
    const [before, after] = [value.slice(0, match.index), value.slice(match.index + match[0].length)];
    const fmt = new Intl.NumberFormat("id-ID");
    const controls = animate(from, Number(match[0]), {
      duration: 1.6,
      ease,
      onUpdate: (v) => (el.textContent = before + fmt.format(Math.round(v)) + after),
    });
    return () => controls.stop();
  }, [inView, reduce, value, from]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {value}
    </span>
  );
}

/**
 * Foto berbentuk lengkung pintu yang "terbuka" dari bawah ke atas,
 * sementara fotonya sendiri mundur pelan dari zoom.
 */
export function ArchReveal({ delay = 0, className, children }: { delay?: number; className?: string; children: ReactNode }) {
  const [ref, seen] = useSeen<HTMLDivElement>("0px 0px -10% 0px");
  return (
    <motion.div
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      initial="hidden"
      animate={seen ? "shown" : "hidden"}
      variants={{
        hidden: { clipPath: "inset(100% 0% 0% 0% round 50% 50% 0 0)" },
        shown: { clipPath: "inset(0% 0% 0% 0% round 0% 0% 0 0)" },
      }}
      transition={{ duration: 1.1, delay, ease }}
    >
      <motion.div
        className="absolute inset-0"
        variants={{ hidden: { scale: 1.25 }, shown: { scale: 1 } }}
        transition={{ duration: 1.6, delay, ease }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/** Muncul memantul dari kecil sambil berputar, untuk lencana angka. */
export function Pop({ delay = 0, className, children }: { delay?: number; className?: string; children: ReactNode }) {
  const [ref, seen] = useSeen<HTMLSpanElement>();
  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ scale: 0, rotate: -90 }}
      animate={seen ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -90 }}
      transition={{ type: "spring", stiffness: 300, damping: 15, delay }}
    >
      {children}
    </motion.span>
  );
}

/**
 * Tok-tok: sekali disentuh kursor, getaran dimainkan sampai selesai walau kursor sudah pergi.
 * Selama masih bergetar, sentuhan berikutnya diabaikan supaya tidak terpotong.
 */
export function Knock({ className, children }: { className?: string; children: ReactNode }) {
  const [scope, animate] = useAnimate();
  const busy = useRef(false);
  const reduce = useReducedMotion();

  async function knock() {
    if (busy.current || reduce) return;
    busy.current = true;
    await animate(scope.current, { rotate: [0, -6, 5, -4, 3, -1.5, 0] }, { duration: 0.7, ease: "easeOut" });
    busy.current = false;
  }

  return (
    <div ref={scope} className={className} style={{ transformOrigin: "50% 100%" }} onPointerEnter={knock}>
      {children}
    </div>
  );
}

/** Bergeser lebih lambat dari scroll, memberi kedalaman. */
export function Parallax({ distance = 80, className, children }: { distance?: number; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, distance]);
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}
