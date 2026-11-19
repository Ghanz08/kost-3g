#!/usr/bin/env bash
# Satu-satunya perintah yang boleh dijalankan kunci SSH milik GitHub Actions. Dipasang DI LUAR repo:
#   /home/civo/bin/kost3g-ci   (lihat docs/ci-cd.md), dan di authorized_keys:
#   restrict,command="/home/civo/bin/kost3g-ci" ssh-ed25519 AAAA... kost3g-ci
# Tanpa shell, tanpa forwarding. Hanya dua perintah:
#   ship            : stdin = tar dari `git archive`, diperiksa lalu disalin ke /home/civo/kost3g
#   release <sha40> : jalankan deploy/release.sh untuk commit itu
set -euo pipefail
DIR=/home/civo/kost3g
cmd="${SSH_ORIGINAL_COMMAND:-}"
case "$cmd" in
  ship)
    tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
    tar -x -C "$tmp" --no-same-owner
    test -f "$tmp/Dockerfile" && test -f "$tmp/deploy/release.sh" || { echo "arsip tidak valid" >&2; exit 2; }
    # Rahasia di VPS (kost3g.env) tidak pernah ditimpa atau dihapus.
    rsync -a --delete --exclude 'deploy/kost3g.env' --exclude '.deployed' "$tmp"/ "$DIR"/
    echo "kode diterima"
    ;;
  release\ *)
    sha="${cmd#release }"
    [[ "$sha" =~ ^[0-9a-f]{40}$ ]] || { echo "sha tidak valid" >&2; exit 2; }
    SHA="$sha" "$DIR/deploy/release.sh"
    ;;
  *)
    echo "perintah ditolak" >&2; exit 126
    ;;
esac
