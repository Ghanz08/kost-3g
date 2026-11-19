-- Kost 3g: data kos dan admin, di schema sendiri supaya terpisah dari aplikasi lain di instance ini.
-- Semua tabel dikunci RLS. Hanya email di kost.admins yang bisa membaca/mengubah;
-- pengunjung situs (anon) hanya bisa membaca kamar dan konten publik.

create schema if not exists kost;
grant usage on schema kost to anon, authenticated, service_role;

-- ── Akses ───────────────────────────────────────────────────────────────────

create table kost.admins (
  email text primary key check (email = lower(email)),
  name text,
  added_by text,
  created_at timestamptz not null default now()
);

create or replace function kost.current_email() returns text
language sql stable set search_path = '' as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

-- security definer: dipakai di policy tabel lain tanpa membuka tabel admins ke semua orang.
create or replace function kost.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from kost.admins a where a.email = kost.current_email())
$$;

-- ── Pengaturan ──────────────────────────────────────────────────────────────

create table kost.settings (
  id boolean primary key default true check (id), -- satu baris saja
  owner_water_share integer not null default 100000,
  owner_electric_share integer not null default 50000,
  retention_months integer not null default 12 check (retention_months between 1 and 120),
  updated_at timestamptz not null default now()
);
insert into kost.settings default values;

-- ── Kamar ───────────────────────────────────────────────────────────────────

create table kost.rooms (
  number integer primary key,
  floor text not null check (floor in ('atas', 'bawah')),
  size text not null,
  monthly integer not null check (monthly >= 0),
  yearly integer check (yearly >= 0),
  -- dipesan dan perbaikan tampil sebagai "tidak tersedia" di situs.
  status text not null default 'kosong' check (status in ('kosong', 'terisi', 'dipesan', 'perbaikan')),
  notes text,
  updated_at timestamptz not null default now()
);

insert into kost.rooms (number, floor, size, monthly, yearly, status) values
  (1, 'bawah', '1,9 × 2,5 m', 500000, 5500000, 'terisi'),
  (2, 'bawah', '1,9 × 2,5 m', 500000, 5500000, 'terisi'),
  (3, 'bawah', '1,9 × 2,5 m', 500000, 5500000, 'kosong'),
  (4, 'atas', 'Kamar paling luas', 600000, null, 'terisi'),
  (5, 'atas', '2,5 × 2,5 m', 550000, 6100000, 'terisi'),
  (6, 'atas', '2,5 × 2,5 m', 550000, 6100000, 'kosong'),
  (7, 'atas', '2,5 × 2,5 m', 550000, 6100000, 'terisi');

-- ── Penghuni, sewa ──────────────────────────────────────────────────────────

create table kost.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  origin text, -- kampus atau pekerjaan
  emergency_name text,
  emergency_relation text,
  emergency_phone text,
  ktp_path text, -- objek di bucket privat kost-private
  consent_at timestamptz, -- persetujuan penyimpanan data (UU PDP)
  status text not null default 'calon' check (status in ('calon', 'aktif', 'keluar')),
  notes text,
  anonymized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table kost.leases (
  id uuid primary key default gen_random_uuid(),
  room_number integer not null references kost.rooms (number),
  tenant_id uuid not null references kost.tenants (id),
  scheme text not null default 'bulanan' check (scheme in ('bulanan', 'tahunan')),
  price integer not null check (price >= 0), -- harga disepakati, tidak ikut berubah bila harga kamar diubah
  deposit integer not null default 0 check (deposit >= 0),
  start_date date not null,
  end_date date, -- akhir kontrak yang direncanakan
  ended_on date, -- tanggal benar-benar keluar
  status text not null default 'aktif' check (status in ('aktif', 'selesai')),
  checkin jsonb not null default '{}',
  checkout jsonb,
  notes text,
  created_at timestamptz not null default now()
);
-- Satu kamar hanya boleh punya satu sewa aktif.
create unique index leases_one_active_per_room on kost.leases (room_number) where status = 'aktif';
create index leases_tenant on kost.leases (tenant_id);

