import Link from "next/link";
import { fullAddress, nav, site, waLink, waMessages } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="bg-navy-900 text-white">
      <div className="mx-auto grid w-full max-w-[80rem] gap-10 px-6 py-14 md:grid-cols-[1.2fr_1fr_1fr_1fr] md:px-10">
        <div>
          <p className="font-display text-2xl font-semibold">Kost 3g</p>
          <p className="mt-2 text-white/80">{site.tagline}. Nyaman dan terjangkau, tanpa deposit.</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-accent-500">Alamat</h2>
          <p className="mt-2 text-white/85">{fullAddress}</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-accent-500">WhatsApp</h2>
          <ul className="mt-2 flex flex-col gap-1">
            {site.phones.map((p) => (
              <li key={p.e164}>
                <a href={waLink(waMessages.general, p.e164)} target="_blank" rel="noopener noreferrer" className="text-white/85 underline-offset-4 hover:underline">
                  {p.display}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-accent-500">Halaman</h2>
          <ul className="mt-2 flex flex-col gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-white/85 underline-offset-4 hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[80rem] px-6 pb-28 text-sm text-white/60 md:px-10 md:pb-10">
        © 2026 Kost 3g
      </div>
    </footer>
  );
}
