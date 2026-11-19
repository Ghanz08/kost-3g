import "server-only";

/** Data situs dari Umami di VPS (hanya untuk dasbor admin). Kembalikan null bila Umami tidak bisa dihubungi. */
const base = process.env.UMAMI_URL;
const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
let token: string | null = null;

async function login() {
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: process.env.UMAMI_USERNAME, password: process.env.UMAMI_PASSWORD }),
    cache: "no-store",
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`Umami login ${res.status}`);
  token = (await res.json()).token;
}

async function get<T>(path: string, params: Record<string, string | number>, retry = true): Promise<T> {
  if (!token) await login();
  const qs = new URLSearchParams(Object.entries({ timezone: "Asia/Jakarta", ...params }).map(([k, v]) => [k, String(v)]));
  const res = await fetch(`${base}/api/websites/${websiteId}${path}?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(4000),
  });
  if (res.status === 401 && retry) {
    token = null;
    return get(path, params, false);
  }
  if (!res.ok) throw new Error(`Umami ${path} ${res.status}`);
  return res.json();
}

type XY = { x: string; y: number };

export async function siteStats(days = 30) {
  if (!base || !websiteId) return null;
  const endAt = Date.now();
  const startAt = endAt - days * 86400e3;
  const range = { startAt, endAt };
  try {
    const [stats, daily, events, spots, referrers] = await Promise.all([
      get<{ pageviews: number; visitors: number; visits: number; bounces: number; comparison: { visitors: number } }>("/stats", range),
      get<{ sessions: XY[] }>("/pageviews", { ...range, unit: "day" }),
      get<XY[]>("/metrics", { ...range, type: "event" }),
      get<{ value: string; total: number }[]>("/event-data/values", { ...range, event: "wa-klik", propertyName: "lokasi" }),
      get<XY[]>("/metrics", { ...range, type: "referrer" }),
    ]);
    return {
      visitors: stats.visitors,
      visitorsBefore: stats.comparison?.visitors ?? null,
      pageviews: stats.pageviews,
      waClicks: events.find((e) => e.x === "wa-klik")?.y ?? 0,
      notifySent: events.find((e) => e.x === "kabari-terkirim")?.y ?? 0,
      daily: daily.sessions.map((d) => ({ date: d.x.slice(0, 10), visitors: d.y })),
      spots: spots.map((s) => ({ label: s.value, value: s.total })).sort((a, b) => b.value - a.value),
      referrers: referrers.slice(0, 6).map((r) => ({ label: r.x || "Langsung", value: r.y })),
    };
  } catch (e) {
    console.error("[umami]", e instanceof Error ? e.message : e);
    return null;
  }
}
