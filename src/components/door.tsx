import { cn } from "@/lib/cn";

type DoorProps = {
  number?: number | string;
  /** Pintu terbuka = kamar kosong. Pintu tertutup = kamar terisi. */
  open?: boolean;
  /** `true` = pintu berayun terbuka sekali saat dimuat, `"scroll"` = berayun mengikuti scroll. */
  animate?: boolean | "scroll";
  className?: string;
};

/**
 * Pintu kamar, elemen khas Kost 3g yang diambil dari pintu oranye di logo.
 * Ukurannya mengikuti lebar elemen (pakai container query units),
 * jadi cukup atur lebarnya lewat `className`.
 */
export function Door({ number, open = false, animate = false, className }: DoorProps) {
  return (
    <span aria-hidden className={cn("@container relative block aspect-[2/3]", className)}>
      {open ? (
        <>
          <span className="absolute inset-0 rounded-t-full bg-accent-500" />
          <span className="absolute inset-x-[7cqw] top-[7cqw] bottom-0 rounded-t-full bg-accent-50" />
          {number !== undefined && (
            <span className="absolute inset-x-0 top-[22%] pl-[30cqw] text-center font-display text-[30cqw] leading-none font-extrabold text-navy-700">
              {number}
            </span>
          )}
          <svg
            viewBox="0 0 20 10"
            className="absolute top-[56%] left-[calc(50%+15cqw)] w-[22cqw] -translate-x-1/2"
          >
            <path
              d="M2 2 Q10 11 18 2"
              fill="none"
              className="stroke-navy-700"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          </svg>
          <span
            className={cn(
              "absolute inset-0 origin-left rounded-t-full bg-accent-500 shadow-[inset_-2px_0_0_rgb(0_0_0/0.08)]",
              animate === "scroll"
                ? "animate-door-scroll"
                : animate
                  ? "animate-door-open"
                  : "[transform:perspective(500px)_rotateY(-68deg)]",
            )}
          />
        </>
      ) : (
        <>
          <span className="absolute inset-0 rounded-t-full bg-brand-500" />
          {number !== undefined && (
            <span className="absolute inset-x-0 top-[17%] text-center font-display text-[40cqw] leading-none font-extrabold text-brand-200">
              {number}
            </span>
          )}
          <span className="absolute top-[70%] right-[16%] size-[9cqw] rounded-full bg-brand-200" />
        </>
      )}
    </span>
  );
}
