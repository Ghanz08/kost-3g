"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

const messages: Record<string, string> = {
  "tidak-terdaftar": "Akun Google ini tidak terdaftar sebagai admin. Minta pemilik menambahkan email kamu di menu Akses.",
  "gagal-masuk": "Login gagal atau dibatalkan. Coba lagi.",
};

export function LoginPanel() {
  const error = useSearchParams().get("galat");
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/admin/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) setBusy(false);
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {error && (
        <div role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {messages[error] ?? "Terjadi kesalahan."}
          {error === "tidak-terdaftar" && (
            <form action="/admin/auth/keluar" method="post" className="mt-2">
              <button className="font-semibold underline">Keluar dari akun ini</button>
            </form>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={signIn}
        disabled={busy}
        className="flex min-h-12 items-center justify-center gap-3 rounded-full bg-surface font-semibold text-navy-700 ring-1 ring-line transition-colors hover:bg-paper disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
          <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z" />
          <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" />
          <path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.7-2.8z" />
          <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z" />
        </svg>
        {busy ? "Mengalihkan ke Google…" : "Masuk dengan Google"}
      </button>
    </div>
  );
}
