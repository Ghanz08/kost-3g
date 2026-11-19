import { History } from "lucide-react";
import type { Metadata } from "next";
import { Card, EmptyState, PageHeader, Table, Td, Tr } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { jam } from "@/lib/format";

export const metadata: Metadata = { title: "Log aktivitas" };

const entityLabel: Record<string, string> = {
  admins: "Akses admin", settings: "Pengaturan", rooms: "Kamar", tenants: "Penghuni", leases: "Sewa", invoices: "Tagihan",
  payments: "Pembayaran", utility_bills: "Listrik/air", tickets: "Keluhan", expenses: "Pengeluaran", leads: "Calon penyewa", content: "Konten",
};
const actionLabel: Record<string, string> = { insert: "Menambah", update: "Mengubah", delete: "Menghapus", "lihat ktp": "Membuka KTP" };

export default async function LogPage() {
  const { supabase } = await requireAdmin();
  const { data: logs } = await supabase.from("activity_log").select("*").order("at", { ascending: false }).limit(300);

  return (
    <>
      <PageHeader title="Log aktivitas" description="300 perubahan terakhir. Isi data pribadi tidak disalin ke log, hanya nama kolom yang berubah." />
      <Card>
        {logs?.length ? (
          <Table caption="Log aktivitas" head={["Waktu", "Siapa", "Aksi", "Data", "Kolom berubah"]}>
            {logs.map((l) => (
              <Tr key={l.id}>
                <Td className="whitespace-nowrap tabular-nums">{jam(l.at)}</Td>
                <Td label="Siapa" className="break-all">{l.actor ?? "Sistem"}</Td>
                <Td label="Aksi" className={l.action === "lihat ktp" ? "font-semibold text-accent-700" : undefined}>
                  {actionLabel[l.action] ?? l.action}
                </Td>
                <Td label="Data">{entityLabel[l.entity] ?? l.entity}</Td>
                <Td label="Kolom berubah" className="text-sm text-subtle">
                  {(l.detail as { fields?: string[] } | null)?.fields?.join(", ") ?? "–"}
                </Td>
              </Tr>
            ))}
          </Table>
        ) : (
          <EmptyState icon={History} title="Belum ada aktivitas">
            Setiap perubahan data dan setiap kali KTP dibuka akan tercatat di sini.
          </EmptyState>
        )}
      </Card>
    </>
  );
}
