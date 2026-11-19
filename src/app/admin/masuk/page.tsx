import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { LoginPanel } from "./login-panel";

export const metadata: Metadata = { title: "Masuk" };

export default function MasukPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-sm rounded-card bg-surface p-8 shadow-card">
        <Logo className="h-9" />
        <h1 className="mt-6 font-display text-2xl font-bold text-navy-700">Masuk ke admin</h1>
        <p className="mt-1 text-sm text-subtle">Hanya akun Google yang sudah didaftarkan pemilik.</p>
        <Suspense>
          <LoginPanel />
        </Suspense>
      </div>
    </main>
  );
}
