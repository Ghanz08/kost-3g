-- Operasional lanjutan: sumber calon penyewa, form "kabari saya" dari situs, alasan keluar,
-- teguran, dan tanda "jangan terima lagi".

-- ── Calon penyewa: dari mana tahu Kost 3g ───────────────────────────────────
alter table kost.leads
  add column source text not null default 'lainnya'
    check (source in ('situs', 'form-situs', 'google-maps', 'instagram', 'tiktok', 'teman', 'spanduk', 'lainnya'));

-- Form publik "kabari saya kalau ada kamar kosong". Anon tidak bisa menulis ke tabel langsung;
-- hanya lewat fungsi ini yang memvalidasi isi, menolak nomor yang sama dalam 24 jam, dan membatasi 30 kiriman per hari.
create or replace function kost.submit_interest(p_name text, p_phone text, p_interest text default null)
returns text language plpgsql security definer set search_path = '' as $$
declare
  digits text := coalesce(kost.norm_phone(p_phone), '');
begin
  if length(trim(coalesce(p_name, ''))) not between 2 and 80 then return 'nama'; end if;
  if length(digits) not between 9 and 15 then return 'nomor'; end if;
  if exists (select 1 from kost.leads where kost.norm_phone(phone) = digits
             and created_at > now() - interval '24 hours') then return 'ok'; end if; -- diam-diam abaikan duplikat
  if (select count(*) from kost.leads where source = 'form-situs' and created_at > now() - interval '24 hours') >= 30 then
    return 'penuh';
  end if;
  insert into kost.leads (name, phone, interest, source, notes)
  values (left(trim(p_name), 80), digits, left(nullif(trim(coalesce(p_interest, '')), ''), 200), 'form-situs',
          'Dari form "Kabari saya" di situs');
  return 'ok';
end $$;
revoke all on function kost.submit_interest(text, text, text) from public;
grant execute on function kost.submit_interest(text, text, text) to anon, authenticated;

-- ── Sewa: alasan berakhir ───────────────────────────────────────────────────
alter table kost.leases
  add column end_reason text check (end_reason in ('selesai-kontrak', 'keluar-sendiri', 'dikeluarkan', 'pindah-kamar')),
  add column end_note text;

-- ── Penghuni: jangan terima lagi ────────────────────────────────────────────
-- Nomor HP dinormalisasi ke 62xxx supaya "0812…" dan "+62 812…" dianggap sama.
create or replace function kost.norm_phone(p text) returns text
language sql immutable set search_path = '' as $$
  select case
    when d = '' then null
    when d like '0%' then '62' || substr(d, 2)
    else d
  end from (select regexp_replace(coalesce(p, ''), '\D', '', 'g') as d) x
$$;

-- Hash nomor disimpan untuk penghuni bertanda, supaya tetap bisa dikenali setelah data pribadinya dianonimkan.
create or replace function kost.phone_hash(p text) returns text
language sql immutable set search_path = '' as $$
  select encode(extensions.digest(kost.norm_phone(p), 'sha256'), 'hex') where kost.norm_phone(p) is not null
$$;

alter table kost.tenants
  add column do_not_rent boolean not null default false,
  add column do_not_rent_reason text,
  add column do_not_rent_phone_hash text;

-- Calon penyewa/penghuni yang nomornya cocok dengan penghuni bertanda "jangan terima lagi".
create or replace function kost.flagged_phone(p text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from kost.tenants t where t.do_not_rent and t.do_not_rent_phone_hash = kost.phone_hash(p))
$$;
grant execute on function kost.flagged_phone(text) to authenticated;

create or replace function kost.sync_phone_hash() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.do_not_rent then
    new.do_not_rent_phone_hash := coalesce(kost.phone_hash(new.phone), old.do_not_rent_phone_hash);
  else
    new.do_not_rent_phone_hash := null;
  end if;
  return new;
end $$;
create trigger sync_phone_hash before insert or update of do_not_rent, phone on kost.tenants
  for each row execute function kost.sync_phone_hash();

-- ── Teguran / pelanggaran tata tertib ───────────────────────────────────────
create table kost.violations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references kost.tenants (id) on delete cascade,
  occurred_on date not null default current_date,
  level text not null default 'lisan' check (level in ('lisan', 'tertulis', 'terakhir')),
  rule text not null, -- aturan yang dilanggar (dari tata tertib)
  description text,
  photo_path text,
  created_by text default kost.current_email(),
  created_at timestamptz not null default now()
);
create index violations_tenant on kost.violations (tenant_id, occurred_on desc);

alter table kost.violations enable row level security;
create policy admin_all on kost.violations for all to authenticated using (kost.is_admin()) with check (kost.is_admin());
grant select, insert, update, delete on kost.violations to authenticated;
create trigger log_change after insert or update or delete on kost.violations
  for each row execute function kost.log_change();

-- Anonimisasi juga menghapus isi teguran (tetap tercatat jumlahnya).
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
  ), cleared as (
    update kost.violations v set description = null, photo_path = null
    from targets where v.tenant_id = targets.id
  )
  update kost.tenants t set
    name = upper(left(t.name, 1)) || '.',
    phone = null, origin = null, emergency_name = null, emergency_relation = null,
    emergency_phone = null, notes = null, ktp_path = null, do_not_rent_reason = null, anonymized_at = now()
  from targets
  where t.id = targets.id
  returning t.id, targets.ktp_path;
end $$;
