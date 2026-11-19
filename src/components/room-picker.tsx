"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { ButtonLink } from "@/components/button";
import { Door } from "@/components/door";
import { ChatIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { ease } from "@/lib/ease";
import { waLink, waMessages } from "@/lib/site";
import {
  type Floor,
  type Room,
  floorOrder,
  floors,
  isVacant,
  roomsOn,
  rupiah,
  shortRupiah,
  yearlyLabel,
} from "@/data/rooms";

/**
 * Pemilih kamar untuk layar HP: pilih lantai, ketuk pintu,
 * detail kamar tampil di bawahnya. Pengganti daftar panjang.
 */
export function RoomPicker({ rooms }: { rooms: Room[] }) {
  const [selected, setSelected] = useState((rooms.find(isVacant) ?? rooms[0]).number);
  const room = rooms.find((r) => r.number === selected) ?? rooms[0];
  const floor = room.floor;
  const vacant = isVacant(room);

  function pickFloor(f: Floor) {
    const list = roomsOn(rooms, f);
    setSelected((list.find(isVacant) ?? list[0]).number);
  }

  return (
    <div className="flex flex-col gap-5 rounded-card bg-surface p-4 sm:p-6">
      <div className="grid grid-cols-2 gap-1 rounded-full bg-filled p-1" role="group" aria-label="Pilih lantai">
        {floorOrder.map((f) => {
          const active = f === floor;
          const hasVacancy = roomsOn(rooms, f).some(isVacant);
          return (
            <button
              key={f}
              type="button"
              aria-pressed={active}
              onClick={() => pickFloor(f)}
              className={cn(
                "relative flex min-h-11 items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition-colors",
                active ? "text-navy-700" : "text-subtle",
              )}
            >
              {/* Pil putih meluncur ke lantai yang dipilih. */}
              {active && (
                <motion.span
                  layoutId="pil-lantai"
                  className="absolute inset-0 rounded-full bg-surface shadow-card"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative">{floors[f].label}</span>
              {hasVacancy && <span aria-hidden className="relative h-[11px] w-2 rounded-t-full bg-accent-500" />}
            </button>
          );
        })}
      </div>

      <div className="relative aspect-[2/1] overflow-hidden [border-radius:50%_50%_0_0/100%_100%_0_0]">
        <AnimatePresence initial={false}>
          <motion.div
            key={floor}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.12 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease }}
          >
            <Image
              src={floors[floor].photo}
              alt={floors[floor].photoAlt}
              fill
              sizes="(max-width: 1024px) 90vw, 400px"
              placeholder="blur"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="text-center text-sm text-subtle">
        {floors[floor].summary} Ketuk pintu untuk melihat tiap kamar.
      </p>

      <div className="flex items-end justify-center gap-4 sm:gap-6">
        {roomsOn(rooms, floor).map((r, i) => {
          const isSelected = r.number === selected;
          const vacantDoor = isVacant(r);
          return (
            <motion.button
              // key per lantai supaya pintu baru "berdiri" satu per satu saat ganti lantai.
              key={`${floor}-${r.number}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.45, ease }}
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={() => setSelected(r.number)}
              aria-pressed={isSelected}
              aria-label={`${r.number} ${shortRupiah(r.monthly)}, kamar ${r.number} ${vacantDoor ? "kosong" : "terisi"}, ${rupiah(r.monthly)} per bulan`}
              className="flex flex-col items-center gap-1 rounded-lg p-1"
            >
              <motion.span
                className="block"
                animate={{ y: isSelected ? -6 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
              >
                <Door
                  number={r.number}
                  open={vacantDoor}
                  className={cn("w-14 transition-opacity duration-300", !isSelected && "opacity-55")}
                />
              </motion.span>
              <span className={cn("text-sm", isSelected ? "font-semibold text-navy-700" : "text-subtle")}>
                {shortRupiah(r.monthly)}
              </span>
              <span aria-hidden className="relative h-[3px] w-7">
                {isSelected && (
                  <motion.span
                    layoutId="garis-kamar"
                    className="absolute inset-0 rounded-full bg-brand-500"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
              </span>
            </motion.button>
          );
        })}
      </div>

      <div aria-live="polite" className="overflow-hidden rounded-2xl bg-paper">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={room.number}
            data-lokasi={`kamar-${room.number}`}
            className="flex flex-col gap-2 p-5"
            initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -16, filter: "blur(4px)" }}
            transition={{ duration: 0.4, ease }}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-h3 text-navy-700">Kamar {room.number}</h3>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-semibold",
                  vacant ? "bg-accent-50 text-accent-700" : "bg-filled text-subtle",
                )}
              >
                {vacant ? "Kosong" : "Sudah terisi"}
              </span>
            </div>
            <p className="text-subtle">
              {room.size}, lantai {room.floor}
            </p>
            <p className="flex items-baseline gap-2">
              <span className={cn("text-price", vacant ? "text-brand-500" : "text-navy-700")}>{rupiah(room.monthly)}</span>
              <span className="text-sm text-subtle">per bulan</span>
            </p>
            <p className={cn("text-sm", vacant ? "text-accent-700" : "text-subtle")}>{yearlyLabel(room)}</p>
            <ButtonLink
              href={vacant ? waLink(waMessages.rooms([room.number])) : waLink(waMessages.vacancy)}
              external
              variant={vacant ? "primary" : "secondary"}
              icon={<ChatIcon />}
              className="mt-2 w-full"
            >
              {vacant ? `Tanya kamar ${room.number}` : "Tanya kamar yang masih kosong"}
            </ButtonLink>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
