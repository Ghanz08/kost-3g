/**
 * Informasi dasar Kost 3g yang dipakai di seluruh situs.
 * Ubah di satu tempat ini saja kalau ada data yang berganti.
 */
export const site = {
  name: "Kost 3g",
  tagline: "Kost putri di Brayan, Medan",
  description:
    "Kost putri dua lantai di Gg. Silaturahim, Pulo Brayan, Medan. Mulai Rp500.000 per bulan, tanpa deposit, Wi-Fi gratis, 11 menit jalan kaki ke POLTEK AMI.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  address: {
    street: "Jl. KL Yos Sudarso, Gg. Silaturahim No. 26 D",
    locality: "Pulo Brayan Bengkel Baru, Medan Barat",
    city: "Medan",
    region: "Sumatera Utara",
    postalCode: "20116",
    country: "ID",
  },
  geo: { lat: 3.6246315, lng: 98.6684112 },
  phones: [
    { display: "0852-7544-0791", e164: "6285275440791" },
    { display: "0812-6491-8209", e164: "6281264918209" },
  ],
} as const;

export const fullAddress = `${site.address.street}, ${site.address.locality}, ${site.address.city} ${site.address.postalCode}`;

export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${site.geo.lat},${site.geo.lng}`;
export const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${site.geo.lat},${site.geo.lng}`;

/** Tautan klik-untuk-chat WhatsApp dengan pesan pembuka yang sudah terisi. */
export function waLink(message?: string, phone: string = site.phones[0].e164) {
  const base = `https://wa.me/${phone}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const waMessages = {
  general: "Halo, saya mau tanya tentang Kost 3g di Brayan.",
  survey: "Halo, saya mau atur jadwal survey ke Kost 3g.",
  vacancy: "Halo, kapan ada kamar kosong di Kost 3g?",
  rooms: (numbers: number[]) =>
    `Halo, saya mau tanya kamar ${numbers.join(" atau ")} di Kost 3g. Apakah masih kosong?`,
  location: "Halo, boleh minta share lokasi Kost 3g?",
};

export const nav = [
  { href: "/", label: "Beranda" },
  { href: "/#kamar", label: "Kamar" },
  { href: "/lokasi", label: "Lokasi" },
  { href: "/tata-tertib", label: "Tata Tertib" },
  { href: "/faq", label: "FAQ" },
] as const;
