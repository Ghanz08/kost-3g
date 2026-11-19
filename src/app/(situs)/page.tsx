import * as motion from "motion/react-client";
import type { CSSProperties } from "react";
import { ButtonLink } from "@/components/button";
import { Door } from "@/components/door";
import { DoorLegend } from "@/components/door-legend";
import { Facilities } from "@/components/facilities";
import { FaqList } from "@/components/faq-list";
import { Gallery } from "@/components/gallery";
import { House } from "@/components/house";
import { ChatIcon } from "@/components/icons";
import { LocationPanel } from "@/components/location";
import { NotifyForm } from "@/components/notify-form";
import { CountUp, Parallax, Pop, Reveal, WordsRise } from "@/components/motion";
import { PageTransition } from "@/components/page-transition";
import { RoomPicker } from "@/components/room-picker";
import { FloorList } from "@/components/rooms";
import { Container, SectionHeader } from "@/components/section-header";
import { type Room, countWord, highestPrice, isVacant, lowestPrice, rupiah, shortRupiah } from "@/data/rooms";
import { ease } from "@/lib/ease";
import { getContent, getRooms } from "@/lib/site-data";
import { fullAddress, mapsUrl, site, waLink, waMessages } from "@/lib/site";

/** Elemen hero muncul berurutan setelah judul (CSS, supaya tampil tanpa menunggu hidrasi). */
const heroIn = (delay: number) => ({ style: { "--d": `${delay}s` } as CSSProperties });

