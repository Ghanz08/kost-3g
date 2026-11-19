-- Mencatat akses ke berkas sensitif (mis. foto KTP dibuka). Admin tidak bisa menulis ke log langsung,
-- jadi lewat fungsi ini yang memeriksa admin dan mengisi nama aktor sendiri.
create or replace function kost.log_access(p_entity text, p_entity_id text, p_action text default 'lihat')
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not kost.is_admin() then raise exception 'bukan admin'; end if;
  insert into kost.activity_log (actor, action, entity, entity_id)
  values (kost.current_email(), p_action, p_entity, p_entity_id);
end $$;

grant execute on function kost.log_access(text, text, text) to authenticated;
grant execute on function kost.is_admin() to authenticated;
grant execute on function kost.anonymize_old_tenants() to authenticated;
