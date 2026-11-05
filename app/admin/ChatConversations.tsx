"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, RefreshCw, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Exchange = {
  id: string;
  conversation_id: string;
  created_at: string;
  question: string;
  answer: string;
  source: "local" | "gemini";
};
const pageSize = 100;
const date = (value: string) => new Date(value).toLocaleString("en-SG", { timeZone: "Asia/Singapore" });

export default function ChatConversations() {
  const [rows, setRows] = useState<Exchange[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const inFlight = useRef(false);

  async function load(older = false) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const db = createClient();
      const { data: isAdmin, error: accessError } = await db.rpc("is_admin");
      if (accessError || !isAdmin) throw new Error("Unable to read conversations. Confirm you are signed in with an admin account.");
      let query = db.from("chat_conversations")
        .select("id, conversation_id, created_at, question, answer, source")
        .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(pageSize);
      const cursor = older ? rows.at(-1) : undefined;
      if (cursor) query = query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
      const { data, error: queryError } = await query;
      if (queryError) throw new Error("Unable to load conversations. Check your connection and confirm the chat conversations migration has been applied.");
      const next = (data ?? []) as Exchange[];
      setRows((current) => older ? [...current, ...next] : next);
      setHasMore(next.length === pageSize);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to load conversations. Please try again.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const groups = new Map<string, Exchange[]>();
  for (const row of rows) {
    const group = groups.get(row.conversation_id) ?? [];
    group.push(row);
    groups.set(row.conversation_id, group);
  }
  const term = search.trim().toLowerCase();
  const visible = [...groups].filter(([id, exchanges]) => !term || id.includes(term) || exchanges.some((row) => `${row.question} ${row.answer}`.toLowerCase().includes(term)));

  return <section className="cms-panel cms-conversations" aria-label="Saved chat conversations" aria-busy={busy}>
    <div className="cms-panel-heading">
      <div><h2>Visitor chats</h2><p>{rows.length} loaded exchanges · Times in Singapore (UTC+8)</p></div>
      <button type="button" className="cms-button cms-button-secondary" disabled={busy} onClick={() => void load()}><RefreshCw size={16} />Refresh</button>
    </div>
    <div className="cms-list-toolbar">
      <label className="cms-search"><Search size={17} /><input aria-label="Search loaded conversations" placeholder="Search loaded conversations…" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      <span className="cms-chat-meta">{visible.length} matching sessions</span>
    </div>
    {error && <p role="alert" className="cms-notice">{error}</p>}
    {!busy && !error && !rows.length && <div className="cms-empty"><h3>No conversations yet</h3><p>Saved visitor questions and replies will appear here.</p></div>}
    {!busy && rows.length > 0 && !visible.length && <div className="cms-empty"><h3>No matching conversations</h3><p>Try another search or load older messages.</p></div>}
    <div className="cms-chat-sessions">{visible.map(([id, exchanges]) => <details key={id} className="cms-chat-session">
      <summary><strong>{exchanges[exchanges.length - 1].question}</strong><span className="cms-chat-meta">{exchanges.length} loaded exchanges · Latest {date(exchanges[0].created_at)}</span></summary>
      <div className="cms-chat-thread"><p className="cms-chat-meta">Session: {id}</p>{[...exchanges].reverse().map((row) => <article key={row.id} className="cms-chat-exchange">
        <time className="cms-chat-meta" dateTime={row.created_at}>{date(row.created_at)}</time>
        <div className="cms-chat-question"><h3>Visitor</h3><p>{row.question}</p></div>
        <div className="cms-chat-answer"><h3>Assistant <span className="cms-chat-meta">· {row.source === "gemini" ? "Gemini" : "Local reply"}</span></h3><p>{row.answer}</p></div>
      </article>)}</div>
    </details>)}</div>
    {busy && <div className="cms-loading" role="status"><LoaderCircle size={20} className="animate-spin" />Loading conversations…</div>}
    <div className="cms-panel-footer"><span>{hasMore ? "Older messages may belong to sessions shown above." : "All loaded messages are shown within their sessions."}</span>{hasMore && <button type="button" className="cms-button cms-button-secondary" disabled={busy} onClick={() => void load(true)}>Load older messages</button>}</div>
  </section>;
}
