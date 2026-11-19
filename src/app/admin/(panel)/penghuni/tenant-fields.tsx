import { Field, FieldGroup, TextArea } from "@/components/admin/fields";

type Tenant = {
  name?: string | null;
  phone?: string | null;
  origin?: string | null;
  emergency_name?: string | null;
  emergency_relation?: string | null;
  emergency_phone?: string | null;
  notes?: string | null;
};

/** Isian profil penghuni, dipakai di form tambah dan form ubah. */
export function TenantFields({ t = {} }: { t?: Tenant }) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Nama lengkap" name="name" required autoComplete="off" defaultValue={t.name ?? ""} />
      <Field label="No. WhatsApp" name="phone" type="tel" inputMode="tel" placeholder="0812…" defaultValue={t.phone ?? ""} hint="Dipakai untuk tombol chat dan pengingat tagihan." />
      <Field label="Kampus / pekerjaan" name="origin" defaultValue={t.origin ?? ""} />
      <FieldGroup legend="Kontak darurat">
        <Field label="Nama" name="emergency_name" defaultValue={t.emergency_name ?? ""} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hubungan" name="emergency_relation" placeholder="Ibu, kakak, …" defaultValue={t.emergency_relation ?? ""} />
          <Field label="No. HP" name="emergency_phone" type="tel" inputMode="tel" defaultValue={t.emergency_phone ?? ""} />
        </div>
      </FieldGroup>
      <TextArea label="Catatan" name="notes" defaultValue={t.notes ?? ""} />
    </div>
  );
}
