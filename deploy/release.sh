#!/usr/bin/env bash
# Rilis Kost 3g DI VPS (dipanggil oleh gateway CI atau deploy.sh darurat). Urutan:
#   build image baru (gagal build = kontainer lama tidak disentuh) -> jalankan -> tunggu sehat -> uji jalur penting.
#   Bila tidak sehat: kembalikan image sebelumnya otomatis dan keluar dengan status gagal.
set -euo pipefail
cd "$(dirname "$0")"
test -f kost3g.env || { echo "deploy/kost3g.env belum ada di VPS, lihat README"; exit 1; }
set -a; . ./kost3g.env; set +a

had_prev=0
if docker image inspect kost3g-web:latest >/dev/null 2>&1; then docker tag kost3g-web:latest kost3g-web:prev; had_prev=1; fi

docker compose build
docker compose up -d

healthy() {
  for _ in $(seq 1 30); do
    [ "$(docker inspect -f '{{.State.Health.Status}}' kost3g-web 2>/dev/null || echo none)" = healthy ] && return 0
    sleep 3
  done
  return 1
}
smoke() {
  for path in / /faq /u/script.js /robots.txt; do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "http://127.0.0.1:3100$path") || code=000
    echo "  $path -> $code"
    [ "$code" = 200 ] || return 1
  done
  # /admin harus menolak tanpa login (302/307), bukan error server.
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 http://127.0.0.1:3100/admin/laporan) || code=000
  echo "  /admin/laporan -> $code"
  [ "$code" = 302 ] || [ "$code" = 307 ]
}

if healthy && smoke; then
  docker image prune -f >/dev/null
  echo "${SHA:-manual} $(date -u +%FT%TZ)" > ../.deployed
  echo "rilis OK (${SHA:-manual})"
else
  echo "RILIS GAGAL: tidak sehat atau uji jalur gagal." >&2
  docker logs --tail 40 kost3g-web >&2 || true
  if [ "$had_prev" = 1 ]; then
    echo "Mengembalikan versi sebelumnya..." >&2
    docker tag kost3g-web:prev kost3g-web:latest
    docker compose up -d --no-build
  fi
  exit 1
fi
