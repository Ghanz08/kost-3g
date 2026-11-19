import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { authCookie, siteOrigin } from "@/lib/supabase/cookie";

/**
 * Hanya untuk /admin: menyegarkan sesi Supabase (cookie) dan mengarahkan yang belum login ke halaman masuk.
 * Pemeriksaan "apakah email ini admin" tetap dilakukan di server (requireAdmin) dan di RLS database.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: authCookie,
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list) {
          for (const { name, value } of list) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of list) response.cookies.set(name, value, options);
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const path = request.nextUrl.pathname;
  const isPublicAdminPath = path === "/admin/masuk" || path.startsWith("/admin/auth/");
  if (!data?.claims && !isPublicAdminPath) {
    return NextResponse.redirect(new URL("/admin/masuk", siteOrigin(request.nextUrl.origin)));
  }
  return response;
}

export const config = { matcher: ["/admin/:path*"] };
