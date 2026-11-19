import type { StaticImageData } from "next/image";
import fotoKamar1 from "@/assets/foto/kamar-1.jpg";
import fotoKamar3 from "@/assets/foto/kamar-3.jpg";
import fotoDapur from "@/assets/foto/dapur.jpg";
import fotoRuangBersama from "@/assets/foto/ruang-bersama.jpg";
import fotoKamarMandi from "@/assets/foto/kamar-mandi.jpg";

/*
 * Isi bawaan situs. Semua yang diekspor lewat `contentDefaults` bisa diubah di /admin/konten;
 * selama belum diubah, situs memakai isi di file ini.
 */

/** Fasilitas bersama, dikelompokkan menurut tempatnya. `icon` = ikon di `facilities.tsx`. */
export type FacilityIcon = "wifi" | "motor" | "mandi" | "dapur" | "jemuran" | "cctv";
export const sharedFacilities: { place: string; text: string; icon: FacilityIcon }[] = [
  { place: "Seluruh rumah", text: "Wi-Fi 24 jam, gratis", icon: "wifi" },
  { place: "Di dalam rumah", text: "Parkir motor", icon: "motor" },
  { place: "Tiap lantai", text: "1 kamar mandi, total 2", icon: "mandi" },
  { place: "Dapur", text: "Kulkas, kompor, dan alat makan", icon: "dapur" },
  { place: "Lantai atas", text: "Ruang jemuran terbuka", icon: "jemuran" },
  { place: "Ruang bersama", text: "Diawasi CCTV", icon: "cctv" },
];

/** Foto bawaan di repo. Foto unggahan admin memakai URL penuh dari Supabase Storage. */
export const builtinPhotos: Record<string, StaticImageData> = {
  "builtin:kamar-1": fotoKamar1,
  "builtin:kamar-3": fotoKamar3,
  "builtin:dapur": fotoDapur,
  "builtin:ruang-bersama": fotoRuangBersama,
  "builtin:kamar-mandi": fotoKamarMandi,
};

export type GalleryItem = { src: string; alt: string; caption: string };
export const gallery: GalleryItem[] = [
  { src: "builtin:kamar-1", alt: "Kamar dengan tempat tidur kayu dan rak besi", caption: "Kamar tidur" },
  // Kipas angin ada di semua kamar, jadi caption membedakan sudut foto, bukan fasilitasnya.
  { src: "builtin:kamar-3", alt: "Kamar dilihat dari arah pintu, dengan pintu hitam dan kipas angin di dinding", caption: "Kamar, sisi pintu" },
  { src: "builtin:dapur", alt: "Dapur bersama dengan kompor dan wastafel", caption: "Dapur bersama" },
  { src: "builtin:ruang-bersama", alt: "Ruang bersama dengan kulkas, dispenser, dan rak piring", caption: "Ruang bersama" },
  { src: "builtin:kamar-mandi", alt: "Kamar mandi bersama", caption: "Kamar mandi bersama" },
];

export const costRows: { item: string; value: string; highlight?: boolean }[] = [
  { item: "Sewa kamar", value: "Rp500.000 sampai Rp600.000" },
  { item: "Deposit", value: "Rp0", highlight: true },
  { item: "Wi-Fi", value: "Sudah termasuk" },
  { item: "Listrik (token)", value: "Dibagi rata penghuni" },
  { item: "Air", value: "Dibagi rata penghuni" },
];

export const campuses = [
  { name: "POLTEK AMI", detail: "Sekolah pelayaran di Jl. Pertempuran No. 125", distance: "750 m", travel: "Jalan kaki, 11 menit", walkable: true },
  { name: "UMSU", detail: "Universitas Muhammadiyah Sumatera Utara", distance: "1,7 km", travel: "Naik motor, 6 menit", walkable: false },
  { name: "Polimedia Medan", detail: "Politeknik Negeri Media Kreatif, PSDKU Medan", distance: "2,1 km", travel: "Naik motor, 7 menit", walkable: false },
] as const;

export const ruleHighlights = [
  "Jam tenang pukul 22.00 sampai 06.00.",
  "Tamu laki-laki hanya di ruang tamu atau teras.",
  "Tamu yang menginap perlu izin pengelola.",
  "Dapur hanya untuk makanan halal.",
];

