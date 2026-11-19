import { ButtonLink } from "@/components/button";
import { Door } from "@/components/door";
import { PinIcon } from "@/components/icons";
import { Reveal } from "@/components/motion";
import { cn } from "@/lib/cn";
import { directionsUrl, fullAddress } from "@/lib/site";
import { campuses } from "@/data/content";

type Pt = [number, number];
type MapConfig = {
  w: number;
  h: number;
  main: [Pt, Pt];
  roads: [Pt, Pt, number][];
  kost: Pt;
  gangY: number;
  blocks: [number, number, number, number][];
  mainLabel: { x: number; y: number };
  gangLabel: { x: number; y: number };
  compact?: boolean;
};

const wide: MapConfig = {
  w: 1200,
  h: 560,
  main: [[480, -30], [440, 590]],
  roads: [
    [[-30, 90], [1230, 56], 12],
    [[-30, 459], [1230, 504], 12],
    [[760, -30], [1230, 250], 10],
  ],
  kost: [600, 300],
  gangY: 306,
  blocks: [[500, 116, 90, 104], [500, 350, 110, 80], [640, 350, 140, 80], [300, 340, 100, 80], [640, 120, 100, 100], [900, 380, 120, 70]],
  mainLabel: { x: 470, y: 530 },
  gangLabel: { x: 530, y: 334 },
};

const compact: MapConfig = {
  w: 342,
  h: 220,
  main: [[123, -30], [103, 250]],
  roads: [
    [[-30, 35], [372, 22], 9],
    [[-30, 189], [372, 202], 9],
    [[253, -30], [372, 79], 8],
  ],
  kost: [239, 125],
  gangY: 130,
  blocks: [[14, 70, 68, 40], [157, 48, 55, 40], [280, 136, 48, 40], [150, 150, 62, 28]],
  mainLabel: { x: 131, y: 112 },
  gangLabel: { x: 176, y: 150 },
  compact: true,
};

/** Denah sederhana bergaya brand. Bukan peta berskala; label di atasnya menyatakan itu. */
function SchematicMap({ cfg, className }: { cfg: MapConfig; className?: string }) {
  const [[x0, y0], [x1, y1]] = cfg.main;
  const roadX = (y: number) => x0 + (x1 - x0) * ((y - y0) / (y1 - y0));
  const angle = (Math.atan2(y1 - y0, Math.abs(x0 - x1)) * 180) / Math.PI;
  const gangStart: Pt = [roadX(cfg.gangY), cfg.gangY];
  const allRoads: [Pt, Pt, number][] = [[cfg.main[0], cfg.main[1], cfg.compact ? 18 : 26], ...cfg.roads, [gangStart, cfg.kost, cfg.compact ? 6 : 9]];
  const [kx, ky] = cfg.kost;
  const s = cfg.compact ? 0.8 : 1;

  return (
    <svg
      viewBox={`0 0 ${cfg.w} ${cfg.h}`}
      preserveAspectRatio="xMinYMid slice"
      className={cn("block size-full bg-filled", className)}
      role="img"
      aria-label="Denah sederhana lokasi Kost 3g di Gg. Silaturahim, dari Jl. KL Yos Sudarso"
    >
      {cfg.blocks.map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx={8} className="fill-surface/55" />
      ))}
      {allRoads.map(([a, b, sw], i) => (
        <line key={`o${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={sw + 5} strokeLinecap="round" className="stroke-line" />
      ))}
      {allRoads.map(([a, b, sw], i) => (
        <line key={`r${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={sw} strokeLinecap="round" className="stroke-surface" />
      ))}
      {/* Rute jalan kaki dari jalan besar ke kost, titik-titiknya terus berjalan. */}
      <line
        x1={gangStart[0]}
        y1={gangStart[1]}
        x2={kx}
        y2={ky}
        strokeWidth={cfg.compact ? 2.5 : 3.5}
        strokeDasharray="2 10"
        strokeLinecap="round"
        className="animate-march stroke-accent-500"
      />
      <text
        x={cfg.mainLabel.x}
        y={cfg.mainLabel.y}
        transform={`rotate(${-angle} ${cfg.mainLabel.x} ${cfg.mainLabel.y})`}
        className="fill-subtle font-sans"
        fontSize={cfg.compact ? 11 : 13}
      >
        {cfg.compact ? "Jl. Yos Sudarso" : "Jl. KL Yos Sudarso"}
      </text>
      <text x={cfg.gangLabel.x} y={cfg.gangLabel.y} textAnchor="middle" className="fill-subtle font-sans" fontSize={cfg.compact ? 11 : 13}>
        Gg. Silaturahim
      </text>
      <g transform={`translate(${kx} ${ky}) scale(${s})`}>
        <circle r={7} className="origin-center animate-ping-soft fill-accent-500 [transform-box:fill-box]" />
        <circle r={7} strokeWidth={3} className="fill-accent-500 stroke-surface" />
        {/* Penanda jatuh dari atas lalu memantul saat denah terlihat. */}
        <Reveal as="g" y={-40} delay={0.3}>
          <path d="M-7 -18 L0 -10 L7 -18 Z" className="fill-navy-900" />
          <rect x={-54} y={-62} width={108} height={45} rx={22.5} className="fill-navy-900" />
          <path d="M-38 -27 V-42 a7 7 0 0 1 14 0 V-27 Z" className="fill-accent-500" />
          <text x={-16} y={-34} className="fill-white font-sans font-semibold" fontSize={15}>
            Kost 3g
          </text>
        </Reveal>
      </g>
    </svg>
  );
}