-- ── Tagihan & pembayaran ────────────────────────────────────────────────────

create table kost.invoices (
  id uuid primary key default gen_random_uuid(),
  lease_id uuid not null references kost.leases (id) on delete cascade,
  period date not null check (extract(day from period) = 1), -- tanggal 1 bulan tagihan
  due_date date not null,
  rent integer not null default 0 check (rent >= 0),
  electricity integer not null default 0 check (electricity >= 0),
  water integer not null default 0 check (water >= 0),
  other integer not null default 0,
  other_note text,
  total integer generated always as (rent + electricity + water + other) stored,
  created_at timestamptz not null default now(),
  unique (lease_id, period)
);

create table kost.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references kost.invoices (id) on delete cascade,
  paid_on date not null default current_date,
  amount integer not null check (amount > 0),
  method text not null default 'transfer' check (method in ('transfer', 'tunai', 'qris')),
  proof_path text,
  note text,
  created_by text default kost.current_email(),
  created_at timestamptz not null default now()
);
create index payments_invoice on kost.payments (invoice_id);

-- Status dihitung, tidak disimpan, supaya tidak pernah basi.
create view kost.invoice_status with (security_invoker = true) as
select
  i.*,
  coalesce(p.paid, 0) as paid,
  case
    when coalesce(p.paid, 0) >= i.total then 'lunas'
    when i.due_date < current_date then 'telat'
    when coalesce(p.paid, 0) > 0 then 'sebagian'
    else 'belum'
  end as status
from kost.invoices i
left join (select invoice_id, sum(amount)::integer as paid from kost.payments group by invoice_id) p
  on p.invoice_id = i.id;

-- Pembagian listrik (token) dan air per bulan.
create table kost.utility_bills (
  id uuid primary key default gen_random_uuid(),
  period date not null check (extract(day from period) = 1),
  kind text not null check (kind in ('listrik', 'air')),
  total integer not null check (total >= 0),
  owner_share integer not null default 0 check (owner_share >= 0),
  tenants_count integer not null check (tenants_count >= 0),
  per_tenant integer not null check (per_tenant >= 0),
  created_at timestamptz not null default now(),
  unique (period, kind)
);

-- ── Keuangan & operasional ──────────────────────────────────────────────────

create table kost.tickets (
  id uuid primary key default gen_random_uuid(),
  room_number integer references kost.rooms (number),
  area text, -- bila bukan kamar: dapur, kamar mandi atas, dll.
  title text not null,
  description text,
  photo_path text,
  status text not null default 'baru' check (status in ('baru', 'dikerjakan', 'selesai')),
  cost integer check (cost >= 0),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table kost.expenses (
  id uuid primary key default gen_random_uuid(),
  spent_on date not null default current_date,
  category text not null check (category in ('listrik', 'air', 'perbaikan', 'kebersihan', 'perlengkapan', 'lainnya')),
  amount integer not null check (amount > 0),
  note text,
  proof_path text,
  ticket_id uuid references kost.tickets (id) on delete set null,
  created_at timestamptz not null default now()
);

create table kost.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  interest text, -- kamar/lantai yang diminati
  survey_at timestamptz,
  status text not null default 'baru' check (status in ('baru', 'survey', 'jadi', 'batal')),
  notes text,
  created_at timestamptz not null default now()
);

-- ── Konten situs ────────────────────────────────────────────────────────────

-- Kunci yang tidak ada di sini memakai isi bawaan dari kode situs.
create table kost.content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ── Log aktivitas ───────────────────────────────────────────────────────────

create table kost.activity_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor text,
  action text not null,
  entity text not null,
  entity_id text,
  detail jsonb
);
create index activity_log_at on kost.activity_log (at desc);

-- Mencatat siapa mengubah apa. Hanya nama kolom yang berubah yang disimpan, bukan isinya,
-- supaya data pribadi tidak tersalin ke log.
create or replace function kost.log_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  changed text[];
  row_id text;
