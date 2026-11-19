"use client";

import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useId, useState } from "react";
import { ActionForm, FormActions, Submit } from "@/components/admin/action-form";
import { buttonClass } from "@/components/admin/button-class";
import { ConfirmAction } from "@/components/admin/confirm";
import { builtinPhotos } from "@/data/content";
import { cn } from "@/lib/cn";
import { type ContentDef, type FieldDef, emptyItem } from "@/lib/content-schema";
import { resetContent, saveContent, uploadGalleryPhoto } from "./actions";

type Row = Record<string, unknown>;

const control =
  "w-full rounded-xl border border-field bg-surface px-3 py-2 text-base text-ink hover:border-navy-700 focus-visible:border-navy-700";
const iconBtn = "grid size-10 place-items-center rounded-xl text-navy-700 hover:bg-paper disabled:opacity-30 disabled:hover:bg-transparent";

function move<T>(list: T[], from: number, to: number) {
  const next = list.slice();
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
}

/** Tombol naik/turun/hapus. Label menyebut nomor baris supaya jelas bagi pembaca layar. */
function RowTools({ name, index, count, onMove, onRemove }: { name: string; index: number; count: number; onMove: (to: number) => void; onRemove: () => void }) {
  const n = `${name} ${index + 1}`;
  return (
    <div className="flex shrink-0">
      <button type="button" className={iconBtn} disabled={index === 0} onClick={() => onMove(index - 1)} aria-label={`Naikkan ${n}`}>
        <ArrowUp aria-hidden className="size-4" />
      </button>
      <button type="button" className={iconBtn} disabled={index === count - 1} onClick={() => onMove(index + 1)} aria-label={`Turunkan ${n}`}>
        <ArrowDown aria-hidden className="size-4" />
      </button>
      <button type="button" className={cn(iconBtn, "text-red-700 hover:bg-red-50")} onClick={onRemove} aria-label={`Hapus ${n}`}>
        <Trash2 aria-hidden className="size-4" />
      </button>
    </div>
  );
}

function ImageField({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();
  const builtin = builtinPhotos[value];
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-24 w-18 shrink-0 overflow-hidden rounded-t-full bg-filled">
        {value && <Image src={builtin ?? value} alt="" fill sizes="72px" unoptimized={!builtin} className="object-cover" />}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className={cn(buttonClass("secondary"), "cursor-pointer focus-within:outline-3")}>
          <ImagePlus aria-hidden className="size-4" />
          {busy ? "Mengunggah…" : value ? "Ganti foto" : "Pilih foto"}
        </label>
        <input
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={busy}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            setErr(undefined);
            const fd = new FormData();
            fd.set("photo", f);
            const res = await uploadGalleryPhoto(fd);
            setBusy(false);
            if (res.url) onChange(res.url);
            else setErr(res.error);
          }}
        />
        <span className="text-sm text-subtle">JPG, PNG, atau WebP, maks 10 MB.</span>
        {err && (
          <span role="alert" className="text-sm text-red-700">
            {err}
          </span>
        )}
      </div>
    </div>
  );
}

function FieldInput({ f, value, onChange }: { f: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const id = useId();
  if (f.type === "checkbox") {
    return (
      <div className="flex items-center gap-3">
        <input id={id} type="checkbox" className="size-5 accent-brand-500" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
        <label htmlFor={id} className="text-sm text-ink">
          {f.label}
        </label>
      </div>
    );
  }
  if (f.type === "list") {
    return (
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold text-navy-700">{f.label}</legend>
        <ListEditor fields={f.fields} item={f.item} rows={(value as Row[]) ?? []} onChange={onChange} nested />
      </fieldset>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-navy-700">
        {f.label}
      </label>
      {f.type === "textarea" ? (
        <textarea id={id} className={control} rows={2} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
      ) : f.type === "select" ? (
        <select id={id} className={cn(control, "min-h-11")} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          {f.options.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      ) : f.type === "image" ? (
        <ImageField id={id} value={String(value ?? "")} onChange={onChange} />
      ) : (
        <input id={id} className={cn(control, "min-h-11")} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function ListEditor({ fields, item, rows, onChange, nested }: { fields: FieldDef[]; item: string; rows: Row[]; onChange: (rows: Row[]) => void; nested?: boolean }) {
  const set = (i: number, key: string, v: unknown) => onChange(rows.map((r, j) => (j === i ? { ...r, [key]: v } : r)));
  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-3">
        {rows.map((row, i) => (
          <li key={i} className={nested ? "rounded-xl bg-paper p-4" : "rounded-2xl border border-line p-4 md:p-5"}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-subtle capitalize">
                {item} {i + 1}
              </span>
              <RowTools name={item} index={i} count={rows.length} onMove={(to) => onChange(move(rows, i, to))} onRemove={() => onChange(rows.filter((_, j) => j !== i))} />
            </div>
            <div className="flex flex-col gap-4">
              {fields.map((f) => (
                <FieldInput key={f.key} f={f} value={row[f.key]} onChange={(v) => set(i, f.key, v)} />
              ))}
            </div>
          </li>
        ))}
      </ol>
      <button type="button" onClick={() => onChange([...rows, emptyItem(fields)])} className={cn(buttonClass("ghost"), "self-start")}>
        <Plus aria-hidden className="size-4" />
        Tambah {item}
      </button>
    </div>
  );
}

function StringsEditor({ item, rows, onChange }: { item: string; rows: string[]; onChange: (rows: string[]) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-2">
        {rows.map((v, i) => (
          <li key={i} className="flex items-center gap-2">
            <span aria-hidden className="w-6 shrink-0 text-right text-sm text-subtle tabular-nums">
              {i + 1}.
            </span>
            <input className={cn(control, "min-h-11")} value={v} aria-label={`${item} ${i + 1}`} onChange={(e) => onChange(rows.map((r, j) => (j === i ? e.target.value : r)))} />
            <RowTools name={item} index={i} count={rows.length} onMove={(to) => onChange(move(rows, i, to))} onRemove={() => onChange(rows.filter((_, j) => j !== i))} />
          </li>
        ))}
      </ol>
      <button type="button" onClick={() => onChange([...rows, ""])} className={cn(buttonClass("ghost"), "self-start")}>
        <Plus aria-hidden className="size-4" />
        Tambah {item}
      </button>
    </div>
  );
}

/** Editor satu konten. Isi dikirim sebagai JSON; server memvalidasinya dengan skema yang sama. */
export function ContentEditor({ def, initial, custom }: { def: ContentDef; initial: unknown; custom: boolean }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="flex flex-col gap-4">
      <ActionForm action={saveContent}>
        <input type="hidden" name="key" value={def.key} />
        <input type="hidden" name="value" value={JSON.stringify(value)} />
        {"strings" in def ? (
          <StringsEditor item={def.item} rows={value as string[]} onChange={setValue} />
        ) : (
          <ListEditor fields={def.fields} item={def.item} rows={value as Row[]} onChange={setValue} />
        )}
        <FormActions>
          <Submit>Simpan & terbitkan</Submit>
        </FormActions>
      </ActionForm>
      {custom && (
        <div className="border-t border-line pt-4">
          <ConfirmAction
            action={resetContent}
            fields={{ key: def.key }}
            label="Kembalikan ke isi bawaan"
            title={`Kembalikan ${def.title.toLowerCase()} ke isi bawaan?`}
            message="Semua perubahan yang tersimpan untuk bagian ini akan hilang dan situs memakai isi bawaan lagi."
            confirmLabel="Ya, kembalikan"
            compact
          />
        </div>
      )}
    </div>
  );
}
