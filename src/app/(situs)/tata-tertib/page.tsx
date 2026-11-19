import type { Metadata } from "next";
import { Door } from "@/components/door";
import { Reveal } from "@/components/motion";
import { ContactCta, PageIntro } from "@/components/page-intro";
import { PageTransition } from "@/components/page-transition";
import { Container } from "@/components/section-header";
import { getContent } from "@/lib/site-data";
import { waLink, waMessages } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tata tertib kost putri di Brayan, Medan",
  description:
    "Aturan rumah Kost 3g: jam tenang 22.00 sampai 06.00, ketentuan tamu, dapur halal, kebersihan, air, dan listrik.",
  alternates: { canonical: "/tata-tertib" },
};

const quick = ["Jam tenang 22.00 sampai 06.00", "Lawan jenis hanya di ruang tamu atau teras", "Dapur khusus makanan halal"];

export default async function TataTertibPage() {
  const rules = await getContent("rules");
  return (
    <PageTransition>
      <PageIntro
        title="Tata tertib rumah"
        description="Demi keamanan, kebersihan, dan kenyamanan bersama, seluruh penghuni wajib menaati aturan berikut. Baca dulu sebelum memutuskan, supaya tidak ada yang mengejutkan."
        aside={
          <div className="rounded-card bg-accent-50 p-6 lg:w-100 lg:shrink-0">
            <h2 className="font-semibold text-navy-700">Tiga hal yang paling sering ditanyakan</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {quick.map((q) => (
                <li key={q} className="flex items-center gap-3">
                  <span aria-hidden className="h-3.5 w-2.5 shrink-0 rounded-t-full bg-accent-500" />
                  {q}
                </li>
              ))}
            </ul>
          </div>
        }
      />
      <Container className="flex flex-col gap-4 pb-20 md:pb-24">
        <div className="grid gap-4 md:grid-cols-2">
          {rules.map((group, i) => (
            <Reveal
              as="section"
              immediate={i < 2}
              key={group.title}
              delay={(i % 2) * 0.12}
              aria-labelledby={`aturan-${i}`}
              className="group rounded-card bg-surface p-6 transition-shadow duration-300 hover:shadow-raised md:p-8"
            >
              <div className="flex items-end gap-3">
                <Door number={i + 1} className="w-9 shrink-0 origin-bottom transition-transform duration-300 group-hover:-rotate-6" />
                <h2 id={`aturan-${i}`} className="text-h3 text-navy-700">
                  {group.title}
                </h2>
              </div>
              <dl className="mt-5 flex flex-col gap-4">
                {group.items.map((item) => (
                  <div key={item.label}>
                    <dt className="text-sm font-semibold text-brand-500">{item.label}</dt>
                    <dd className="mt-0.5 leading-relaxed">{item.text}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          ))}
        </div>
        <ContactCta
          title="Ada aturan yang ingin ditanyakan?"
          text="Aturan ini dibuat demi kenyamanan bersama. Tanyakan saja kalau ada yang kurang jelas."
          href={waLink(waMessages.general)}
          label="Chat via WhatsApp"
        />
      </Container>
    </PageTransition>
  );
}
