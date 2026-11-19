#!/usr/bin/env bash
# DARURAT saja (mis. GitHub Actions sedang mati). Alur normal: merge ke main, lihat docs/ci-cd.md.
# Menyalin folder kerja ini ke VPS lalu menjalankan rilis yang sama dengan CI (build, uji sehat, kembali otomatis bila gagal).
set -euo pipefail
HOST=ghani-main
DIR=/home/civo/kost3g

rsync -az --delete \
  --exclude node_modules --exclude .next --exclude .git --exclude '.env*' \
  --exclude .remember --exclude .playwright-mcp --exclude graphify-out --exclude .claude \
  --exclude deploy/kost3g.env --exclude .deployed \
  ./ "$HOST:$DIR/"
ssh "$HOST" "cd $DIR/deploy && ./release.sh"
