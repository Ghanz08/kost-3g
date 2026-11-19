import * as motion from "motion/react-client";
import { Door } from "@/components/door";
import { Logo } from "@/components/logo";
import { Knock } from "@/components/motion";
import { cn } from "@/lib/cn";
import { ease } from "@/lib/ease";
import { type Room, isVacant, roomsOn, rupiah, vacantOf } from "@/data/rooms";

type TagPlacement = "above" | "right" | "below";

function VacancyTag({ room, placement }: { room: Room; placement: TagPlacement }) {
  return (
    <span
      className={cn(
        "absolute z-10 flex animate-tag-in items-center gap-[1.4cqw] rounded-[10px] bg-surface px-[2.2cqw] py-[1.4cqw] whitespace-nowrap shadow-raised",
        placement === "above" && "bottom-[calc(100%+2.4cqw)] left-1/2 -translate-x-1/2",
        placement === "below" && "top-[calc(100%+2.4cqw)] left-1/2 -translate-x-1/2",
        placement === "right" && "top-[26%] left-[calc(100%+3cqw)]",
      )}
    >
      <span className="h-[2.6cqw] w-[1.9cqw] shrink-0 rounded-t-full bg-accent-500" />
      <span className="flex flex-col leading-tight">
        <span className="text-[clamp(0.6875rem,2.5cqw,0.875rem)] font-semibold text-navy-700">
          Kamar {room.number}
          <span className="hidden @[440px]/house:inline"> kosong</span>
        </span>
        <span className="text-[clamp(0.625rem,2.3cqw,0.8125rem)] text-subtle">
          {rupiah(room.monthly)}
          <span className="hidden @[440px]/house:inline"> per bulan</span>
        </span>
      </span>
      {placement === "above" && (
        <span className="absolute top-full left-1/2 size-0 -translate-x-1/2 border-x-[7px] border-t-[8px] border-x-transparent border-t-surface" />
      )}
      {placement === "below" && (
        <span className="absolute bottom-full left-1/2 size-0 -translate-x-1/2 border-x-[7px] border-b-[8px] border-x-transparent border-b-surface" />
      )}
      {placement === "right" && (
        <span className="absolute top-1/2 right-full h-[2px] w-[3cqw] bg-accent-500" />
      )}
    </span>
  );
}

/** Urutan masuk: atap tergambar, dinding naik, lalu pintu muncul satu per satu dan yang kosong berayun terbuka. */
function DoorSlot({ room, placement, order }: { room: Room; placement: TagPlacement; order: number }) {
  const vacant = isVacant(room);
  return (
    <motion.div
      // Pintu tertutup di atas cahaya pintu kosong sebelahnya.
      className={cn("relative w-[15.7cqw]", !vacant && "z-10")}
      initial={{ opacity: 0, y: "18%", scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.75 + order * 0.07, ease }}
      // Pintu kosong sedikit maju menyambut; pintu tertutup diketuk (lihat <Knock>).
      whileHover={vacant ? { scale: 1.06 } : undefined}
      style={{ transformOrigin: "50% 100%" }}
    >
      {vacant && (
        <span className="pointer-events-none absolute -inset-x-[35%] -inset-y-[8%] animate-glow rounded-full bg-accent-500/40 blur-2xl" />
      )}
      {vacant ? (
        <Door number={room.number} open animate />
      ) : (
        <Knock>
          <Door number={room.number} />
        </Knock>
      )}
      {vacant && <VacancyTag room={room} placement={placement} />}
    </motion.div>
  );
}

/** Detik saat atap selesai tergambar; papan mulai dipasang setelahnya. */
const SIGN_AT = 0.95;
const rope = { duration: 0.4, delay: SIGN_AT + 0.15, ease: "easeOut" } as const;

/**
 * Papan nama dengan logo asli, digantung dua tali dari paku di puncak atap.
 * Urutan pasang: paku tertancap, tali terulur, papan yang terlipat ke atas berayun turun (3D)
 * ke posisinya, berayun sedikit lalu tenang, kemudian bergoyang pelan tertiup angin.
 * Ukurannya sengaja kecil supaya tidak menabrak label kamar kosong di lantai atas.
 */
