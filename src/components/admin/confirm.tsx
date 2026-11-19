"use client";

import { type ReactNode, useId, useRef } from "react";
import type { ActionResult } from "@/lib/admin";
import { cn } from "@/lib/cn";
import { ActionForm, Submit } from "./action-form";
import { buttonClass, type ButtonVariant } from "./button-class";

type Action = (prev: ActionResult, fd: FormData) => Promise<ActionResult>;

/**
 * Tombol untuk aksi yang sulit dibatalkan. Membuka alertdialog dengan penjelasan akibatnya,
 * fokus awal di "Batal" supaya Enter tidak langsung menghapus.
 */
export function ConfirmAction({
  action,
  fields,
  label,
  title,
  message,
  confirmLabel,
  variant = "danger",
  icon,
  compact = false,
}: {
  action: Action;
  /** Nilai tersembunyi yang dikirim ke action, mis. { id }. */
  fields: Record<string, string>;
  label: ReactNode;
  title: string;
  message: string;
  confirmLabel: string;
  variant?: ButtonVariant;
  icon?: ReactNode;
  compact?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const msgId = useId();
  const close = () => ref.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className={cn(compact ? buttonClass("ghost", "sm") : buttonClass(variant), compact && variant === "danger" && "text-red-700 hover:bg-red-50")}
      >
        {icon}
        {label}
      </button>
      <dialog
        ref={ref}
        role="alertdialog"
        aria-labelledby={titleId}
        aria-describedby={msgId}
        onClick={(e) => e.target === ref.current && close()}
        className="m-auto w-[min(100%-2rem,26rem)] rounded-2xl bg-surface p-0 shadow-raised backdrop:bg-navy-900/40"
      >
        <div className="p-6">
          <h2 id={titleId} className="font-display text-lg font-bold text-navy-700">
            {title}
          </h2>
          <p id={msgId} className="mt-2 text-sm text-subtle">
            {message}
          </p>
          <ActionForm action={async (p, fd) => { const r = await action(p, fd); if (r?.ok) close(); return r; }}>
            {Object.entries(fields).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {/* autoFocus: fokus pertama di tombol aman */}
              <button type="button" autoFocus onClick={close} className={buttonClass("secondary")}>
                Batal
              </button>
              <Submit
                variant={variant === "danger" ? "danger" : "primary"}
                className={variant === "danger" ? "bg-red-700 text-white ring-0 hover:bg-red-800" : undefined}
                pendingText="Memproses…"
              >
                {confirmLabel}
              </Submit>
            </div>
          </ActionForm>
        </div>
      </dialog>
    </>
  );
}
