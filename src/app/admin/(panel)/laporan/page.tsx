import type { Metadata } from "next";
import { Suspense } from "react";
import { FilterTabs, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { HunianReport, KeuanganReport, PemasaranReport } from "./sections";

export const metadata: Metadata = { title: "Laporan" };

const TABS = [
  ["hunian", "Hunian"],
  ["keuangan", "Keuangan"],
  ["situs", "Situs & calon"],
] as const;

export default async function LaporanPage({ searchParams }: PageProps<"/admin/laporan">) {
  await requireAdmin();
  const raw = (await searchParams).tab as string;
  const tab = TABS.some(([v]) => v === raw) ? raw : "hunian";
  return (
    <>
      <PageHeader title="Laporan" description="Tren 12 bulan untuk melihat pola, bukan untuk dicek tiap hari. Ringkasan harian ada di Dasbor." />
      <FilterTabs label="Jenis laporan" active={tab} items={TABS.map(([v, l]) => ({ value: v, label: l, href: `/admin/laporan?tab=${v}` }))} />
      <Suspense key={tab} fallback={<div aria-hidden className="h-72 animate-pulse rounded-2xl bg-surface ring-1 ring-line" />}>
        {tab === "hunian" ? <HunianReport /> : tab === "keuangan" ? <KeuanganReport /> : <PemasaranReport />}
      </Suspense>
    </>
  );
}
