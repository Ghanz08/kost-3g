# Alur rilis CI/CD

Satu jalur ke produksi, tanpa deploy tangan lewat SSH.

```
push ke dev ──► CI (lint, tipe, tes)                    tidak menyentuh VPS
pull request dev → main ──► CI yang sama                wajib lulus sebelum bisa di-merge
merge ke main ──► CI lagi ──► (persetujuan pemilik) ──► kirim kode ──► build di VPS ──► uji sehat
                                                                          └─ gagal? kembali otomatis ke versi sebelumnya
```

## Kenapa build di VPS, bukan image dari GitHub
`next build` membaca data kamar dari Supabase kos saat prerender, dan Supabase itu sengaja tidak dibuka ke internet
(Caddy hanya membuka `/auth/v1/*` dan foto galeri publik). Runner GitHub tidak bisa menjangkaunya, jadi CI hanya
memeriksa kode (lint, tipe, tes) dan build terjadi di VPS lewat `deploy/release.sh`. Gagal build = kontainer yang
berjalan tidak disentuh.

## Yang terjadi saat deploy
1. `ship`: `git archive` commit itu dikirim lewat SSH ke gateway (`deploy/ci-gateway.sh`), diperiksa, lalu disalin
   ke `/home/civo/kost3g`. `deploy/kost3g.env` (rahasia) tidak pernah ditimpa.
2. `release <sha>`: `deploy/release.sh` menandai image berjalan sebagai `kost3g-web:prev`, build, `up -d`, menunggu
   status `healthy`, lalu menguji `/`, `/faq`, `/u/script.js`, `/robots.txt`, dan `/admin/laporan` (harus 302/307).
3. Bila ada yang gagal: image `:prev` dipulihkan otomatis dan job ditandai gagal (kamu mendapat email dari GitHub).

**Rollback manual:** revert commit di `main` lewat pull request (deploy berjalan lagi), atau jalankan ulang workflow
(`workflow_dispatch`). Darurat saat Actions mati: `./deploy/deploy.sh` dari laptop (rilis yang sama, tanpa persetujuan).

## Pengaturan GitHub (sekali saja, di Settings repo)
Sebagian sudah dipasang lewat `gh` saat repo dibuat; periksa apakah paket GitHub-mu mendukung sisanya.

### 1. Proteksi cabang `main`
- Wajib pull request sebelum merge (approval boleh 0 untuk pemilik tunggal).
- Wajib status check `check` lulus, dan cabang harus mutakhir.
- Blokir force push dan penghapusan cabang. Jangan beri bypass: `git push origin dev:main` akan ditolak.

### 2. Environment `production` (Settings → Environments)
- Required reviewers: pemilik. Setiap deploy menunggu persetujuan. (Untuk repo privat, fitur ini butuh paket GitHub
  yang mendukungnya. Tanpa itu, proteksi cabang di atas tetap jadi pagar utama.)
- Deployment branches: hanya `main`.
- Rahasia di environment: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS`.
- Variabel repo `DEPLOY_ENABLED=true` menyalakan job deploy (matikan dengan mengubahnya jadi `false`).

### 3. Akses SSH minimal ke VPS
- Kunci khusus CI, dibuat baru: `ssh-keygen -t ed25519 -C kost3g-ci`. Kunci pribadi hanya ada di rahasia GitHub.
- Di `~/.ssh/authorized_keys` VPS, kunci itu dibatasi ke satu perintah, tanpa shell dan tanpa forwarding:

  ```
  restrict,command="/home/civo/bin/kost3g-ci" ssh-ed25519 AAAA... kost3g-ci
  ```

- `/home/civo/bin/kost3g-ci` adalah salinan `deploy/ci-gateway.sh`, dipasang **di luar repo** supaya perubahan kode
  tidak bisa mengubah apa yang boleh dijalankan kunci itu. Perbarui salinannya bila skrip berubah:
  `scp deploy/ci-gateway.sh ghani-main:/home/civo/bin/kost3g-ci`.
- `VPS_KNOWN_HOSTS` berisi sidik jari host yang sudah dipercaya; workflow memakai `StrictHostKeyChecking yes`.
- Putar kunci bila ada dugaan bocor: hapus barisnya dari `authorized_keys`, buat pasangan baru, perbarui rahasia.

## Hal yang masih perlu diperhatikan
- Aksi GitHub di-pin ke SHA commit (komentar menyebut versinya); Dependabot mengusulkan pembaruannya tiap Senin.
- Gateway berjalan sebagai `civo` (pemilik semua kontainer di VPS). Kuncinya hanya bisa dua perintah, tapi `release.sh`
  menjalankan docker; jangan longgarkan `command=` tanpa alasan.
- Backup database/Storage masih di VPS yang sama (lihat README). Git melindungi kode, bukan data kos.
