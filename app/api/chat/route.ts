import { geminiReply, suspiciousChatInput } from "@/lib/gemini-chat";
import { createChatBudget } from "@/lib/chat-budget";

export const runtime = "nodejs";

// Best-effort instance limit; provider quotas remain the deployment-wide limit.
let windowStart = Date.now();
let requests = 0;

export async function POST(request: Request) {
  let reason = "request_error";
  const errorResponse = () => {
    return Response.json({ source: "local", ...(process.env.NODE_ENV === "development" ? { reason } : {}) }, { headers: { "Cache-Control": "no-store" } });
  };
  if (!process.env.GEMINI_API_KEY) { reason = "missing_api_key"; return errorResponse(); }
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return new Response(null, { status: 403 });
  if (Date.now() - windowStart > 60000) { windowStart = Date.now(); requests = 0; }
  if (++requests > 30) { reason = "local_rate_limit"; return errorResponse(); }

  try {
    // Bound the body before decoding or forwarding visitor-provided data.
    const reader = request.body?.getReader();
    if (!reader) return new Response(null, { status: 400 });
    const decoder = new TextDecoder();
    let raw = "";
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 40000) { await reader.cancel(); return new Response(null, { status: 413 }); }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
    const body = JSON.parse(raw);
    if (!body || typeof body.question !== "string" || !body.question.trim() || body.question.length > 500) return new Response(null, { status: 400 });
    if (suspiciousChatInput(body.question)) { reason = "input_safety_check"; return errorResponse(); }
    // The browser cannot assert what the assistant previously said or supply portfolio facts.
    const history = Array.isArray(body.history) ? body.history.slice(-8).filter((item: { role?: unknown; text?: unknown } | null) => item && item.role === "user" && typeof item.text === "string" && !suspiciousChatInput(item.text)).map((item: { text: string }) => ({ role: "user" as const, text: item.text.slice(0, 500) })) : [];
    const budget = createChatBudget();
    if (!budget) { reason = "budget_not_configured"; return errorResponse(); }
    // Only persisted admin rules are trusted; ignore any visitor-supplied rules.
    let rules: string;
    try { rules = await budget.getRules(); }
    catch { reason = "chat_rules_unavailable"; return errorResponse(); }
    let context;
    try { context = await budget.getPortfolioContext(); }
    catch { reason = "portfolio_context_unavailable"; return errorResponse(); }
    const text = await geminiReply(body.question.trim(), context, history, {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || "gemini-flash-latest",
      onFailure: (failure) => { reason = failure; console.warn(`[portfolio-chat] Gemini error: ${failure}`); },
      budget,
      rules,
      sensitiveValues: [process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""],
    });
    return text ? Response.json({ text, source: "gemini" }, { headers: { "Cache-Control": "no-store" } }) : errorResponse();
  } catch {
    return errorResponse();
  }
}
