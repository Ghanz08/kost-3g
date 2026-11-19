import { Door } from "@/components/door";
import { cn } from "@/lib/cn";

export function DoorLegend({ long = false, className }: { long?: boolean; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-navy-700", className)}>
      <li className="flex items-center gap-2">
        <Door open className="w-[1.125rem]" />
        {long ? "Pintu terbuka: kamar kosong" : "Kosong"}
      </li>
      <li className="flex items-center gap-2">
        <Door className="w-[1.125rem]" />
        {long ? "Pintu tertutup: sudah terisi" : "Terisi"}
      </li>
    </ul>
  );
}
