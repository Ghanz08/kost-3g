import type { Metadata } from "next";
import { LocationPanel } from "@/components/location";
import { Reveal } from "@/components/motion";
import { ContactCta, PageIntro } from "@/components/page-intro";
import { PageTransition } from "@/components/page-transition";
import { Container } from "@/components/section-header";
import { campuses } from "@/data/content";
import { waLink, waMessages } from "@/lib/site";

export const metadata: Metadata = {
  title: "Lokasi kost putri di Brayan dan jarak ke kampus",
  description:
    "Kost 3g ada di Gg. Silaturahim No. 26 D, Pulo Brayan, Medan. 750 m ke POLTEK AMI, 1,7 km ke UMSU, dan 2,1 km ke Polimedia Medan.",
  alternates: { canonical: "/lokasi" },
};

export default function LokasiPage() {
  return (
    <PageTransition>
      <PageIntro
        title="Lokasi dan cara ke sana"
        description="Kost 3g ada di gang kecil di Pulo Brayan, Medan Barat. Dekat ke sekolah pelayaran dan beberapa kampus."
      />
      <Container className="flex flex-col gap-16 pb-20 md:pb-24">
        <LocationPanel showDetailLink={false} heading="h2" />

        <section aria-labelledby="judul-kampus" className="flex flex-col gap-6">
          <div>
            <h2 id="judul-kampus" className="text-h2 text-navy-700">
              Jarak ke kampus
            </h2>
            <p className="mt-2 text-subtle">Dihitung dengan rute Google Maps dari depan kost.</p>
          </div>
          <ul className="grid gap-4 md:grid-cols-3">
            {campuses.map((c, i) => (
              <Reveal as="li" key={c.name} delay={i * 0.12} className="flex flex-col gap-1 rounded-card bg-surface p-6">
                <p className="text-price text-brand-500">{c.distance}</p>
                <p className="font-semibold text-accent-700">{c.travel}</p>
                <hr className="my-3 border-line" />
                <p className="font-semibold text-navy-700">{c.name}</p>
                <p className="text-sm text-subtle">{c.detail}</p>
              </Reveal>
            ))}
          </ul>
        </section>

        <ContactCta
          title="Masih bingung jalannya?"
          text="Minta share lokasi lewat WhatsApp, nanti dikirimkan titik persisnya."
          href={waLink(waMessages.location)}
          label="Minta share lokasi"
        />
      </Container>
    </PageTransition>
  );
}