begin
  if tg_op = 'UPDATE' then
    select array_agg(n.key) into changed
    from jsonb_each(to_jsonb(new)) n
    join jsonb_each(to_jsonb(old)) o using (key)
    where n.value is distinct from o.value and n.key not in ('updated_at');
    if changed is null then return new; end if;
  end if;
  row_id := coalesce(to_jsonb(coalesce(new, old)) ->> 'id', to_jsonb(coalesce(new, old)) ->> 'number', to_jsonb(coalesce(new, old)) ->> 'key', to_jsonb(coalesce(new, old)) ->> 'email');
  insert into kost.activity_log (actor, action, entity, entity_id, detail)
  values (nullif(kost.current_email(), ''), lower(tg_op), tg_table_name, row_id,
          case when changed is not null then jsonb_build_object('fields', changed) end);
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['admins', 'settings', 'rooms', 'tenants', 'leases', 'invoices', 'payments',
                           'utility_bills', 'tickets', 'expenses', 'leads', 'content']
  loop
    execute format('create trigger log_change after insert or update or delete on kost.%I
                    for each row execute function kost.log_change()', t);
  end loop;
end $$;

create or replace function kost.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

create trigger touch before update on kost.rooms for each row execute function kost.touch_updated_at();
create trigger touch before update on kost.tenants for each row execute function kost.touch_updated_at();
create trigger touch before update on kost.settings for each row execute function kost.touch_updated_at();
create trigger touch before update on kost.content for each row execute function kost.touch_updated_at();

-- ── Hak akses ───────────────────────────────────────────────────────────────

grant select, insert, update, delete on all tables in schema kost to authenticated;
grant select on kost.rooms, kost.content to anon;
revoke insert, update, delete on kost.activity_log from authenticated;

do $$
declare t text;
begin
  foreach t in array array['admins', 'settings', 'rooms', 'tenants', 'leases', 'invoices', 'payments',
                           'utility_bills', 'tickets', 'expenses', 'leads', 'content', 'activity_log']
  loop
    execute format('alter table kost.%I enable row level security', t);
    execute format('create policy admin_all on kost.%I for all to authenticated
                    using (kost.is_admin()) with check (kost.is_admin())', t);
  end loop;
end $$;

-- Pengunjung situs: hanya kamar dan konten.
create policy public_read on kost.rooms for select to anon using (true);
create policy public_read on kost.content for select to anon using (true);

-- ── Penyimpanan berkas ──────────────────────────────────────────────────────

-- kost-private: KTP, bukti bayar, foto keluhan. kost-public: foto galeri situs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('kost-private', 'kost-private', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']),
  ('kost-public', 'kost-public', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy kost_admin_all on storage.objects for all to authenticated
  using (bucket_id in ('kost-private', 'kost-public') and kost.is_admin())
  with check (bucket_id in ('kost-private', 'kost-public') and kost.is_admin());

-- Penghapusan data pribadi penghuni yang sudah lama keluar (UU PDP: simpan seperlunya).
-- Nama diganti inisial, kontak dan KTP dihapus; riwayat sewa & keuangan tetap utuh.
-- Mengembalikan path KTP lama supaya aplikasi bisa menghapus berkasnya dari storage.
create or replace function kost.anonymize_old_tenants() returns table (tenant_id uuid, old_ktp_path text)
language plpgsql security invoker set search_path = '' as $$
declare months integer;
begin
  if not kost.is_admin() then raise exception 'bukan admin'; end if;
  select s.retention_months into months from kost.settings s;
  return query
  with targets as (
    select t.id, t.ktp_path from kost.tenants t
    where t.status = 'keluar' and t.anonymized_at is null
      and not exists (
        select 1 from kost.leases l where l.tenant_id = t.id
          and (l.status = 'aktif' or coalesce(l.ended_on, l.end_date) > current_date - make_interval(months => months))
      )
    for update
  )
  update kost.tenants t set
    name = upper(left(t.name, 1)) || '.',
    phone = null, origin = null, emergency_name = null, emergency_relation = null,
    emergency_phone = null, notes = null, ktp_path = null, anonymized_at = now()
  from targets
  where t.id = targets.id
  returning t.id, targets.ktp_path;
end $$;