function HangingSign() {
  return (
    <motion.div
      className="absolute top-[3cqw] left-1/2 w-[15cqw] -translate-x-1/2"
      style={{ transformOrigin: "50% 0" }}
      initial={{ rotate: 0 }}
      animate={{ rotate: [0, 2.5, -1.6, 0.8, 0] }}
      transition={{ duration: 2, delay: SIGN_AT + 0.85, ease: "easeInOut" }}
      whileHover={{ rotate: [0, -5, 3.5, -2, 0.8, 0], transition: { duration: 1.6, ease: "easeOut" } }}
    >
      <div className="origin-top animate-sway">
        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="block h-[4cqw] w-full overflow-visible">
          {["M50 0 L10 30", "M50 0 L90 30"].map((d) => (
            <motion.path
              key={d}
              d={d}
              fill="none"
              className="stroke-navy-700"
              strokeWidth="0.8"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={rope}
            />
          ))}
        </svg>
        <motion.span
          className="absolute top-0 left-1/2 size-[1.1cqw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-navy-900"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 600, damping: 14, delay: SIGN_AT }}
        />
        <motion.div
          className="relative rounded-[1cqw] border-[0.45cqw] border-brand-500 bg-surface px-[1.4cqw] py-[0.9cqw] shadow-raised"
          style={{ transformOrigin: "50% 0", transformPerspective: 300 }}
          initial={{ rotateX: -100, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          transition={{
            rotateX: { type: "spring", stiffness: 110, damping: 11, delay: SIGN_AT + 0.45 },
            opacity: { duration: 0.2, delay: SIGN_AT + 0.45 },
          }}
        >
          <span className="absolute top-[0.45cqw] left-[1.1cqw] size-[0.6cqw] rounded-full bg-brand-200" />
          <span className="absolute top-[0.45cqw] right-[1.1cqw] size-[0.6cqw] rounded-full bg-brand-200" />
          <Logo className="mx-auto h-[3.8cqw]" />
        </motion.div>
      </div>
    </motion.div>
  );
}

/**
 * Ilustrasi Kost 3g: ruko dua lantai dengan tujuh pintu.
 * Pintu terbuka berarti kamar kosong, pintu tertutup berarti terisi.
 * Semuanya dibaca dari `src/data/rooms.ts`.
 */
export function House({ rooms, className }: { rooms: Room[]; className?: string }) {
  const upper = roomsOn(rooms, "atas");
  const lower = roomsOn(rooms, "bawah");
  const vacantRooms = vacantOf(rooms);
  const vacantList = vacantRooms.map((r) => r.number).join(" dan ");
  const label = vacantRooms.length
    ? `Ilustrasi Kost 3g, rumah dua lantai dengan tujuh kamar. Kamar ${vacantList} kosong.`
    : "Ilustrasi Kost 3g, rumah dua lantai dengan tujuh kamar. Semua kamar sedang terisi.";

  return (
    <figure className={cn("@container/house relative mx-auto w-full max-w-[35rem]", className)}>
      <div role="img" aria-label={label}>
        <div aria-hidden>
          <div className="relative">
            <svg viewBox="0 0 560 146" className="block w-full overflow-visible">
              <motion.path
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ pathLength: { duration: 1, ease: "easeInOut" }, opacity: { duration: 0.2 } }}
                d="M5 146 L280 6 L555 146"
                fill="none"
                className="stroke-brand-500"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <HangingSign />
          </div>
          <motion.div
            className="border-x-[1.8cqw] border-b-[1.8cqw] border-brand-500"
            initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
            animate={{ clipPath: "inset(0% 0% 0% 0%)", transitionEnd: { clipPath: "none" } }}
            transition={{ duration: 0.9, delay: 0.35, ease }}
          >
            <div className="flex justify-center gap-[5cqw] pt-[5cqw]">
              {upper.map((room, i) => (
                <DoorSlot key={room.number} room={room} placement="above" order={i} />
              ))}
            </div>
            <div className="h-[1.1cqw] bg-brand-500" />
            <div className="flex gap-[3.6cqw] pt-[5cqw] pl-[4.3cqw]">
              {lower.map((room, i) => (
                <DoorSlot
                  key={room.number}
                  room={room}
                  placement={i === lower.length - 1 ? "right" : "below"}
                  order={upper.length + i}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-sm text-subtle">
        Gg. Silaturahim No. 26 D, Brayan, Medan
      </figcaption>
    </figure>
  );
}
