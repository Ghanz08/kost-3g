import { ActionForm, FormActions, Submit } from "@/components/admin/action-form";
import { Check, Field, FieldGroup, Select, TextArea } from "@/components/admin/fields";
import { today } from "@/lib/format";
import { endLease } from "./actions";

/**
 * Form check-out, dipakai di halaman Sewa dan "Keluarkan penghuni" di halaman penghuni.
 * `expel` = alasan "Dikeluarkan" sudah terpilih dan teguran sebelumnya dirangkum.
 */
export function CheckoutForm({ leaseId, expel = false, violations = 0 }: { leaseId: string; expel?: boolean; violations?: number }) {
  return (
    <ActionForm action={endLease} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={leaseId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Alasan"
          name="end_reason"
          required
          defaultValue={expel ? "dikeluarkan" : "selesai-kontrak"}
          options={[
            ["selesai-kontrak", "Kontrak selesai"],
            ["keluar-sendiri", "Keluar atas kemauan sendiri"],
            ["dikeluarkan", "Dikeluarkan"],
          ]}
        />
        <Field label="Tanggal keluar" name="ended_on" type="date" defaultValue={today()} required />
      </div>
      {expel && (
        <p className="rounded-xl bg-paper px-3 py-2.5 text-sm text-navy-700">
          {violations ? `Tercatat ${violations} teguran sebelumnya untuk penghuni ini.` : "Belum ada teguran tercatat. Sebaiknya catat teguran dulu agar ada jejak yang adil."}
        </p>
      )}
      <TextArea label="Penjelasan" name="end_note" rows={3} hint="Wajib bila dikeluarkan: pelanggaran apa dan kapan." />
      <FieldGroup legend="Checklist check-out">
        <Check name="kunci_kembali" label="Kunci sudah dikembalikan" />
        <Check name="kamar_bersih" label="Kamar ditinggal bersih" />
        <Check name="tidak_ada_kerusakan" label="Tidak ada kerusakan" />
        <Check name="tagihan_lunas" label="Semua tagihan lunas" />
      </FieldGroup>
      <TextArea label="Catatan checklist" name="checklist_note" rows={2} />
      <Check
        name="do_not_rent"
        defaultChecked={expel}
        label="Tandai “jangan terima lagi”"
        hint="Muncul peringatan kalau orang ini (nama atau nomor WA yang sama) mendaftar lagi."
      />
      <FormActions>
        <Submit variant="danger" className="bg-red-700 text-white ring-0 hover:bg-red-800">
          Akhiri sewa
        </Submit>
      </FormActions>
    </ActionForm>
  );
}
