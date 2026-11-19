# Kost 3g

Website untuk Kost 3g, kost putri di Gg. Silaturahim, Brayan, Medan.
Dibangun dengan Next.js 16 (App Router, TypeScript, Cache Components) dan Tailwind CSS 4.
Halaman publik dirender statis dari data Supabase dan diperbarui otomatis saat admin menyimpan. Halaman admin di `/admin`.

## Menjalankan

```bash
pnpm install
ssh -N -L 54321:127.0.0.1:8100 ghani-main   # tunnel ke Supabase di VPS (terminal terpisah)
pnpm dev        # http://localhost:3000
pnpm lint
pnpm build && pnpm start
```

Salin `.env.example` menjadi `.env.local` dan isi kunci Supabase. Build butuh tunnel aktif karena
data kamar dan konten ikut dirender statis dari database.

## Admin (`/admin`)

Login dengan Google. Hanya email di tabel `kost.admins` yang bisa masuk; tambah/cabut lewat menu **Akses admin**.

| Menu | Isi |
| --- | --- |
| Dasbor | Okupansi, uang masuk/keluar bulan ini, tunggakan, jatuh tempo 7 hari, kontrak yang segera habis |
| Kamar | Status (kosong/terisi/dipesan/perbaikan), harga, ukuran. **Langsung mengubah situs** |
| Penghuni | Profil, kontak darurat, foto KTP opsional (privat, butuh persetujuan, setiap akses dicatat) |
| Sewa | Check-in (kamar otomatis terisi) dan check-out dengan checklist (kamar otomatis kosong), perpanjangan |
| Tagihan | Buat tagihan bulanan, bagi rata listrik & air setelah tanggungan pemilik, catat pembayaran + bukti, pengingat WhatsApp |
| Keuangan | Pengeluaran per kategori, arus kas bulanan, ringkasan 12 bulan, unduh CSV |
| Keluhan | Kerusakan per kamar/area; biaya perbaikan yang selesai otomatis masuk pengeluaran |
| Calon penyewa | Daftar tunggu, jadwal survey, tombol "kabari kamar kosong" |
| Konten situs | Rincian biaya, fasilitas bersama, galeri foto (unggah), aturan, tata tertib, FAQ |
| Log aktivitas | Siapa mengubah apa (tanpa menyalin data pribadi) |
| Pengaturan | Tanggungan pemilik, masa simpan data, pembersihan data pribadi (UU PDP) |

Data ada di Supabase self-hosted **khusus kos** di VPS (`/home/civo/kost3g-supabase`, lihat
`deploy/supabase/README.md`), schema `kost`. Skema dan RLS:
`supabase/migrations/`. Setelah mengubah skema, buat ulang tipe di `src/lib/supabase/database.types.ts`.

## Mengubah status kamar

Lewat **/admin/kamar**, atau otomatis saat sewa dimulai/diakhiri di **/admin/sewa**. Judul hero,
ilustrasi rumah, denah, daftar kamar, tombol WhatsApp, dan gambar pratinjau tautan langsung ikut
berubah tanpa deploy ulang (cache di-`updateTag("rooms")`).

## Deploy

Alur normal (lihat `docs/ci-cd.md`): kerja di cabang `dev` → pull request ke `main` → CI lulus → merge → setujui deploy di
GitHub → kode dikirim ke VPS, di-build di sana, diuji sehat, dan kembali otomatis ke versi lama bila gagal.

- Build terjadi di VPS karena prerender membaca Supabase kos (tidak dibuka ke internet). `deploy/release.sh` yang mengerjakannya.
- `deploy/kost3g.env` di VPS berisi `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `UMAMI_*`, dan
  `NEXT_PUBLIC_UMAMI_WEBSITE_ID`. Tidak di-commit; tidak pernah ditimpa oleh deploy.
- Darurat (Actions mati): `./deploy/deploy.sh` dari laptop menjalankan rilis yang sama.
- Perintah sehari-hari: `pnpm dev`, `pnpm lint`, `pnpm typecheck`, `pnpm test`.

## Analitik (Umami) dan backup

- **Umami 3.4.1** jalan di VPS (`/home/civo/kost3g-umami`, hanya `127.0.0.1:3200`, database `umami` di Postgres Supabase kos). Tidak dibuka ke internet: script dan kiriman event lewat situs sendiri (`/u/script.js`, `/u/api/send`, lihat `rewrites` di `next.config.ts`). Dashboard Umami sendiri dibuka lewat SSH tunnel: `ssh -L 3200:127.0.0.1:3200 ghani-main`.
- Event: `wa-klik` (data `lokasi`, `halaman`; lokasi dibaca dari `data-lokasi` terdekat atau judul bagian) dan `kabari-terkirim`. Angkanya tampil di Laporan, tab "Situs & calon". Tanpa `NEXT_PUBLIC_UMAMI_WEBSITE_ID` saat build, pelacakan mati dan Laporan menampilkan catatan bahwa Umami tidak terhubung.
- **Backup harian** `deploy/backup.sh` (cron 19:45 UTC): dump skema `kost`+`auth`+`storage`, dump database `umami`, dan tar folder Storage ke `/home/civo/backups/kost3g`, disimpan 14 hari. Belum ada salinan di luar VPS.
- **Pulihkan** (uji di database sementara dulu): `docker exec -i kost3g-supabase-db pg_restore -U supabase_admin -d postgres --clean --if-exists --no-owner < kost-YYYY-MM-DD_HHMM.dump`, lalu `tar xzf storage-*.tgz -C /home/civo/kost3g-supabase/volumes`.
- **Kembali ke versi sebelumnya** bila deploy bermasalah: `ssh ghani-main 'docker tag kost3g-web:prev kost3g-web:latest && cd /home/civo/kost3g/deploy && set -a && . ./kost3g.env && set +a && docker compose up -d --no-build'`.

## Mengubah teks lain

| Yang diubah | File |
| --- | --- |
| Nama, alamat, koordinat, nomor WhatsApp, pesan WhatsApp | `src/lib/site.ts` |
| Fasilitas, galeri, rincian biaya, tata tertib, FAQ | **/admin/konten** (isi bawaan di `src/data/content.ts`) |
| Jarak kampus | `src/data/content.ts` |
| Warna, font, ukuran judul | `src/app/globals.css` |

## Foto

Foto ada di `src/assets/foto/`. Foto sudah diperkecil ke 1080 px dan metadata EXIF-nya
(termasuk lokasi GPS) dihapus. `next/image` otomatis membuat versi AVIF/WebP dengan ukuran
yang pas untuk tiap layar.

Untuk mengganti atau menambah foto, taruh file baru di folder itu lalu impor di
`src/data/content.ts` (galeri) atau `src/data/rooms.ts` (foto per lantai).

Foto tampak depan belum ada di folder ini. Kalau sudah ada, kotak "Cari bangunan ini" di
`src/components/location.tsx` bisa diganti dari ikon pintu menjadi foto.

## Struktur

```
src/
  app/                 halaman (beranda, lokasi, tata-tertib, faq), metadata, sitemap, OG image
  components/          komponen UI (rumah, pintu, pemilih kamar, panel lokasi, dll.)
  data/                data kamar dan konten
  lib/                 konstanta situs dan utilitas
  assets/foto/         foto asli kost
```

## Catatan desain

Desain mengikuti file Figma "Kost 3g" (page Design System dan Hi-Fi). Elemen khasnya adalah
pintu: pintu terbuka berwarna oranye berarti kamar kosong, pintu tertutup hijau berarti
terisi. Font Bricolage Grotesque dan Plus Jakarta Sans di-host sendiri lewat `next/font/local`.
