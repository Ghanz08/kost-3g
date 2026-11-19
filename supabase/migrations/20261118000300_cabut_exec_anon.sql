-- Pengunjung (anon) hanya perlu submit_interest. Fungsi lain sudah menjaga diri (is_admin / RLS), ini lapisan kedua.
revoke execute on function
  kost.anonymize_old_tenants(), kost.flagged_phone(text), kost.phone_hash(text), kost.norm_phone(text),
  kost.log_access(text, text, text), kost.log_change(), kost.sync_phone_hash(), kost.touch_updated_at()
from public, anon;
grant execute on function kost.anonymize_old_tenants(), kost.flagged_phone(text), kost.log_access(text, text, text) to authenticated, service_role;
