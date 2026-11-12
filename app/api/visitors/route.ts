import { createClient } from "@supabase/supabase-js";
import { visitorHash } from "@/lib/visitor-identity";
import { createClient as createSessionClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const origin = request.headers.get("origin");
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get("sec-fetch-site") === "cross-site") {
    return new Response(null, { status: 403, headers });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const secret = process.env.VISITOR_HASH_SECRET || key;
  // Vercel overwrites x-forwarded-for. Other hosts must explicitly configure
  // a trusted, sanitized header rather than accepting arbitrary client IPs.
  const ipHeader = process.env.VERCEL ? "x-forwarded-for" : process.env.VISITOR_IP_HEADER;
  if (!url || !key || !secret || !ipHeader) return new Response(null, { status: 503, headers });
  const hash = visitorHash(request.headers, secret, ipHeader);
  if (!hash) return new Response(null, { status: 204, headers });
  try {
    const session = await createSessionClient();
    const { data: { user }, error: authError } = await session.auth.getUser();
    if (authError && authError.name !== "AuthSessionMissingError") throw authError;
    if (user) {
      const { data: isAdmin, error: adminError } = await session.rpc("is_admin");
      if (adminError) throw adminError;
      if (isAdmin === true) return new Response(null, { status: 204, headers });
    }
    const db = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(4000) }) },
    });
    // A primary key and ON CONFLICT DO NOTHING deduplicate concurrent requests.
    const { error } = await db.from("site_visitors").upsert({ ip_hash: hash }, { onConflict: "ip_hash", ignoreDuplicates: true });
    if (error) throw error;
    return new Response(null, { status: 204, headers });
  } catch {
    console.warn("[visitors] Unable to record visit");
    return new Response(null, { status: 503, headers });
  }
}