export const rules: { title: string; items: { label: string; text: string }[] }[] = [
  {
    title: "Keamanan dan ketertiban",
    items: [
      { label: "Kunci pintu", text: "Pastikan pintu depan, belakang, dan lantai atas selalu terkunci saat keluar atau masuk." },
      { label: "Parkir", text: "Parkir motor atau sepeda di dalam dengan rapi dan dalam keadaan terkunci." },
      { label: "Larangan", text: "Dilarang membawa hewan peliharaan, miras, narkoba, melakukan tindakan asusila, atau melanggar hukum." },
      { label: "Jam tenang", text: "Jaga ketenangan pukul 22.00 sampai 06.00 WIB." },
    ],
  },
  {
    title: "Tamu dan kunjungan",
    items: [
      { label: "Lawan jenis", text: "Dilarang membawa lawan jenis ke kamar. Tamu hanya boleh di ruang tamu atau teras depan." },
      { label: "Tamu menginap", text: "Wajib izin pengelola. Tamu sesama jenis yang menginap lebih dari 2 malam dikenakan Rp50.000 per malam." },
    ],
  },
  {
    title: "Dapur dan fasilitas bersama",
    items: [
      { label: "Makanan non-halal", text: "Dapur bersama tidak boleh dipakai untuk menyimpan, mengolah, atau makan makanan non-halal, termasuk babi, turunannya, dan makanan beralkohol." },
      { label: "Kebersihan dapur", text: "Cuci peralatan setelah dipakai dan jaga area kompor tetap bersih." },
      { label: "Fasilitas bersama", text: "Gunakan dengan baik. Kerusakan karena kelalaian menjadi tanggung jawab penghuni yang bersangkutan." },
    ],
  },
  {
    title: "Kebersihan dan sampah",
    items: [
      { label: "Sampah kamar", text: "Bungkus dan buang langsung ke bak sampah depan gang. Jangan menumpuk sampah di lorong atau depan kamar." },
      { label: "Kamar tidur", text: "Kebersihan kamar dan seprai menjadi tanggung jawab masing-masing." },
      { label: "Area umum", text: "Lorong dan teras dibersihkan ibu kos seminggu sekali." },
    ],
  },
  {
    title: "Kamar mandi dan air",
    items: [
      { label: "Kamar mandi", text: "Bersihkan setelah dipakai, siram kloset, dan buang sampah pada tempatnya." },
      { label: "Air galon", text: "Iuran dan isi ulang menjadi tanggung jawab bersama penghuni tiap lantai." },
      { label: "Hemat air", text: "Pastikan keran tertutup rapat setelah dipakai." },
    ],
  },
  {
    title: "Listrik dan bohlam",
    items: [
      { label: "Hemat listrik", text: "Matikan lampu, kipas, dan alat elektronik saat meninggalkan kamar." },
      { label: "Bohlam kamar", text: "Penggantian bohlam di kamar menjadi tanggung jawab penghuni." },
      { label: "Bohlam area bersama", text: "Menjadi tanggung jawab pengelola. Segera laporkan kalau putus." },
    ],
  },
];

/** `highlight` = ikut tampil di bagian "Yang sering ditanyakan" di beranda. */
export type Faq = { q: string; a: string; highlight?: boolean };

export const faqCategories: { title: string; items: Faq[] }[] = [
  {
    title: "Biaya",
    items: [
      { q: "Apakah ada deposit?", a: "Tidak ada deposit untuk semua kamar.", highlight: true },
      { q: "Berapa sewa per bulan?", a: "Kamar bawah Rp500.000, kamar atas Rp550.000, dan kamar 4 yang paling luas Rp600.000. Wi-Fi sudah termasuk." },
      { q: "Bagaimana sistem listrik dan air?", a: "Listrik memakai token dan air dibagi rata oleh seluruh penghuni. Pemilik ikut menanggung Rp100.000 untuk air dan Rp50.000 untuk listrik setiap bulan.", highlight: true },
      { q: "Ada harga tahunan?", a: "Ada. Kamar bawah Rp5.500.000 per tahun dan kamar atas Rp6.100.000 per tahun. Untuk kamar 4, tanyakan lewat WhatsApp." },
    ],
  },
  {
    title: "Kamar dan fasilitas",
    items: [
      { q: "Apa saja isi kamarnya?", a: "Tempat tidur, kipas angin, dan rak kecil." },
      { q: "Apakah kamar mandinya di dalam kamar?", a: "Tidak. Ada dua kamar mandi bersama, satu di lantai bawah dan satu di lantai atas." },
      { q: "Boleh memasak?", a: "Boleh, di dapur bersama yang dilengkapi kulkas, kompor, dan alat makan. Dapur hanya untuk makanan halal." },
      { q: "Ada tempat parkir motor?", a: "Ada. Motor diparkir di dalam rumah dengan rapi dan dalam keadaan terkunci." },
    ],
  },
  {
    title: "Aturan dan tamu",
    items: [
      { q: "Apakah kost ini khusus putri?", a: "Ya, Kost 3g khusus putri.", highlight: true },
      { q: "Boleh membawa tamu?", a: "Tamu lawan jenis hanya boleh di ruang tamu atau teras. Tamu yang menginap perlu izin pengelola." },
      { q: "Jam berapa jam tenangnya?", a: "Pukul 22.00 sampai 06.00 WIB." },
    ],
  },
  {
    title: "Survey dan masuk",
    items: [
      { q: "Boleh survey dulu sebelum masuk?", a: "Boleh. Chat salah satu nomor WhatsApp untuk mengatur jadwal survey dengan pengelola di Medan.", highlight: true },
      { q: "Bagaimana cara memesan kamar?", a: "Chat lewat WhatsApp, sebutkan nomor kamar yang kamu mau, lalu atur jadwal survey atau masuk." },
    ],
  },
];

export const contentDefaults = {
  faq: faqCategories,
  rules,
  ruleHighlights,
  costRows,
  sharedFacilities,
  gallery,
};
export type ContentMap = typeof contentDefaults;
export type ContentKey = keyof ContentMap;
