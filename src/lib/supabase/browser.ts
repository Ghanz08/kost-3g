import { createBrowserClient } from "@supabase/ssr";
import { authCookie } from "./cookie";

/** Klien di browser, hanya untuk memulai login Google. */
export const createClient = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookieOptions: authCookie,
  });
