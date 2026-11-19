# Supabase Kost 3g (VPS)

Instance sendiri di `/home/civo/kost3g-supabase`, **terpisah dari Supabase Glideslope**
(proyek compose `kost3g-supabase`, database, akun login, dan secret sendiri).

- Gateway: `127.0.0.1:8100`. Publik lewat Caddy hanya `https://supabase.ghanizulhusni.space/auth/v1/*`
  dan `/storage/v1/object/public/kost-public/*`.
- `.env` dibuat dari `.env.example` resmi + `utils/generate-keys.sh` dan `utils/add-new-auth-keys.sh`.
  Nilai khusus kos: `API_EXTERNAL_URL=https://supabase.ghanizulhusni.space/auth/v1`,
  `SITE_URL=https://kost3g.ghanizulhusni.space`, `DISABLE_SIGNUP=true`, `ENABLE_EMAIL_SIGNUP=false`,
  `PGRST_DB_SCHEMAS=public,graphql_public,kost`, `API_GW_HTTP_PORT=127.0.0.1:8100`,
  `KOST3G_GOOGLE_CLIENT_ID` / `KOST3G_GOOGLE_SECRET`.
- Override: `docker-compose.override.yml` di folder ini (salinan).
- Migrasi: `supabase/migrations/*.sql` di repo, dijalankan dengan
  `docker exec -i kost3g-supabase-db psql -U supabase_admin -d postgres`.
- Studio hanya lewat tunnel: `ssh -N -L 3000:127.0.0.1:<port studio> ghani-main` (tidak dibuka ke internet).
