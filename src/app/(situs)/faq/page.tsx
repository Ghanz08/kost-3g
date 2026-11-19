import type { Metadata } from "next";
import { FaqList } from "@/components/faq-list";
import { Reveal } from "@/components/motion";
import { ContactCta, PageIntro } from "@/components/page-intro";
import { PageTransition } from "@/components/page-transition";
import { Container } from "@/components/section-header";
import { getContent } from "@/lib/site-data";
import { waLink, waMessages } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pertanyaan yang sering muncul soal kost putri di Brayan",
  description: "Jawaban soal deposit, harga, listrik dan air, fasilitas, aturan tamu, dan cara survey Kost 3g.",
  alternates: { canonical: "/faq" },
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export default async function FaqPage() {
  const faqCategories = await getContent("faq");
  return (
    <PageTransition>
      <PageIntro
        title="Pertanyaan yang sering muncul"
        description="Dikumpulkan dari chat calon penghuni. Kalau pertanyaanmu belum ada, tanya langsung lewat WhatsApp."
      />
      <Container className="grid gap-10 pb-20 md:pb-24 lg:grid-cols-[16.25rem_1fr] lg:gap-16">
        <nav aria-label="Topik" className="lg:sticky lg:top-24 lg:self-start">
          <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1 lg:rounded-card lg:bg-surface lg:p-5">
            {faqCategories.map((c) => (
              <li key={c.title}>
                <a
                  href={`#${slug(c.title)}`}
                  className="flex items-center gap-3 rounded-full bg-surface px-4 py-2 text-sm font-semibold text-navy-700 lg:bg-transparent lg:px-0"
                >
                  <span aria-hidden className="hidden h-3.5 w-2.5 rounded-t-full bg-accent-500 lg:block" />
                  {c.title} ({c.items.length})
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-col gap-12">
          {faqCategories.map((c, i) => (
            <Reveal
              as="section"
              immediate={i === 0}
              key={c.title}
              id={slug(c.title)}
              aria-labelledby={`judul-${slug(c.title)}`}
              className="flex flex-col gap-4"
            >
              <h2 id={`judul-${slug(c.title)}`} className="text-h3 text-navy-700">
                {c.title}
              </h2>
              <FaqList items={c.items} />
            </Reveal>
          ))}
          <ContactCta
            title="Belum ketemu jawabannya?"
            text="Tanya langsung lewat WhatsApp, sebutkan nomor kamar yang kamu incar."
            href={waLink(waMessages.general)}
            label="Chat via WhatsApp"
          />
        </div>
      </Container>
    </PageTransition>
  );
}
