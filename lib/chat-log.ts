import "server-only";
import { createClient } from "@supabase/supabase-js";

export async function saveChatExchange(exchange: { conversation_id: string; question: string; answer: string; source: string }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.warn("[portfolio-chat] Conversation storage is not configured"); return; }
  try {
    const db = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(4000) }) },
    });
    const { error } = await db.from("chat_conversations").insert(exchange);
    if (error) console.warn("[portfolio-chat] Conversation save failed:", error.code);
  } catch {
    console.warn("[portfolio-chat] Conversation save failed");
  }
}
