import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createChatBudget() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(4000) }) },
  });
  return {
    async isEnabled(): Promise<boolean> {
      const { data, error } = await supabase.from("chat_config").select("gemini_enabled, daily_token_limit").eq("id", 1).single();
      if (error || !data) throw new Error("budget_storage_unavailable");
      return data.gemini_enabled && data.daily_token_limit > 0;
    },
    async reserve(amount: number): Promise<string | null> {
      const { data, error } = await supabase.rpc("reserve_chat_tokens", { amount });
      if (error) throw new Error("budget_storage_unavailable");
      return typeof data === "string" ? data : null;
    },
    async settle(reservation: string, actual: number) {
      const { error } = await supabase.rpc("settle_chat_tokens", { reservation_id: reservation, actual_tokens: actual });
      if (error) throw new Error("budget_storage_unavailable");
    },
  };
}