function Signs({ compact = false }: { compact?: boolean }) {
  return (
    <ul className={cn("flex flex-col", compact ? "gap-2.5" : "gap-3")}>
      {campuses.map((c, i) => (
        <Reveal as="li" key={c.name} delay={0.2 + i * 0.12} x={40} y={0} className="rounded-lg bg-brand-500 p-1 shadow-card">
          <div className="flex items-center gap-3 rounded-md border-2 border-white px-3.5 py-2.5 text-white">
            <div className="min-w-0 flex-1">
              <p className={cn("font-semibold", compact ? "text-sm" : "text-base")}>{c.name}</p>
              <p className="text-sm text-white/85">{c.travel}</p>
            </div>
            <p className={cn("shrink-0 font-display font-semibold tracking-tight", compact ? "text-lg" : "text-2xl")}>{c.distance}</p>
          </div>
        </Reveal>
      ))}
    </ul>
  );
}

function AddressBlock({ H = "h3" }: { H?: "h2" | "h3" }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <H className="font-semibold text-navy-700">Alamat</H>
        <p className="mt-1 text-ink">{fullAddress}</p>
      </div>
      <div className="flex items-center gap-3 rounded-xl bg-paper p-3">
        <Door open className="w-10 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-navy-700">Cari bangunan ini</p>
          <p className="text-sm text-subtle">Ruko putih dua lantai, plang Kost 3g di atas pintu.</p>
        </div>
      </div>
      <ButtonLink href={directionsUrl} external icon={<PinIcon />} className="w-full">
        Buka rute di Google Maps
      </ButtonLink>
    </div>
  );
}

function ScaleNote({ className }: { className?: string }) {
  return (
    <p className={cn("rounded-full bg-surface/90 px-3 py-1 text-xs text-subtle", className)}>
      Denah sederhana, tidak sesuai skala
    </p>
  );
}

/** Panel lokasi: denah penuh, kartu alamat, dan tiang rambu jarak ke kampus. */
/** `heading`: h2 bila panel dipakai tepat di bawah judul halaman (h1), h3 bila di bawah judul bagian (h2). */
export function LocationPanel({ showDetailLink = true, heading: H = "h3" }: { showDetailLink?: boolean; heading?: "h2" | "h3" }) {
  return (
    <>
      {/* Layar lebar: denah memenuhi panel, info melayang di atasnya. */}
      <div className="relative hidden h-[35rem] overflow-hidden rounded-card lg:block">
        <SchematicMap cfg={wide} className="absolute inset-0" />
        <span aria-hidden className="absolute top-4 right-4 grid size-8 place-items-center rounded-full bg-surface text-xs font-semibold text-navy-700">
          U
        </span>
        <div className="absolute top-8 left-8 w-[22.5rem] rounded-card bg-surface p-6 shadow-raised">
          <AddressBlock H={H} />
          {showDetailLink && (
            <ButtonLink href="/lokasi" variant="ghost" className="mt-2 -ml-5">
              Lihat detail lokasi
            </ButtonLink>
          )}
        </div>
        <div className="absolute top-22 right-10 bottom-[6.875rem] w-[16.875rem] xl:w-75">
          <span aria-hidden className="absolute -top-3.5 bottom-0 left-1/2 w-2.5 -translate-x-1/2 rounded bg-muted" />
          <span aria-hidden className="absolute -bottom-1.5 left-1/2 h-3 w-11 -translate-x-1/2 rounded-[50%] bg-line" />
          <div className="relative">
            <H className="sr-only">Jarak ke kampus</H>
            <Signs />
          </div>
        </div>
        <ScaleNote className="absolute right-4 bottom-4" />
      </div>

      {/* Layar HP dan tablet: denah di atas, rambu dan alamat di bawah. */}
      <div className="overflow-hidden rounded-card bg-surface lg:hidden">
        <div className="relative aspect-[342/220] md:aspect-[16/7]">
          <SchematicMap cfg={compact} className="absolute inset-0" />
          <ScaleNote className="absolute bottom-3 left-3" />
        </div>
        <div className="flex flex-col gap-6 p-5 md:grid md:grid-cols-2 md:p-8">
          <div className="flex gap-3">
            <span aria-hidden className="w-2 shrink-0 rounded bg-muted" />
            <div className="flex-1">
              <H className="sr-only">Jarak ke kampus</H>
              <Signs compact />
            </div>
          </div>
          <div>
            <AddressBlock H={H} />
            {showDetailLink && (
              <ButtonLink href="/lokasi" variant="ghost" className="mt-1 -ml-5">
                Lihat detail lokasi
              </ButtonLink>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
