"use client";

import { AnimatePresence, motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { Reveal } from "@/components/motion";
import { cn } from "@/lib/cn";
import { ease } from "@/lib/ease";
import type { ContentMap, FacilityIcon } from "@/data/content";
import { type Floor, type Room, floorOrder, floors, isVacant, vacantOf } from "@/data/rooms";

/*
 * Denah sederhana, tidak berskala. Digambar dari video tur lantai bawah dan keterangan pemilik
 * untuk lantai atas. Tegak: belakang rumah di atas, pintu depan di bawah.
 * Lebar dalam rumah x 20–300. Lorong di kiri (x 20–90), kamar di kanan (x 90–300).
 */

type Area = { x: number; y: number; w: number; h: number; label: string; sub?: string; kind?: "outdoor" | "service" };
type RoomBox = { number: number; y: number; h: number };

/** `roomX`: tepi kiri kamar (= lebar lorong). `stairW`: lebar lubang tangga; sisanya jalan di sebelah kanannya. */
const plans: Record<Floor, { areas: Area[]; rooms: RoomBox[]; roomX: number; stairW: number; doors: [number, number, number][]; walls: string; stairs: "turun" | "naik"; summary: string }> = {
  bawah: {
    areas: [
      { x: 20, y: 18, w: 280, h: 58, label: "Halaman belakang", kind: "outdoor" },
      { x: 20, y: 80, w: 90, h: 80, label: "Kamar mandi", kind: "service" },
      { x: 110, y: 80, w: 190, h: 80, label: "Dapur", sub: "kulkas, kompor, alat makan", kind: "service" },
      { x: 80, y: 160, w: 220, h: 100, label: "Ruang bersama", sub: "dispenser, meja, jemuran" },
      { x: 20, y: 260, w: 70, h: 220, label: "Lorong" },
      { x: 20, y: 480, w: 280, h: 80, label: "Parkir motor", sub: "dan rak sepatu" },
      { x: 20, y: 564, w: 280, h: 30, label: "Teras · Gg. Silaturahim", kind: "outdoor" },
    ],
    roomX: 90,
    stairW: 60,
    // Pintu kamar menghadap lorong; nomor 1 paling dekat pintu depan.
    rooms: [
      { number: 3, y: 260, h: 73 },
      { number: 2, y: 333, h: 73 },
      { number: 1, y: 406, h: 74 },
    ],
    // Celah pintu di dinding luar: [x awal, x akhir, y].
    doors: [
      [130, 160, 80], // pintu belakang ke halaman
      [26, 76, 560], // pintu depan, sisi kiri
    ],
    // Dinding dalam kamar mandi, dengan celah pintu ke arah dapur.
    walls: "M20 160 H110 M110 80 V128 M110 152 V160",
    // Lantai bawah: panah ke arah depan rumah (bawah gambar).
    stairs: "turun",
    summary: "Kamar 1–3, ruang bersama, dapur, dan kamar mandi.",
  },
  atas: {
    areas: [
      { x: 20, y: 80, w: 90, h: 80, label: "Kamar mandi", kind: "service" },
      // Jemuran turun lebih rendah dari kamar mandi: pintunya di sisi kiri, menghadap lorong (bukan lewat kamar mandi).
      { x: 110, y: 80, w: 190, h: 110, label: "Jemuran", sub: "ruang terbuka, beratap kisi", kind: "outdoor" },
      // Lorong memanjang di kiri sampai teras: lubang tangga di sisi kiri, jalan di sisi kanannya (foto lantai atas).
      { x: 20, y: 160, w: 90, h: 340, label: "Lorong" },
      { x: 20, y: 500, w: 280, h: 60, label: "Teras atas", sub: "berpagar besi", kind: "outdoor" },
    ],
    roomX: 110,
    stairW: 44,
    // Kamar memenuhi sisi kanan dari bawah jemuran sampai teras. Kamar 4 (paling luas) paling dekat jemuran, nomor naik ke arah depan.
    rooms: [
      { number: 4, y: 190, h: 94 },
      { number: 5, y: 284, h: 72 },
      { number: 6, y: 356, h: 72 },
      { number: 7, y: 428, h: 72 },
    ],
    doors: [],
    // Kamar mandi atas (pintu menghadap ujung lorong, tertutup dari jemuran) dan dinding kiri jemuran dengan celah pintu ke lorong.
    walls: "M20 160 H72 M98 160 H110 M110 80 V166 M110 184 V190",
    // Lantai atas: tangga berbalik, jadi panah menghadap ke belakang rumah (atas gambar).
    stairs: "naik",
    summary: "Kamar 4–7, kamar mandi, jemuran, dan teras depan.",
  },
};

function AreaShape({ a }: { a: Area }) {
  return (
    <g>
      <rect
        x={a.x}
        y={a.y}
        width={a.w}
        height={a.h}
        className={cn(
          a.kind === "outdoor" ? "fill-transparent stroke-line" : a.kind === "service" ? "fill-brand-50" : "fill-paper",
        )}
        strokeDasharray={a.kind === "outdoor" ? "4 4" : undefined}
        strokeWidth={a.kind === "outdoor" ? 1.5 : 0}
      />
      {a.label && (
        <text x={a.x + a.w / 2} y={a.y + a.h / 2 + (a.sub ? -2 : 4)} textAnchor="middle" fontSize="11" className="fill-navy-700 font-sans font-semibold">
          {a.label}
        </text>
      )}
      {a.sub && (
        <text x={a.x + a.w / 2} y={a.y + a.h / 2 + 12} textAnchor="middle" fontSize="9" className="fill-subtle font-sans">
          {a.sub}
        </text>
      )}
    </g>
  );
}

/** Kamar: oranye kalau kosong (sama dengan pintu terbuka di seluruh situs), hijau muda kalau terisi. */
function RoomShape({ r, rooms, x0 }: { r: RoomBox; rooms: Room[]; x0: number }) {
  const room = rooms.find((x) => x.number === r.number);
  const vacant = room ? isVacant(room) : false;
  const cy = r.y + r.h / 2;
  return (
    <g>
      <rect x={x0} y={r.y} width={300 - x0} height={r.h} className={vacant ? "fill-accent-50" : "fill-surface"} />
      <rect x={x0} y={r.y} width={300 - x0} height={r.h} fill="none" strokeWidth="2" className="stroke-brand-500" />
      {/* Pintu kamar di dinding lorong, berbentuk lengkung seperti pintu di logo */}
      <path
        d={`M${x0 - 4} ${cy + 11} V${cy - 5} a4 4 0 0 1 8 0 V${cy + 11} Z`}
        className={vacant ? "fill-accent-500" : "fill-brand-500"}
      />
      <text x={x0 + 20} y={cy - 2} fontSize="12" className="fill-navy-700 font-sans font-bold">
        Kamar {r.number}
      </text>
      <text x={x0 + 20} y={cy + 12} fontSize="9.5" className={cn("font-sans", vacant ? "fill-accent-700 font-semibold" : "fill-subtle")}>
        {vacant ? "Kosong" : "Terisi"}
        {room && ` · ${room.size.includes("×") ? room.size : "paling luas"}`}
      </text>
    </g>
  );
}

/** `gap`: jarak ke bawah dari dinding kamar mandi (lantai atas). `w`: lebar lubang tangga; `parapet`: tembok setengah di sisi kanannya. */
function Stairs({ dir, gap = 0, w = 60, parapet = false }: { dir: "turun" | "naik"; gap?: number; w?: number; parapet?: boolean }) {
  const cx = 20 + w / 2;
  return (
    <g transform={gap ? `translate(0 ${gap})` : undefined}>
      <rect x={20} y={160} width={w} height={100} className="fill-surface" />
      {Array.from({ length: 7 }, (_, i) => (
        <path key={i} d={`M24 ${170 + i * 11} H${16 + w}`} className="stroke-brand-200" strokeWidth="1.5" />
      ))}
      {/* Panah = arah tangga. Lantai bawah menghadap depan rumah (bawah gambar), lantai atas ke belakang (atas gambar). */}
      <path
        d={dir === "turun" ? `M${cx} 170 V238 M${cx - 6} 232 L${cx} 240 L${cx + 6} 232` : `M${cx} 238 V170 M${cx - 6} 176 L${cx} 168 L${cx + 6} 176`}
        fill="none"
        className="stroke-navy-700"
        strokeWidth="1.5"
      />
      <text x={cx} y={253} textAnchor="middle" fontSize="9.5" className="fill-subtle font-sans">
        Tangga
      </text>
      {/* Tembok setengah (pagar tangga) di sisi kanan lubang. */}
      {parapet && <path d={`M${20 + w} 160 V260`} fill="none" strokeWidth="4" strokeLinecap="round" className="stroke-navy-700/70" />}
    </g>
  );
}

/** Denah satu lantai. Dinding luar digambar terakhir supaya celah pintu bisa "memotong" garisnya. */
function FloorPlan({ floor, rooms }: { floor: Floor; rooms: Room[] }) {
  const plan = plans[floor];
  return (
    <motion.g
      key={floor}
      // Ganti lantai = naik/turun tangga: lantai atas datang dari atas, lantai bawah dari bawah.
      initial={{ opacity: 0, y: floor === "atas" ? -24 : 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: floor === "atas" ? -24 : 24 }}
      transition={{ duration: 0.4, ease }}
    >
      {plan.areas.map((a) => (
        <AreaShape key={`${a.x}-${a.y}`} a={a} />
      ))}
      <Stairs dir={plan.stairs} gap={floor === "atas" ? 26 : 0} w={plan.stairW} parapet={floor === "atas"} />
      {plan.rooms.map((r) => (
        <RoomShape key={r.number} r={r} rooms={rooms} x0={plan.roomX} />
      ))}
      <path d={plan.walls} fill="none" strokeWidth="3" className="stroke-brand-500" />
      {/* Dinding luar rumah */}
      <rect
        x={20}
        y={80}
        width={280}
        height={floor === "bawah" ? 480 : 420}
        fill="none"
        strokeWidth="6"
        className="stroke-brand-500"
      />
      {plan.doors.map(([x1, x2, y]) => (
        <g key={`${x1}-${y}`}>
          <path d={`M${x1} ${y} H${x2}`} strokeWidth="8" className="stroke-surface" />
          <path d={`M${x1} ${y} H${x2}`} strokeWidth="3" className="stroke-accent-500" strokeLinecap="round" />
        </g>
      ))}
      {floor === "atas" && (
        // Pagar besi teras atas, garis vertikal tipis di tepi depan
        <path
          d={Array.from({ length: 28 }, (_, i) => `M${24 + i * 10} 556 V548`).join(" ")}
          className="stroke-navy-700/50"
          strokeWidth="1"
        />
      )}
    </motion.g>
  );
}

/** Ikon garis 24×24, gaya sama dengan `icons.tsx`. Tiap string = satu goresan yang digambar berurutan. */
const facilityIcons: Record<FacilityIcon, string[]> = {
  // Titik lalu gelombang dari dalam ke luar, seperti sinyal tersambung.
  wifi: ["M12 18h.01", "M8.5 14.5a5 5 0 0 1 7 0", "M5 11a10 10 0 0 1 14 0", "M2 7.5a15 15 0 0 1 20 0"],
  // Rambu parkir "P", lebih mudah dikenali daripada siluet motor sekecil ini.
  motor: ["M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z", "M9.5 17V7H13a3 3 0 0 1 0 6H9.5"],
  mandi: ["M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z", "M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"],
  dapur: ["M4 11h16", "M6 11v6a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-6", "M9 3.5v3", "M12 2.5v4", "M15 3.5v3"],
  jemuran: [
    "M2 4h20",
    "M8.5 4 4 7.5l2.5 3L8 9.5V20h8V9.5l1.5 1 2.5-3L15.5 4",
    "M8.5 4a3.5 3.5 0 0 0 7 0",
  ],
  cctv: ["M2.5 10 14 6l2 6-11.5 4z", "M15.3 9.5 19 11v4.5", "M19 15.5h2.5", "M6.5 11.5h.01"],
};

/** Ikon di dalam bingkai berbentuk pintu lengkung, sama dengan pintu di logo. Goresannya tergambar saat terlihat. */
function FacilityGlyph({ icon, show, delay }: { icon: FacilityIcon; show: boolean; delay: number }) {
  return (
    <span aria-hidden className="absolute top-1/2 left-0 grid h-14 w-12 -translate-y-1/2 place-items-center rounded-t-full bg-brand-50 pt-1.5 text-brand-500">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-7">
        {facilityIcons[icon].map((d, j) => (
          <motion.path
            key={d}
            d={d}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={show ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
            transition={{ pathLength: { duration: 0.5, delay: delay + j * 0.12, ease: "easeOut" }, opacity: { duration: 0.01, delay: delay + j * 0.12 } }}
          />
        ))}
      </svg>
    </span>
  );
}

/** Daftar fasilitas bersama. */
function SharedList({ items }: { items: ContentMap["sharedFacilities"] }) {
  const ref = useRef<HTMLDListElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  return (
    <dl ref={ref} className="mt-2">
      {items.map((f, i) => (
        <div
          key={f.place}
          className={cn(
            "relative py-3.5 pl-16",
            i < items.length - 1 && "border-b border-dashed border-line",
          )}
        >
          <dt className="text-sm font-semibold text-brand-500">
            <FacilityGlyph icon={f.icon} show={seen} delay={0.2 + i * 0.12} />
            {f.place}
          </dt>
          <dd className="text-lg text-ink">{f.text}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Fasilitas: denah rumah per lantai di kiri, fasilitas bersama per tempat di kanan. */
export function Facilities({ rooms, shared }: { rooms: Room[]; shared: ContentMap["sharedFacilities"] }) {
  const vacantRooms = vacantOf(rooms);
  const [floor, setFloor] = useState<Floor>(vacantRooms[0]?.floor ?? "bawah");

  return (
    <div className="grid items-start gap-4 md:grid-cols-2">
      <Reveal className="flex flex-col gap-5 rounded-card bg-surface p-6 md:p-8">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-h3 text-navy-700">Denah rumah</h3>
            <div className="grid grid-cols-2 gap-1 rounded-full bg-filled p-1" role="group" aria-label="Pilih lantai denah">
              {floorOrder
                .slice()
                .reverse()
                .map((f) => (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={f === floor}
                    onClick={() => setFloor(f)}
                    className={cn(
                      "min-h-9 rounded-full px-3.5 text-sm font-semibold transition-colors",
                      f === floor ? "bg-surface text-navy-700 shadow-card" : "text-subtle hover:text-navy-700",
                    )}
                  >
                    {floors[f].label}
                  </button>
                ))}
            </div>
          </div>
          <p className="mt-2 text-subtle" aria-live="polite">
            {plans[floor].summary}
          </p>
        </div>

        <svg
          viewBox="0 0 320 600"
          className="mx-auto block w-full max-w-[20rem]"
          role="img"
          aria-label={`Denah ${floors[floor].label.toLowerCase()}. ${plans[floor].summary} Kamar kosong: ${vacantRooms.map((r) => r.number).join(", ") || "tidak ada"}.`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <FloorPlan key={floor} floor={floor} rooms={rooms} />
          </AnimatePresence>
        </svg>

        <div className="flex flex-col gap-1 text-sm text-subtle">
          <p className="flex items-center gap-2">
            <span aria-hidden className="h-3.5 w-2.5 rounded-t-full bg-accent-500" /> Kamar kosong
            <span aria-hidden className="ml-3 h-3.5 w-2.5 rounded-t-full bg-brand-500" /> Terisi
          </p>
          <p>Denah sederhana, tidak sesuai skala.</p>
        </div>
      </Reveal>

      <Reveal delay={0.12} className="flex flex-col rounded-card bg-surface p-6 md:p-8">
        <h3 className="text-h3 text-navy-700">Dipakai bersama</h3>
        <SharedList items={shared} />
      </Reveal>
    </div>
  );
}
