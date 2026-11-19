import { ShieldCheck, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import { ActionForm, FormActions, Submit } from "@/components/admin/action-form";
import { ConfirmAction } from "@/components/admin/confirm";
import { Dialog } from "@/components/admin/dialog";
import { Field } from "@/components/admin/fields";
import { Badge, Card, PageHeader, Table, Td, Tr } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { tgl } from "@/lib/format";
import { addAdmin, removeAdmin } from "./actions";

export const metadata: Metadata = { title: "Akses admin" };

export default async function AksesPage() {
  const { supabase, email: me } = await requireAdmin();
  const { data: admins } = await supabase.from("admins").select("*").order("created_at");

  return (
    <>
      <PageHeader title="Akses admin" description="Hanya akun Google di daftar ini yang bisa masuk. Semua admin punya akses yang sama.">
        <Dialog trigger="Tambah admin" title="Tambah admin" description="Orang ini bisa langsung masuk dengan akun Google tersebut." icon={<UserPlus aria-hidden className="size-4" />}>
          <ActionForm action={addAdmin} className="flex flex-col gap-4">
            <Field label="Email Google" name="email" type="email" required autoComplete="off" placeholder="nama@gmail.com" />
            <Field label="Nama" name="name" hint="Opsional, untuk mengenali di daftar." />
            <FormActions>
              <Submit>Beri akses</Submit>
            </FormActions>
          </ActionForm>
        </Dialog>
      </PageHeader>

      <Card>
        <Table caption="Daftar admin" head={["Email", "Nama", "Ditambahkan", ""]}>
          {admins?.map((a) => (
            <Tr key={a.email}>
              <Td>
                <span className="inline-flex items-center gap-2 font-semibold text-navy-700">
                  <ShieldCheck aria-hidden className="size-4 text-brand-500" />
                  {a.email}
                </span>
              </Td>
              <Td label="Nama">{a.name ?? "–"}</Td>
              <Td label="Ditambahkan">
                {tgl(a.created_at)}
                {a.added_by && a.added_by !== "setup" && <span className="block text-sm text-subtle">oleh {a.added_by}</span>}
              </Td>
              <Td className="md:text-right">
                {a.email === me ? (
                  <Badge value="aktif" label="Kamu" />
                ) : (
                  <ConfirmAction
                    action={removeAdmin}
                    fields={{ email: a.email }}
                    label={`Cabut akses`}
                    title={`Cabut akses ${a.email}?`}
                    message="Orang ini tidak bisa masuk ke admin lagi. Bisa ditambahkan kembali kapan saja."
                    confirmLabel="Ya, cabut"
                    compact
                  />
                )}
              </Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
