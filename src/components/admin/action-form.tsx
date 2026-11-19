"use client";

import { AlertCircle } from "lucide-react";
import { createContext, type ReactNode, useActionState, useContext, useEffect, useRef, useTransition } from "react";
import type { ActionResult } from "@/lib/admin";
import { cn } from "@/lib/cn";
import { buttonClass, type ButtonVariant } from "./button-class";
import { useDialogClose } from "./dialog";
import { useToast } from "./toast";

type Action = (prev: ActionResult, fd: FormData) => Promise<ActionResult>;

const Pending = createContext(false);

/**
 * Form untuk server action admin.
 * - Isian TIDAK dikosongkan saat gagal (React 19 mengosongkan form ber-`action` setiap selesai, termasuk saat error),
 *   karena dikirim lewat onSubmit + transition. Dikosongkan hanya bila berhasil dan `resetOnSuccess`.
 * - Gagal: pesan error muncul di atas tombol dan menerima fokus (WCAG 3.3.1).
 * - Berhasil: notifikasi toast, dan dialog yang membungkus form ini ditutup.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, run] = useActionState(action, undefined);
  const [pending, start] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const toast = useToast();
  const closeDialog = useDialogClose();

  useEffect(() => {
    if (state?.error) errorRef.current?.focus();
    if (state?.ok) {
      toast(state.ok);
      if (resetOnSuccess) form.current?.reset();
      closeDialog?.();
    }
  }, [state, resetOnSuccess, toast, closeDialog]);

  return (
    <form
      ref={form}
      aria-busy={pending}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(() => run(fd));
      }}
    >
      <Pending.Provider value={pending}>
        <fieldset disabled={pending} className="contents">
          {children}
        </fieldset>
      </Pending.Provider>
      {state?.error && (
        <p
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-800 outline-none"
        >
          <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
          {state.error}
        </p>
      )}
    </form>
  );
}

/** Tombol kirim; menunjukkan status menyimpan dari form induknya. */
export function Submit({
  children,
  variant = "primary",
  className,
  pendingText = "Menyimpan…",
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  pendingText?: string;
}) {
  const pending = useContext(Pending);
  return (
    <button type="submit" className={cn(buttonClass(variant), className)}>
      {pending ? pendingText : children}
    </button>
  );
}

/** Baris tombol di bagian bawah form (kanan di layar lebar, penuh di HP). */
export function FormActions({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{children}</div>;
}
