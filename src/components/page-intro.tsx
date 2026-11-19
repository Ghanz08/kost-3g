import type { ReactNode } from "react";
import { ButtonLink } from "@/components/button";
import { ArrowLeftIcon } from "@/components/icons";
import { Reveal, WordsRise } from "@/components/motion";
import { Container } from "@/components/section-header";

/** Kepala halaman untuk sub-halaman (Tata Tertib, Lokasi, FAQ). */
export function PageIntro({ title, description, aside }: { title: string; description: string; aside?: ReactNode }) {
  return (
    <Container className="flex flex-col gap-8 pt-8 pb-10 md:pt-14 md:pb-14 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <ButtonLink href="/" variant="ghost" icon={<ArrowLeftIcon />} className="-ml-5 mb-4">
          Kembali ke beranda
        </ButtonLink>
        <h1 className="text-display text-navy-700">
          <WordsRise text={title} delay={0.15} />
        </h1>
        <Reveal as="p" immediate delay={0.45} y={16} className="mt-4 max-w-2xl text-lg leading-relaxed text-subtle">
          {description}
        </Reveal>
      </div>
      {aside && <Reveal immediate delay={0.6}>{aside}</Reveal>}
    </Container>
  );
}

export function ContactCta({ title, text, href, label }: { title: string; text: string; href: string; label: string }) {
  return (
    <Reveal className="flex flex-col gap-5 rounded-card bg-brand-500 p-6 text-white md:flex-row md:items-center md:justify-between md:p-8">
      <div>
        <h2 className="text-h3">{title}</h2>
        <p className="mt-1 text-white/85">{text}</p>
      </div>
      <ButtonLink href={href} external variant="light" size="lg" className="shrink-0">
        {label}
      </ButtonLink>
    </Reveal>
  );
}
