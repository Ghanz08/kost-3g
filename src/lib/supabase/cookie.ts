/**
 * Nama cookie sesi, sama di browser, server, dan proxy. Tanpa ini Supabase menurunkan nama dari URL,
 * dan browser (supabase.ghanizulhusni.space) dengan server (127.0.0.1) akan membaca cookie yang berbeda.
 */
export const authCookie = { name: "sb-kost3g-auth" };

/** Asal situs publik untuk redirect. Di belakang Caddy, request.url berisi alamat internal container. */
export const siteOrigin = (fallback: string) => process.env.NEXT_PUBLIC_SITE_URL ?? fallback;
