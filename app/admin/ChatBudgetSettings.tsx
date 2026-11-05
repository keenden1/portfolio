"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { defaultChatRules } from "@/lib/chat-rules";
import { chatModelOptions, defaultChatModels, validChatModels, normalizeChatModels } from "@/lib/chat-models";

type Budget = { enabled: boolean; limit: number; used: number; reserved: number; day: string };

export default function ChatBudgetSettings() {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [limit, setLimit] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [rules, setRules] = useState(defaultChatRules);
  const [savedRules, setSavedRules] = useState("");
  const [models, setModels] = useState<string[]>(defaultChatModels);
  const [savedModels, setSavedModels] = useState<string[]>(defaultChatModels);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function load(replaceInput = true) {
    const supabase = createClient();
    const [{ data, error }, rulesResult] = await Promise.all([
      supabase.rpc("chat_budget_status"),
      supabase.from("chat_config").select("assistant_rules, model_order").eq("id", 1).single(),
    ]);
    if (error || !data) throw new Error("Unable to load the chatbot budget. Apply the chat token budget migration and confirm your admin access.");
    if (rulesResult.error || !rulesResult.data) throw new Error("Unable to load chatbot configuration. Apply the chatbot rules and model-order migrations and confirm your admin access.");
    setBudget(data);
    const activeRules = rulesResult.data.assistant_rules?.trim() || defaultChatRules;
    setSavedRules(activeRules);
    const activeModels = normalizeChatModels(rulesResult.data.model_order);
    setSavedModels(activeModels);
    if (replaceInput) setModels([activeModels[0], ...chatModelOptions.filter((option) => option.id !== activeModels[0] && activeModels.includes(option.id)).map((option) => option.id)]);
    if (replaceInput) { setLimit(String(data.limit)); setEnabled(data.enabled); setRules(activeRules); }
  }

  useEffect(() => { load().catch((error) => setMessage(error.message)); }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    const value = Number(limit);
    if (!limit.trim() || !Number.isSafeInteger(value) || value < 0 || value > 10000000) {
      setMessage("Enter a whole number from 0 to 10,000,000."); return;
    }
    if (rules.length > 4000) { setMessage("Keep chatbot rules within 4,000 characters."); return; }
    if (!validChatModels(models)) { setMessage("Choose one or two different models."); return; }
    setBusy(true); setMessage("");
    try {
      const { data, error } = await createClient().from("chat_config").update({ daily_token_limit: value, gemini_enabled: enabled, assistant_rules: rules.trim(), model_order: models }).eq("id", 1).select("daily_token_limit").single();
      if (error || !data) throw new Error("Unable to save chatbot settings. Check your admin access and try again.");
      await load();
      setMessage(enabled ? "Chatbot settings and rules saved. They apply to new Gemini replies immediately." : "Settings and rules saved. Gemini is off; new messages use local replies only.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save."); }
    finally { setBusy(false); }
  }

  return <section className="cms-panel mt-6">
    <div className="cms-panel-heading"><h2>Chatbot daily token budget</h2><button type="button" className="cms-button cms-button-secondary" disabled={busy} onClick={async () => { setBusy(true); setMessage(""); try { await load(false); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to refresh."); } finally { setBusy(false); } }}>Refresh usage</button></div>
    <form className="p-6 space-y-4" onSubmit={save}>
      <div className="flex items-center gap-3"><button type="button" role="switch" aria-checked={enabled} aria-label="Enable Gemini" disabled={!budget || busy} onClick={() => setEnabled((value) => !value)} className={`relative h-7 w-12 rounded-full transition-colors disabled:opacity-50 ${enabled ? "bg-violet-600" : "bg-zinc-500"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${enabled ? "left-1 translate-x-5" : "left-1"}`} /></button><span>Gemini {enabled ? "on" : "off — local replies only"}</span></div>
      <p className="text-sm text-zinc-400">Shared across all visitors. Resets daily at midnight Asia/Singapore (UTC+8). When Gemini fails or the budget cannot cover a reply, the assistant uses local answers.</p>
      <fieldset className="space-y-3" disabled={!budget || busy}>
        <legend className="font-semibold">Gemini models</legend>
        <label className="block space-y-1"><span className="text-sm">Primary model</span><select className="block w-full rounded-xl bg-white/10 px-4 py-3" value={models[0]} onChange={(event) => {
          const primary = event.target.value;
          setModels((current) => [primary, ...chatModelOptions.filter((option) => option.id !== primary && current.includes(option.id)).map((option) => option.id)]);
        }}>{chatModelOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
        <p className="text-sm text-zinc-400">Try the primary model first, then checked fallback models from top to bottom. Unchecked models are skipped. Uncheck all fallbacks to use local replies when the primary fails. All models share your daily budget.</p>
        <div className="space-y-2" role="group" aria-label="Fallback models">
          {chatModelOptions.filter((option) => option.id !== models[0]).map((option) => <label key={option.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 px-4 py-3">
            <input type="checkbox" className="h-4 w-4 accent-violet-600" checked={models.includes(option.id)} onChange={(event) => {
              const checked = event.target.checked;
              setModels((current) => [current[0], ...chatModelOptions.filter((candidate) => candidate.id !== current[0] && (candidate.id === option.id ? checked : current.includes(candidate.id))).map((candidate) => candidate.id)]);
            }} />
            <span>{option.label}</span>
          </label>)}
        </div>
      </fieldset>
      {budget && <dl className="grid gap-4 sm:grid-cols-3">
        <div><dt className="text-sm text-zinc-400">Used today ({budget.day})</dt><dd className="text-xl font-semibold">{budget.used.toLocaleString()} tokens</dd></div>
        <div><dt className="text-sm text-zinc-400">Reserved / unconfirmed</dt><dd className="text-xl font-semibold">{budget.reserved.toLocaleString()} tokens</dd></div>
        <div><dt className="text-sm text-zinc-400">Available</dt><dd className="text-xl font-semibold">{Math.max(0, budget.limit - budget.used - budget.reserved).toLocaleString()} tokens</dd></div>
      </dl>}
      <label className="block space-y-2"><span>Daily Gemini token limit</span><input className="block w-full max-w-sm rounded-xl bg-white/10 px-4 py-3" type="number" min="0" max="10000000" step="1" required disabled={!budget || busy} value={limit} onChange={(event) => setLimit(event.target.value)} aria-describedby="chat-budget-help" /></label>
      <p id="chat-budget-help" className="text-sm text-zinc-400">0 means local-only. Counts input, output, and thinking tokens. Each attempt reserves its input tokens plus up to 1,024 output tokens before generation. Unconfirmed usage stays reserved until the next day; lowering the limit does not cancel replies already in progress.</p>
      <label className="block space-y-2"><span>Chatbot rules</span><textarea className="block w-full rounded-xl bg-white/10 px-4 py-3" rows={8} maxLength={4000} disabled={!budget || busy} value={rules} onChange={(event) => setRules(event.target.value)} aria-describedby="chat-rules-help" placeholder={"Examples:\nUse a friendly, professional tone.\nReply in the visitor’s language.\nAsk what kind of project they need before recommending my work.\nDirect pricing inquiries to the contact form."} /></label>
      <div id="chat-rules-help" className="text-sm text-zinc-400"><p>Guides Gemini’s tone, language, and responses. Leave blank to use the default portfolio assistant rules. Local fallback uses fixed portfolio answers and does not interpret these instructions. The assistant still uses portfolio facts and cannot perform actions.</p><p className="mt-2">{rules.length.toLocaleString()} / 4,000 characters</p></div>
      <button className="cms-button cms-button-secondary" type="button" disabled={!budget || busy || rules === defaultChatRules} onClick={() => setRules(defaultChatRules)}>Use default rules</button>
      <button className="cms-button cms-button-primary" type="submit" disabled={!budget || busy || (limit === String(budget.limit) && enabled === budget.enabled && rules === savedRules && JSON.stringify(models) === JSON.stringify(savedModels))}>{busy ? "Saving…" : "Save chatbot settings"}</button>
      {message && <p role="status" className="cms-notice">{message}</p>}
    </form>
  </section>;
}
