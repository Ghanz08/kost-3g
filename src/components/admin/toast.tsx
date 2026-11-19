"use client";

import { CheckCircle2, X } from "lucide-react";
import { createContext, type ReactNode, useCallback, useContext, useState } from "react";

type Toast = { id: number; text: string };
const ToastContext = createContext<(text: string) => void>(() => {});

/** Notifikasi singkat setelah berhasil menyimpan. Wilayah aria-live supaya dibacakan pembaca layar (WCAG 4.1.3). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));
  const show = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, text }]);
    setTimeout(() => dismiss(id), 5000);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl bg-navy-900 py-3 pr-2 pl-4 text-sm text-white shadow-raised"
          >
            <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-200" />
            <p className="flex-1">{t.text}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Tutup notifikasi"
              className="grid size-8 shrink-0 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