function JsonLd({ rooms }: { rooms: Room[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: site.name,
    description: site.description,
    url: site.url,
    image: `${site.url}/opengraph-image`,
    hasMap: mapsUrl,
    numberOfRooms: rooms.length,
    telephone: `+${site.phones[0].e164}`,
    priceRange: `${rupiah(lowestPrice(rooms))} sampai ${rupiah(highestPrice(rooms))} per bulan`,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lng },
    amenityFeature: ["Wi-Fi gratis", "CCTV", "Dapur bersama", "Parkir motor"].map((name) => ({
      "@type": "LocationFeatureSpecification",
      name,
      value: true,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export default async function HomePage() {
  const [{ rooms, updatedAt }, costRows, ruleHighlights, faq, gallery, shared] = await Promise.all([
    getRooms(),
    getContent("costRows"),
    getContent("ruleHighlights"),
    getContent("faq"),
    getContent("gallery"),
    getContent("sharedFacilities"),
  ]);
  const vacantRooms = rooms.filter(isVacant);
  const faqHighlights = faq.flatMap((c) => c.items).filter((f) => f.highlight);
  const vacantNumbers = vacantRooms.map((r) => r.number);
  const heroTitle = vacantRooms.length
    ? `${countWord(rooms.length)} pintu. ${countWord(vacantRooms.length)} masih kosong.`
    : `${countWord(rooms.length)} pintu. Semua sedang terisi.`;
  const heroCta = vacantRooms.length
    ? { href: waLink(waMessages.rooms(vacantNumbers)), label: `Tanya kamar ${vacantNumbers.join(" atau ")}` }
    : { href: waLink(waMessages.vacancy), label: "Tanya kapan ada kamar kosong" };

  // Angka ketiga = titik awal hitungan. Deposit sengaja dihitung mundur dari satu juta ke nol.
  const facts = [
    [shortRupiah(lowestPrice(rooms)), "rupiah per bulan, harga terendah", 0],
    ["Rp0", "deposit, untuk semua kamar", 1_000_000],
    ["24 jam", "Wi-Fi gratis", 0],
    [`${rooms.length} kamar`, "khusus putri, dua lantai", 0],
  ] as const;

  return (
    <PageTransition>
      <JsonLd rooms={rooms} />

      {/* HERO */}
      <section aria-labelledby="judul-hero" className="pt-8 pb-12 md:pt-14 lg:pb-14">
        <Container className="grid items-center gap-x-16 gap-y-6 [grid-template-areas:'judul'_'rumah'_'aksi'_'intro'_'meta'] lg:grid-cols-[1fr_minmax(0,37.5rem)] lg:[grid-template-areas:'judul_rumah'_'intro_rumah'_'aksi_rumah'_'meta_rumah']">
          <h1 id="judul-hero" className="text-display text-navy-700 [grid-area:judul] lg:self-end">
            <WordsRise text={heroTitle} delay={0.1} />
          </h1>
          <Parallax distance={70} className="relative [grid-area:rumah] lg:self-center">
            <motion.div
              className="absolute inset-x-0 top-0 bottom-8 origin-bottom [border-radius:50%_50%_0_0/40%_40%_0_0] bg-surface"
              aria-hidden
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease }}
            />
            <House rooms={rooms} className="relative pt-[22%]" />
          </Parallax>
          <p {...heroIn(0.45)} className="animate-hero-in max-w-xl text-lg leading-relaxed text-subtle [grid-area:intro]">
            Kost putri dua lantai di Brayan, Medan. Sebelas menit jalan kaki ke POLTEK AMI, dan Wi-Fi sudah
            termasuk di harga sewa.
          </p>
          <div {...heroIn(0.6)} className="animate-hero-in flex flex-col gap-3 [grid-area:aksi] sm:flex-row sm:items-center sm:gap-5">
            <div id="hero-cta">
              <ButtonLink href={heroCta.href} external size="lg" icon={<ChatIcon />} className="w-full sm:w-auto">
                {heroCta.label}
              </ButtonLink>
            </div>
            <p className="text-sm text-subtle">
              Tanpa deposit.
              <br className="hidden sm:block" /> Survey bisa diatur lewat chat.
            </p>
          </div>
          <div {...heroIn(0.75)} className="animate-hero-in flex flex-col gap-3 [grid-area:meta] lg:self-start">
            <DoorLegend long />
            <p className="text-sm text-subtle">Status kamar diperbarui {updatedAt}</p>
          </div>
        </Container>
      </section>

      {/* FAKTA */}
      <Container>
        <dl className="grid grid-cols-2 overflow-hidden rounded-card bg-surface lg:grid-cols-4">
          {facts.map(([value, label, from], i) => (
            <Reveal
              key={label}
              delay={i * 0.1}
              className={[
                "flex flex-col-reverse gap-1 p-5 md:p-8",
                i % 2 === 0 ? "border-r border-line" : "",
                i < 2 ? "border-b border-line lg:border-b-0" : "",
                i === 1 ? "lg:border-r" : "",
              ].join(" ")}
            >
              <dt className="text-sm text-subtle md:text-base">{label}</dt>
              <dd className="text-h2 text-brand-500">
                <CountUp value={value} from={from} />
              </dd>
            </Reveal>
          ))}
        </dl>
      </Container>

      {/* KAMAR */}
      <section id="kamar" aria-labelledby="judul-kamar" className="pt-16 md:pt-24">
        <Container className="flex flex-col gap-8">
          <SectionHeader
            id="judul-kamar"
            title="Pilih kamarnya, lantai demi lantai"
            description="Harga sudah termasuk Wi-Fi. Listrik dan air dibagi bersama, rinciannya ada di bawah."
          >
            <DoorLegend className="hidden lg:flex" />
          </SectionHeader>
          <div className="lg:hidden">
            <RoomPicker rooms={rooms} />
          </div>
          <div className="hidden lg:block">
            <FloorList rooms={rooms} />
          </div>
        </Container>
      </section>

      {/* BIAYA */}
      <section aria-labelledby="judul-biaya" className="pt-16 md:pt-24">
        <Container className="grid gap-8 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-6">
            <SectionHeader
              id="judul-biaya"
              title="Yang kamu bayar tiap bulan"
              description="Tidak ada biaya tersembunyi. Ini rincian lengkapnya."
            />
            <Reveal delay={0.15} className="flex gap-4 rounded-2xl bg-accent-50 p-5">
              <Door open animate="scroll" className="w-7 shrink-0 self-start" />
              <p className="leading-relaxed">
                Pemilik ikut menanggung Rp100.000 untuk air dan Rp50.000 untuk listrik setiap bulan, jadi bagianmu
                lebih ringan. Perkiraan per orang bisa ditanyakan lewat WhatsApp.
              </p>
            </Reveal>
          </div>
          <dl className="rounded-card bg-surface px-6 py-4 md:px-8">
            {costRows.map((row, i) => (
              <Reveal
                key={row.item}
                delay={i * 0.08}
                x={-16}
                y={0}
                className={`flex items-start justify-between gap-6 py-4 ${i < costRows.length - 1 ? "border-b border-dashed border-line" : ""}`}
              >
                <dt className="text-subtle md:text-lg">{row.item}</dt>
                <dd className={`text-right font-semibold md:text-lg ${row.highlight ? "text-brand-500" : "text-navy-700"}`}>
                  {row.value}
                </dd>
              </Reveal>
            ))}
          </dl>
        </Container>
      </section>

      {/* FASILITAS */}
      <section aria-labelledby="judul-fasilitas" className="pt-16 md:pt-24">
        <Container className="flex flex-col gap-8">
          <SectionHeader id="judul-fasilitas" title="Isi rumahnya" description="Foto asli dari kamar dan ruang bersama." />
          <Gallery items={gallery} />
          <Facilities rooms={rooms} shared={shared} />
        </Container>
      </section>

      {/* LOKASI */}
      <section id="lokasi" aria-labelledby="judul-lokasi" className="pt-16 md:pt-24">
        <Container className="flex flex-col gap-8">
          <SectionHeader
            id="judul-lokasi"
            title="Sebelas menit jalan kaki ke POLTEK AMI."
            description="Kost 3g ada di gang kecil di Pulo Brayan, Medan Barat, dekat sekolah pelayaran dan dua kampus lain."
          />
          <LocationPanel />
        </Container>
      </section>

      {/* ATURAN & FAQ */}
      <section aria-label="Aturan dan pertanyaan umum" className="pt-16 md:pt-24">
        <Container className="grid gap-14 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-6">
            <SectionHeader title="Aturan rumah, singkatnya" description="Supaya semua penghuni sama-sama nyaman." />
            <ol className="flex flex-col gap-4">
              {ruleHighlights.map((rule, i) => (
                <Reveal as="li" key={rule} delay={i * 0.1} x={-20} y={0} className="flex items-start gap-4">
                  <Pop
                    delay={0.15 + i * 0.1}
                    className="grid size-8 shrink-0 place-items-center rounded-full bg-surface text-sm font-semibold text-brand-500"
                  >
                    {i + 1}
                  </Pop>
                  <span className="pt-1 text-lg">{rule}</span>
                </Reveal>
              ))}
            </ol>
            <ButtonLink href="/tata-tertib" variant="secondary" className="self-start">
              Baca tata tertib lengkap
            </ButtonLink>
          </div>
          <div className="flex flex-col gap-6">
            <SectionHeader title="Yang sering ditanyakan" description="Belum ketemu jawabannya? Tanya langsung lewat WhatsApp." />
            <FaqList items={faqHighlights} openFirst />
            <ButtonLink href="/faq" variant="ghost" className="-ml-5 self-start">
              Lihat semua pertanyaan
            </ButtonLink>
          </div>
        </Container>
      </section>

      {/* PENUTUP */}
      <section aria-labelledby="judul-penutup" className="py-16 md:py-24">
        <Container>
          <Reveal
            y={40}
            className="flex flex-col items-center gap-8 overflow-hidden rounded-card bg-brand-500 px-6 pt-12 text-center lg:flex-row lg:items-end lg:gap-16 lg:px-16 lg:pt-16 lg:text-left"
          >
            <div className="flex items-end gap-5 lg:order-first">
              {(vacantRooms.length ? vacantRooms : rooms.slice(0, 2)).slice(0, 3).map((r, i) => (
                <Reveal key={r.number} y={80} delay={0.2 + i * 0.12} className="relative">
                  {r.status === "kosong" && (
                    <span aria-hidden className="absolute -inset-x-1/3 -inset-y-[10%] animate-glow rounded-full bg-accent-500/40 blur-3xl" />
                  )}
                  <Door number={r.number} open={r.status === "kosong"} animate="scroll" className="relative w-24 lg:w-36" />
                </Reveal>
              ))}
            </div>
            <div className="flex flex-col items-center gap-4 pb-12 lg:items-start lg:pb-16">
              <h2 id="judul-penutup" className="text-h2 text-white">
                <WordsRise
                  onView
                  delay={0.3}
                  text={
                    vacantRooms.length
                      ? `Kamar ${vacantNumbers.join(" dan ")} siap ditempati.`
                      : "Semua kamar sedang terisi."
                  }
                />
              </h2>
              <p className="max-w-md text-white/85">
                Chat dulu untuk tanya kamar atau atur jadwal survey. Nomor kedua: {site.phones[1].display}.
              </p>
              <ButtonLink href={heroCta.href} external variant="light" size="lg" icon={<ChatIcon />}>
                Chat {site.phones[0].display}
              </ButtonLink>
              <div className="mt-4 w-full border-t border-white/25 pt-6">
                <NotifyForm />
              </div>
              <p className="sr-only">{fullAddress}</p>
            </div>
          </Reveal>
        </Container>
      </section>
    </PageTransition>
  );
}
