#!/usr/bin/env bash
# Backup harian Kost 3g di VPS (cron 19:45 UTC = 02:45 WIB). Simpan 14 hari di /home/civo/backups/kost3g.
# Isi: skema kost + auth + storage (metadata) dari Postgres Supabase kos, database umami, dan berkas Storage.
# Pulihkan: pg_restore -U supabase_admin -d postgres --clean --if-exists -n kost kost-*.dump (lihat README).
set -euo pipefail
DEST=/home/civo/backups/kost3g
KEEP_DAYS=14
TS=$(date -u +%F_%H%M)
umask 077
mkdir -p "$DEST"

dump() { # dump <nama> <database> [args pg_dump...]
  local out="$DEST/$1-$TS.dump"
  docker exec kost3g-supabase-db pg_dump -U supabase_admin -d "$2" -Fc "${@:3}" > "$out.tmp"
  docker exec -i kost3g-supabase-db pg_restore --list < "$out.tmp" > /dev/null # pastikan arsip bisa dibaca
  mv "$out.tmp" "$out"
}
dump kost postgres -n kost -n auth -n storage
dump umami umami
tar czf "$DEST/storage-$TS.tgz" -C /home/civo/kost3g-supabase/volumes storage

find "$DEST" -type f -mtime +"$KEEP_DAYS" -delete
echo "$(date -u +%FT%TZ) ok $(du -sh "$DEST" | cut -f1)"
