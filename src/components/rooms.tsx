import Image from "next/image";
import { ButtonLink } from "@/components/button";
import { Door } from "@/components/door";
import { ChatIcon } from "@/components/icons";
import { ArchReveal, Reveal } from "@/components/motion";
import { cn } from "@/lib/cn";
import { waLink, waMessages } from "@/lib/site";
import { type Room, floorOrder, floors, isVacant, roomsOn, rupiah, yearlyShort } from "@/data/rooms";

function RoomRow({ room, last, index }: { room: Room; last: boolean; index: number }) {
  const vacant = isVacant(room);
  return (
    <Reveal
      as="li"
      delay={0.15 + index * 0.08}
      x={24}
      y={0}
      className={cn(
        "grid grid-cols-[3.5rem_1fr_auto_11.25rem] items-center gap-6 py-4",
        !last && "border-b border-dashed border-line",
      )}
    >
      <Door number={room.number} open={vacant} animate={vacant && "scroll"} className="w-14" />
      <div>
        <p className="font-semibold text-navy-700">Kamar {room.number}</p>
        <p className="text-sm text-subtle">{room.size}</p>
        <p className={cn("text-sm font-semibold", vacant ? "text-accent-700" : "text-subtle")}>
          {vacant ? "Kosong, bisa ditempati" : "Sudah terisi"}
        </p>
      </div>
      <div className="text-right">
        <p className={cn("text-h3", vacant ? "text-brand-500" : "text-subtle")}>{rupiah(room.monthly)}</p>
        <p className={cn("text-sm", vacant ? "text-accent-700" : "text-subtle")}>per bulan, {yearlyShort(room)}</p>
      </div>
      <div className="flex justify-end">
        {vacant && (
          <ButtonLink href={waLink(waMessages.rooms([room.number]))} external icon={<ChatIcon />}>
            Tanya kamar {room.number}
          </ButtonLink>
        )}
      </div>
    </Reveal>
  );
}

/** Daftar kamar per lantai untuk layar lebar. */
export function FloorList({ rooms }: { rooms: Room[] }) {
  return (
    <div className="flex flex-col gap-6">
      {floorOrder.map((floor) => {
        const list = roomsOn(rooms, floor);
        const vacant = list.filter(isVacant).length;
        const info = floors[floor];
        return (
          <Reveal
            as="section"
            key={floor}
            aria-labelledby={`lantai-${floor}`}
            className="grid grid-cols-[minmax(0,22.5rem)_1fr] gap-12 rounded-card bg-surface p-8"
          >
            <ArchReveal delay={0.1} className="rounded-t-full">
              <Image
                src={info.photo}
                alt={info.photoAlt}
                fill
                sizes="30vw"
                placeholder="blur"
                className="object-cover"
              />
            </ArchReveal>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 id={`lantai-${floor}`} className="font-display text-3xl font-bold tracking-tight text-navy-700">
                  {info.label}
                </h3>
                <span className="rounded-full bg-accent-50 px-3 py-1 text-sm font-semibold text-accent-700">
                  {vacant} kosong dari {list.length} kamar
                </span>
              </div>
              <p className="mt-2 text-subtle">{info.summary}</p>
              <ul className="mt-2">
                {list.map((room, i) => (
                  <RoomRow key={room.number} room={room} index={i} last={i === list.length - 1} />
                ))}
              </ul>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
