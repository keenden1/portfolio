import "server-only";
import { createClient } from "@supabase/supabase-js";

export async function readSiteSettings(): Promise<Record<string, string>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server settings unavailable");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(5000) }) } });
  const { data, error } = await db.from("site_settings").select("content").eq("id", 1).single();
  if (error || !data?.content) throw new Error("Unable to load settings");
  return data.content;
}
