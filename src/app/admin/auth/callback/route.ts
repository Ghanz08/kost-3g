import { NextResponse } from "next/server";
import { siteOrigin } from "@/lib/supabase/cookie";
import { createClient } from "@/lib/supabase/server";

/** Google → Supabase → ke sini dengan ?code. Tukar jadi sesi, lalu tolak email yang tidak terdaftar. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const to = (path: string) => NextResponse.redirect(new URL(path, siteOrigin(url.origin)));
  if (!code) return to("/admin/masuk?galat=gagal-masuk");

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback] exchangeCodeForSession gagal:", error.message);
    return to("/admin/masuk?galat=gagal-masuk");
  }

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    await supabase.auth.signOut();
    return to("/admin/masuk?galat=tidak-terdaftar");
  }
  return to("/admin");
}
