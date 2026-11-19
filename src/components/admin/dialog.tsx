"use client";

import { X } from "lucide-react";
import { createContext, type ReactNode, useContext, useEffect, useId, useRef } from "react";
import { cn } from "@/lib/cn";
import { buttonClass, type ButtonVariant } from "./button-class";

/** Menutup dialog terdekat; dipakai ActionForm setelah berhasil menyimpan. */
const DialogClose = createContext<(() => void) | null>(null);
export const useDialogClose = () => useContext(DialogClose);

/**
 * Dialog/laci berbasis <dialog> native: fokus terkunci di dalam, Esc menutup, fokus kembali ke tombol pemicu.
 * `side` = panel menempel kanan (untuk form panjang), selain itu dialog di tengah.
 */
export function Dialog({
  trigger,
  title,
  description,
  children,
  side = false,
  variant = "primary",
  icon,
  triggerClassName,
  defaultOpen = false,
}: {
  trigger: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  side?: boolean;
  variant?: ButtonVariant;
  icon?: ReactNode;
  triggerClassName?: string;
  /** Langsung terbuka saat halaman dimuat (mis. datang dari tombol "Mulai sewa" di halaman penghuni). */
  defaultOpen?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();
  const close = () => ref.current?.close();
  useEffect(() => {
    if (defaultOpen) ref.current?.showModal();
  }, [defaultOpen]);

  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className={cn(buttonClass(variant), triggerClassName)}>
        {icon}
        {trigger}
      </button>
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        // Klik di luar panel menutup dialog.
        onClick={(e) => e.target === ref.current && close()}
        className={cn(
          "m-0 max-h-dvh max-w-none bg-transparent p-0 backdrop:bg-navy-900/40 backdrop:backdrop-blur-[2px] open:flex",
          side ? "ml-auto h-dvh w-full sm:w-[30rem]" : "inset-0 m-auto w-[min(100%-2rem,32rem)] items-center",
        )}
      >
        <div
          className={cn(
            "flex w-full flex-col bg-surface shadow-raised",
            side ? "h-full" : "max-h-[calc(100dvh-2rem)] rounded-2xl",
          )}
        >
          <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
            <div>
              <h2 id={titleId} className="font-display text-xl font-bold text-navy-700">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-1 text-sm text-subtle">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Tutup"
              className="-mr-2 grid size-10 shrink-0 place-items-center rounded-lg text-subtle hover:bg-paper hover:text-navy-700"
            >
              <X aria-hidden className="size-5" />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <DialogClose.Provider value={close}>{children}</DialogClose.Provider>
          </div>
        </div>
      </dialog>
    </>
  );
}
