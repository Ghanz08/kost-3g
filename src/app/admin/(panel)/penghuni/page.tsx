import { Search, UserPlus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, FormActions, Submit } from "@/components/admin/action-form";
import { buttonClass } from "@/components/admin/button-class";
import { Dialog } from "@/components/admin/dialog";
import { Badge, Card, EmptyState, FilterTabs, PageHeader, Table, Td, Tr, WaLink } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { tgl, toE164 } from "@/lib/format";
import { createTenant } from "./actions";
import { TenantFields } from "./tenant-fields";

export const metadata: Metadata = { title: "Penghuni" };

const STATUSES = [
  ["aktif", "Aktif"],
  ["calon", "Calon"],
  ["keluar", "Sudah keluar"],
  ["semua", "Semua"],
] as const;

export default async function PenghuniPage({ searchParams }: PageProps<"/admin/penghuni">) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const status = (sp.status as string) || "aktif";
  const q = ((sp.q as string) ?? "").trim();

  const { data: everyone } = await supabase
    .from("tenants")
    .select("id, name, phone, origin, status, created_at, anonymized_at, do_not_rent, leases(room_number, status)")
    .order("name");
  const counts = Object.fromEntries(STATUSES.map(([v]) => [v, v === "semua" ? everyone?.length ?? 0 : everyone?.filter((t) => t.status === v).length ?? 0]));
  const tenants = (everyone ?? []).filter(
    (t) => (status === "semua" || t.status === status) && (!q || t.name.toLowerCase().includes(q.toLowerCase())),
  );
  const href = (s: string) => `/admin/penghuni?status=${s}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  const addButton = (
    <Dialog trigger="Tambah penghuni" title="Tambah penghuni" description="Bisa juga calon penghuni yang belum masuk." side icon={<UserPlus aria-hidden className="size-4" />}>
      <ActionForm action={createTenant}>
        <TenantFields />
        <FormActions>
          <Submit>Simpan penghuni</Submit>
        </FormActions>
      </ActionForm>
    </Dialog>
  );

  return (
    <>
      <PageHeader title="Penghuni" description="Data penghuni dan calon penghuni. Kamar diatur lewat menu Sewa.">
        {addButton}
      </PageHeader>

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <FilterTabs label="Saring menurut status" active={status} items={STATUSES.map(([v, l]) => ({ value: v, label: l, count: counts[v], href: href(v) }))} />
        <form role="search" className="flex gap-2 md:w-80">
          <input type="hidden" name="status" value={status} />
          <label htmlFor="cari-penghuni" className="sr-only">
            Cari nama penghuni
          </label>
          <input
            id="cari-penghuni"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Cari nama…"
            className="min-h-11 w-full rounded-xl border border-field bg-surface px-3 text-base hover:border-navy-700"
          />
          <button className={buttonClass("secondary")} aria-label="Cari">
            <Search aria-hidden className="size-4" />
          </button>
        </form>
      </div>

      <Card>
        {tenants.length ? (
          <Table caption="Daftar penghuni" head={["Nama", "Kamar", "Status", "Kampus / pekerjaan", "Kontak"]}>
            {tenants.map((t) => {
              const active = t.leases.find((l) => l.status === "aktif");
              return (
                <Tr key={t.id}>
                  <Td>
                    <Link href={`/admin/penghuni/${t.id}`} className="font-semibold text-brand-700 underline-offset-2 hover:underline">
                      {t.name}
                    </Link>
                    <p className="text-sm text-subtle">Dicatat {tgl(t.created_at)}</p>
                  </Td>
                  <Td label="Kamar">{active ? `Kamar ${active.room_number}` : "–"}</Td>
                  <Td label="Status">
                    <span className="flex flex-wrap gap-1.5">
                      <Badge value={t.status} />
                      {t.do_not_rent && <Badge value="telat" label="Jangan terima lagi" />}
                    </span>
                  </Td>
                  <Td label="Kampus / pekerjaan">{t.origin ?? "–"}</Td>
                  <Td label="Kontak">
                    <WaLink phone={toE164(t.phone)} message={`Halo ${t.name}, `}>
                      Chat
                    </WaLink>
                  </Td>
                </Tr>
              );
            })}
          </Table>
        ) : (
          <EmptyState icon={Users} title={q ? `Tidak ada yang bernama “${q}”` : "Belum ada penghuni di sini"} action={!q && addButton}>
            {q ? "Coba kata lain atau pilih status Semua." : "Tambahkan penghuni, lalu hubungkan ke kamar lewat menu Sewa."}
          </EmptyState>
        )}
      </Card>
    </>
  );
}
