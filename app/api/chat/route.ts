import { geminiReplyWithFallbacks, suspiciousChatInput } from "@/lib/gemini-chat";
import { createChatBudget } from "@/lib/chat-budget";
import { saveChatExchange } from "@/lib/chat-log";
import { shouldUseLocalReply } from "@/lib/portfolio-chat";

export const runtime = "nodejs";

// Best-effort instance limit; provider quotas remain the deployment-wide limit.
let windowStart = Date.now();
let requests = 0;

export async function POST(request: Request) {
  const deadline = AbortSignal.timeout(20000);
  let reason = "request_error";
  let exchange: Parameters<typeof saveChatExchange>[0] | undefined;
  const errorResponse = () => {
    return Response.json({ source: "local", ...(process.env.NODE_ENV === "development" ? { reason: deadline.aborted ? "chat_timeout" : reason } : {}) }, { headers: { "Cache-Control": "no-store" } });
  };
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return new Response(null, { status: 403 });
  if (Date.now() - windowStart > 60000) { windowStart = Date.now(); requests = 0; }
  const rateLimited = ++requests > 30;

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
    exchange = {
      conversation_id: typeof body.conversationId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.conversationId) ? body.conversationId : crypto.randomUUID(),
      question: body.question,
      // Browser-reported local fallback is recorded only; never used as model input.
      answer: typeof body.localAnswer === "string" ? body.localAnswer.slice(0, 20000) : "",
      source: "local",
    };
    if (shouldUseLocalReply(body.question)) { reason = "simple_request"; return errorResponse(); }
    if (rateLimited) { reason = "local_rate_limit"; return errorResponse(); }
    if (!process.env.GEMINI_API_KEY) { reason = "missing_api_key"; return errorResponse(); }
    if (suspiciousChatInput(body.question)) { reason = "input_safety_check"; return errorResponse(); }
    // The browser cannot assert what the assistant previously said or supply portfolio facts.
    const history = Array.isArray(body.history) ? body.history.slice(-8).filter((item: { role?: unknown; text?: unknown } | null) => item && item.role === "user" && typeof item.text === "string" && !suspiciousChatInput(item.text)).map((item: { text: string }) => ({ role: "user" as const, text: item.text.slice(0, 500) })) : [];
    const budget = createChatBudget(deadline);
    if (!budget) { reason = "budget_not_configured"; return errorResponse(); }
    // Only persisted admin rules are trusted; ignore any visitor-supplied rules.
    const [rulesResult, contextResult, modelsResult] = await Promise.allSettled([budget.getRules(), budget.getPortfolioContext(), budget.getModels()]);
    if (rulesResult.status === "rejected") { reason = "chat_rules_unavailable"; return errorResponse(); }
    if (contextResult.status === "rejected") { reason = "portfolio_context_unavailable"; return errorResponse(); }
    if (modelsResult.status === "rejected") { reason = "chat_models_unavailable"; return errorResponse(); }
    const rules = rulesResult.value;
    const context = contextResult.value;
    const reply = await geminiReplyWithFallbacks(body.question.trim(), context, history, modelsResult.value, {
      apiKey: process.env.GEMINI_API_KEY,
      onFailure: (failure) => { reason = failure; console.warn(`[portfolio-chat] Gemini error: ${failure}`); },
      budget,
      rules,
      signal: deadline,
      sensitiveValues: [process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""],
    });
    if (reply) { exchange.answer = reply.text.slice(0, 20000); exchange.source = "gemini"; }
    return reply ? Response.json({ ...reply, source: "gemini" }, { headers: { "Cache-Control": "no-store" } }) : errorResponse();
  } catch {
    return errorResponse();
  } finally {
    if (exchange) await saveChatExchange(exchange);
  }
}
