import { NextResponse } from "next/server";
import { siteOrigin } from "@/lib/supabase/cookie";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/admin/masuk", siteOrigin(request.url)), { status: 303 });
}
