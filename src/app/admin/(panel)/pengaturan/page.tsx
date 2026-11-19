import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import { ActionForm, FormActions, Submit } from "@/components/admin/action-form";
import { ConfirmAction } from "@/components/admin/confirm";
import { Field, MoneyField } from "@/components/admin/fields";
import { Card, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { runRetention, saveSettings } from "./actions";

export const metadata: Metadata = { title: "Pengaturan" };

export default async function PengaturanPage() {
  const { supabase } = await requireAdmin();
  const { data: s } = await supabase.from("settings").select("*").single();

  return (
    <>
      <PageHeader title="Pengaturan" />
      <div className="grid max-w-4xl gap-6">
        <Card title="Tanggungan pemilik" description="Dikurangi dari total biaya sebelum dibagi rata ke penghuni di menu Tagihan.">
          <ActionForm action={saveSettings}>
            <div className="grid gap-4 sm:grid-cols-2">
              <MoneyField label="Air per bulan" name="owner_water_share" defaultValue={s?.owner_water_share} />
              <MoneyField label="Listrik per bulan" name="owner_electric_share" defaultValue={s?.owner_electric_share} />
            </div>
            <Field
              className="mt-4 sm:max-w-xs"
              label="Simpan data penghuni yang sudah keluar"
              name="retention_months"
              type="number"
              inputMode="numeric"
              min={1}
              max={120}
              required
              defaultValue={s?.retention_months}
              hint="Dalam bulan (1–120). Setelah itu data pribadi bisa dianonimkan."
            />
            <FormActions>
              <Submit>Simpan pengaturan</Submit>
            </FormActions>
          </ActionForm>
        </Card>

        <section aria-labelledby="pembersihan" className="rounded-2xl bg-surface p-5 ring-1 ring-red-200 md:p-6">
          <h2 id="pembersihan" className="flex items-center gap-2 font-display text-lg font-bold text-red-700">
            <ShieldAlert aria-hidden className="size-5" />
            Pembersihan data pribadi
          </h2>
          <p className="mt-1 mb-4 max-w-2xl text-sm text-subtle">
            Sesuai UU PDP, data pribadi disimpan hanya selama diperlukan. Penghuni yang keluar lebih dari {s?.retention_months} bulan lalu: nama
            jadi inisial, kontak dan foto KTP dihapus. Riwayat sewa dan keuangan tetap utuh.
          </p>
          <ConfirmAction
            action={runRetention}
            fields={{}}
            label="Jalankan pembersihan"
            title="Jalankan pembersihan sekarang?"
            message="Data pribadi penghuni lama dihapus permanen dan tidak bisa dikembalikan."
            confirmLabel="Ya, jalankan"
          />
        </section>
      </div>
    </>
  );
}
