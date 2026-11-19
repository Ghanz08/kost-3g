"use client";

import { type ComponentProps, useId } from "react";
import { cn } from "@/lib/cn";

/*
 * Kolom isian admin. Label terhubung lewat htmlFor/id, petunjuk lewat aria-describedby (WCAG 1.3.1, 3.3.2),
 * tanda "wajib" berupa teks (bukan hanya warna), garis tepi 3,9:1 (WCAG 1.4.11), tinggi 44px.
 */

const control =
  "w-full rounded-xl border border-field bg-surface px-3 text-base text-ink placeholder:text-subtle/80 transition-colors hover:border-navy-700 focus-visible:border-navy-700 disabled:bg-filled disabled:text-subtle";

function Label({ id, label, required }: { id: string; label: string; required?: boolean }) {
  return (
    <label htmlFor={id} className="text-sm font-semibold text-navy-700">
      {label}
      {required && <span className="ml-1 font-normal text-subtle">(wajib)</span>}
    </label>
  );
}

function Hint({ id, hint }: { id: string; hint?: string }) {
  return hint ? (
    <p id={id} className="text-sm text-subtle">
      {hint}
    </p>
  ) : null;
}

type Base = { label: string; hint?: string; className?: string };

export function Field({ label, hint, className, prefix, ...p }: ComponentProps<"input"> & Base & { prefix?: string }) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label id={id} label={label} required={p.required} />
      <div className="relative">
        {prefix && (
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-subtle">
            {prefix}
          </span>
        )}
        <input
          id={id}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={cn(control, "min-h-11 py-2", prefix && "pl-10", p.type === "file" && "py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:font-semibold file:text-brand-700")}
          {...p}
        />
      </div>
      <Hint id={`${id}-hint`} hint={hint} />
    </div>
  );
}

/** Isian uang: keyboard angka di HP dan awalan "Rp". */
export function MoneyField(p: Omit<ComponentProps<"input">, "type"> & Base) {
  return <Field inputMode="numeric" prefix="Rp" autoComplete="off" {...p} />;
}

export function TextArea({ label, hint, className, ...p }: ComponentProps<"textarea"> & Base) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label id={id} label={label} required={p.required} />
      <textarea id={id} rows={3} aria-describedby={hint ? `${id}-hint` : undefined} className={cn(control, "py-2.5")} {...p} />
      <Hint id={`${id}-hint`} hint={hint} />
    </div>
  );
}

export function Select({
  label,
  hint,
  options,
  className,
  ...p
}: ComponentProps<"select"> & Base & { options: readonly (string | readonly [value: string, label: string])[] }) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label id={id} label={label} required={p.required} />
      <select id={id} aria-describedby={hint ? `${id}-hint` : undefined} className={cn(control, "min-h-11 py-2")} {...p}>
        {options.map((o) => {
          const [v, l] = typeof o === "string" ? [o, o] : o;
          return (
            <option key={v} value={v}>
              {l}
            </option>
          );
        })}
      </select>
      <Hint id={`${id}-hint`} hint={hint} />
    </div>
  );
}

/** Kotak centang dengan area klik selebar labelnya (WCAG 2.5.8). */
export function Check({ label, hint, className, ...p }: Omit<ComponentProps<"input">, "type"> & Base) {
  const id = useId();
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <input id={id} type="checkbox" aria-describedby={hint ? `${id}-hint` : undefined} className="mt-0.5 size-5 shrink-0 accent-brand-500" {...p} />
      <div>
        <label htmlFor={id} className="text-sm text-ink">
          {label}
        </label>
        <Hint id={`${id}-hint`} hint={hint} />
      </div>
    </div>
  );
}

/** Kelompok isian dengan judul (fieldset/legend), mis. checklist check-in. */
export function FieldGroup({ legend, children, className }: { legend: string; children: React.ReactNode; className?: string }) {
  return (
    <fieldset className={cn("flex flex-col gap-3 rounded-xl border border-line p-4", className)}>
      <legend className="px-1 text-sm font-semibold text-navy-700">{legend}</legend>
      {children}
    </fieldset>
  );
}
