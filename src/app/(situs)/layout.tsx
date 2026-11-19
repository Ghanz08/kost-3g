import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Analytics } from "@/components/analytics";
import { StickyWa } from "@/components/sticky-wa";
import { waLink, waMessages } from "@/lib/site";

/** Situs publik statis: data kamar & konten di-cache dan diperbarui saat admin menyimpan. */
export const ensureStatic = "navigation";

export default function SitusLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2 focus:font-semibold"
      >
        Lewati ke konten
      </a>
      <SiteHeader />
      <main id="konten" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <StickyWa href={waLink(waMessages.general)} />
      <Analytics />
    </>
  );
}
