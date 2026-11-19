import type { Faq } from "@/data/content";
import { PlusIcon } from "@/components/icons";

/** Akordeon FAQ memakai <details>, jadi tetap berfungsi tanpa JavaScript. */
export function FaqList({ items, openFirst = false }: { items: Faq[]; openFirst?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <details
          key={item.q}
          open={openFirst && i === 0}
          className="group rounded-2xl bg-surface ring-1 ring-line open:ring-2 open:ring-brand-500"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-navy-700 [&::-webkit-details-marker]:hidden">
            {item.q}
            <PlusIcon className="size-5 shrink-0 text-brand-500 transition-transform group-open:rotate-45" />
          </summary>
          <p className="-mt-1 px-5 pb-5 leading-relaxed text-subtle">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
