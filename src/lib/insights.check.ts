// Pemeriksaan cepat hitungan grafik: pnpm test
import assert from "node:assert/strict";
import { computeInsights } from "./insights";

const r = computeInsights(
  {
    rooms: [1, 2],
    leases: [
      { room_number: 1, start_date: "2026-01-01", ended_on: "2026-10-31", status: "selesai", end_reason: "keluar-sendiri", tenants: { name: "A" } },
      { room_number: 1, start_date: "2026-11-11", ended_on: null, status: "aktif", end_reason: null, tenants: { name: "B" } },
    ],
    payments: [{ amount: 900_000, date: "2026-11-05" }],
    expenses: [{ amount: 100_000, date: "2026-11-06" }],
    invoices: [
      { period: "2026-11-01", due_date: "2026-11-05", total: 900_000, paid: 900_000 },
      { period: "2026-10-01", due_date: "2026-08-01", total: 500_000, paid: 100_000 },
    ],
    utilities: [{ period: "2026-11-01", per_tenant: 50_000 }, { period: "2026-11-01", per_tenant: 20_000 }],
  },
  "2026-11-20",
);
const nov = r.monthly.at(-1)!;
assert.equal(r.monthly.length, 12);
assert.equal(nov.period, "2026-11-01");
assert.equal(nov.occupancy, 10 / 40); // kamar 1 terisi 11–20 Nov = 10 dari 2×20 hari-kamar
assert.equal(nov.net, 800_000);
assert.equal(nov.collection, 1);
assert.equal(nov.utilityPerTenant, 70_000);
assert.equal(r.kpi.daysToFill, 11);
assert.equal(r.kpi.moveOuts, 1);
assert.equal(r.aging[3].amount, 400_000); // 111 hari telat
assert.equal(r.timeline[0].segments.length, 2);
console.log("insights OK");
