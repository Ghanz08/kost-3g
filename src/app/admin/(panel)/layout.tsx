import Link from "next/link";
import { Suspense } from "react";
import { ToastProvider } from "@/components/admin/toast";
import { Logo } from "@/components/logo";
import { requireAdmin } from "@/lib/admin";
import { AccountBlock, MobileNav, SideNav, SideNavFallback } from "./nav";

/**
 * Kerangka admin: menu samping di layar lebar, bilah atas + laci di HP.
 * Isi halaman menunggu pemeriksaan admin di dalam <Suspense> dengan kerangka abu sebagai placeholder.
 */
export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <ToastProvider>
      <a
        href="#isi"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-xl focus:bg-surface focus:px-4 focus:py-2 focus:font-semibold focus:text-navy-700"
      >
        Lewati ke isi halaman
      </a>
      <div className="lg:grid lg:grid-cols-[16rem_1fr]">
        <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface lg:flex">
          <Link href="/admin" aria-label="Dasbor admin Kost 3g" className="mx-4 mt-5 mb-6 self-start rounded-lg">
            <Logo className="h-9" />
          </Link>
          <nav aria-label="Menu admin" className="flex-1 overflow-y-auto px-3">
            <Suspense fallback={<SideNavFallback />}>
              <SideNav />
            </Suspense>
          </nav>
          <div className="border-t border-line p-3">
            <Suspense>
              <Account />
            </Suspense>
          </div>
        </aside>
        <Suspense fallback={<div className="h-16 border-b border-line bg-surface lg:hidden" />}>
          <MobileNavWithAccount />
        </Suspense>
        <main id="isi" tabIndex={-1} className="min-w-0 px-4 py-6 outline-none sm:px-6 md:py-8 lg:px-10">
          <div className="mx-auto max-w-[80rem]">
            <Suspense fallback={<PageSkeleton />}>
              <Guard>{children}</Guard>
            </Suspense>
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}

async function Guard({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}

async function Account() {
  const { email } = await requireAdmin();
  return <AccountBlock email={email} />;
}

async function MobileNavWithAccount() {
  const { email } = await requireAdmin();
  return <MobileNav account={<AccountBlock email={email} />} />;
}

/** Kerangka abu selama data dimuat, supaya tata letak tidak melompat. */
function PageSkeleton() {
  const bar = "animate-pulse rounded-xl bg-filled";
  return (
    <div aria-busy="true" aria-label="Memuat halaman">
      <div className={`${bar} h-8 w-48`} />
      <div className={`${bar} mt-3 h-4 w-80 max-w-full`} />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${bar} h-24`} />
        ))}
      </div>
      <div className={`${bar} mt-4 h-64`} />
    </div>
  );
}
