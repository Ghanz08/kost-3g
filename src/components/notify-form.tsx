"use client";

import { AnimatePresence, motion } from "motion/react";
import { useActionState, useEffect, useId, useRef, useTransition } from "react";
import { requestNotify } from "@/app/(situs)/actions";
import { Door } from "@/components/door";
import { ease } from "@/lib/ease";

const field =
  "min-h-12 w-full rounded-xl border border-white/70 bg-white/10 px-4 text-base text-white placeholder:text-white/90 hover:border-white focus-visible:border-white";

/**
 * "Belum siap pindah sekarang?" Pengunjung meninggalkan nama + WA, masuk ke Calon penyewa di admin.
 * Setelah terkirim, pintu kecil berayun terbuka — tanda permintaannya sudah "masuk".
 */
export function NotifyForm() {
  const [state, run] = useActionState(requestNotify, undefined);
  const [pending, start] = useTransition();
  const shownAt = useRef(0);
  const id = useId();
  useEffect(() => {
    shownAt.current = Date.now();
  }, []);
  useEffect(() => {
    if (state?.ok) window.umami?.track("kabari-terkirim");
  }, [state]);

  return (
    <div className="w-full max-w-md text-left">
      <AnimatePresence mode="wait" initial={false}>
        {state?.ok ? (
          <motion.div
            key="ok"
            role="status"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 text-white"
          >
            <Door open animate className="w-9 shrink-0" />
            <p>
              <b>Tercatat.</b> Kami kabari lewat WhatsApp begitu ada kamar kosong.
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            exit={{ opacity: 0, y: -8 }}
            aria-labelledby={`${id}-title`}
            aria-busy={pending}
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              fd.set("t", String(shownAt.current));
              start(() => run(fd));
            }}
            className="flex flex-col gap-3"
          >
            <p id={`${id}-title`} className="font-semibold text-white">
              Belum siap pindah sekarang? Kami kabari kalau ada kamar kosong.
            </p>
            {/* Jebakan bot: tidak terlihat dan tidak bisa difokus pengguna. */}
            <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
              <label>
                Situs web <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label htmlFor={`${id}-name`} className="text-sm text-white">
                  Nama
                </label>
                <input id={`${id}-name`} name="name" required autoComplete="given-name" className={field} />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor={`${id}-phone`} className="text-sm text-white">
                  No. WhatsApp
                </label>
                <input id={`${id}-phone`} name="phone" type="tel" inputMode="tel" required autoComplete="tel" placeholder="08…" className={field} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor={`${id}-interest`} className="text-sm text-white">
                Rencana pindah <span className="text-white/80">(opsional)</span>
              </label>
              <input id={`${id}-interest`} name="interest" placeholder="Mis. awal semester, lantai atas" className={field} />
            </div>
            {state?.error && (
              <p role="alert" className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-red-800">
                {state.error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="min-h-12 rounded-full bg-accent-500 px-6 font-semibold text-navy-900 transition-colors hover:bg-accent-50 disabled:opacity-70"
            >
              {pending ? "Mengirim…" : "Kabari saya"}
            </button>
            <p className="text-xs text-white/80">Nomormu hanya dipakai untuk kabar kamar kosong, tidak dibagikan.</p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
