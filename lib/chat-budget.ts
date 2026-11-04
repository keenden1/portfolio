import "server-only";
import { createClient } from "@supabase/supabase-js";
import { defaultChatRules } from "@/lib/chat-rules";

export function createChatBudget() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(4000) }) },
  });
  return {
    async getPortfolioContext() {
      const results = await Promise.all([
        supabase.from("site_settings").select("content").eq("id", 1).single(),
        supabase.from("projects").select("title, description, tech").eq("published", true).order("sort_order").limit(30),
        supabase.from("skills").select("label").eq("published", true).order("sort_order").limit(50),
        supabase.from("experiences").select("role, company, period").eq("published", true).order("sort_order").limit(20),
      ]);
      if (results.some((result) => result.error)) throw new Error("portfolio_context_unavailable");
      const content = results[0].data?.content ?? {};
      const field = (value: unknown, max = 1000) => typeof value === "string" ? value.slice(0, max) : "";
      return {
        settings: { display_name: field(content.display_name), hero_description: field(content.hero_description), availability: field(content.availability), email: field(content.email) },
        projects: (results[1].data ?? []).map((item) => ({ title: field(item.title), desc: field(item.description), tech: Array.isArray(item.tech) ? item.tech.slice(0, 20).map((value) => field(value, 100)) : [] })),
        skills: (results[2].data ?? []).map((item) => ({ label: field(item.label, 100) })),
        experiences: (results[3].data ?? []).map((item) => ({ role: field(item.role), company: field(item.company), period: field(item.period) })),
      };
    },
    async getRules(): Promise<string> {
      const { data, error } = await supabase.from("chat_config").select("assistant_rules").eq("id", 1).single();
      if (error || !data) throw new Error("chat_rules_unavailable");
      return (typeof data.assistant_rules === "string" ? data.assistant_rules.trim().slice(0, 4000) : "") || defaultChatRules;
    },
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
