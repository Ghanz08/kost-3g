import { ButtonLink } from "@/components/button";
import { Door } from "@/components/door";
import { Container } from "@/components/section-header";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center gap-6 py-24 text-center">
      {/* Tok, tok... tidak ada yang membuka. */}
      <Door className="w-20 origin-bottom animate-knock" number="?" />
      <h1 className="text-h2 text-navy-700">Pintu ini tidak ada.</h1>
      <p className="max-w-md text-subtle">Halaman yang kamu cari tidak ditemukan. Kembali ke beranda untuk melihat kamar yang kosong.</p>
      <ButtonLink href="/">Kembali ke beranda</ButtonLink>
    </Container>
  );
}
