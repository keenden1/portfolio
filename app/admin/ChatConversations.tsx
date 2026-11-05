"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Eye, LoaderCircle, RefreshCw, Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Session = { conversation_id: string; first_question: string; latest_at: string; exchange_count: number };
type Exchange = { id: string; created_at: string; question: string; answer: string; source: "local" | "gemini" };
const sessionPageSize = 20;
const messagePageSize = 30;
const date = (value: string) => new Date(value).toLocaleString("en-SG", { timeZone: "Asia/Singapore" });

function ConversationModal({ session, close }: { session: Session; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  return <dialog ref={dialog} className="cms-modal cms-chat-modal" aria-labelledby="chat-modal-title" onCancel={(event) => { event.preventDefault(); close(); }}>
    <header className="cms-chat-modal-header">
      <div><span className="cms-eyebrow">VISITOR CHAT</span><h2 id="chat-modal-title">Conversation messages</h2><p className="cms-chat-meta">{session.exchange_count} {Number(session.exchange_count) === 1 ? "exchange" : "exchanges"} · Times in Singapore (UTC+8)</p></div>
      <button type="button" autoFocus className="cms-icon-button" aria-label="Close conversation" onClick={close}><X size={20} /></button>
    </header>
    <ConversationThread id={session.conversation_id} />
  </dialog>;
}

function ConversationThread({ id }: { id: string }) {
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<Exchange[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setError("");
    setRows([]);
    async function load() {
      try {
        const { data, error: failure } = await createClient().from("chat_conversations")
          .select("id, created_at, question, answer, source").eq("conversation_id", id)
          .order("created_at", { ascending: false }).order("id", { ascending: false })
          .range(page * messagePageSize, (page + 1) * messagePageSize)
          .abortSignal(controller.signal);
        if (controller.signal.aborted) return;
        if (failure) throw failure;
        setHasMore((data?.length ?? 0) > messagePageSize);
        setRows(((data ?? []) as Exchange[]).slice(0, messagePageSize).reverse());
      } catch {
        if (!controller.signal.aborted) setError("Unable to load this conversation. Please try again.");
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [id, page, revision]);

  return <div className="cms-chat-thread" id={`chat-${id}`}>
    <p className="cms-chat-meta">Session: {id}</p>
    {busy ? <div className="cms-loading" role="status"><LoaderCircle size={20} className="animate-spin" />Loading messages…</div> : error ? <p role="alert" className="cms-notice">{error}<button type="button" className="cms-text-button" onClick={() => setRevision((value) => value + 1)}>Retry</button></p> : <>
      <p className="cms-chat-meta">{page === 0 ? "Latest messages" : `Older messages · Page ${page + 1}`} · Oldest to newest within this page</p>
      {!rows.length && <p>No messages on this page.</p>}
      {rows.map((row) => <article key={row.id} className="cms-chat-exchange">
        <time className="cms-chat-meta" dateTime={row.created_at}>{date(row.created_at)}</time>
        <div className="cms-chat-question"><h3>Visitor</h3><p>{row.question}</p></div>
        <div className="cms-chat-answer"><h3>Assistant <span className="cms-chat-meta">· {row.source === "gemini" ? "Gemini" : "Local reply"}</span></h3><p>{row.answer}</p></div>
      </article>)}
    </>}
    <nav className="cms-chat-pagination" aria-label="Conversation messages">
      <button type="button" className="cms-button cms-button-secondary" disabled={busy || page === 0} onClick={() => setPage((value) => value - 1)}>Newer messages</button>
      <span className="cms-chat-meta">Message page {page + 1}</span>
      <button type="button" className="cms-button cms-button-secondary" disabled={busy || !!error || !hasMore} onClick={() => setPage((value) => value + 1)}>Older messages</button>
    </nav>
  </div>;
}

export default function ChatConversations() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setError("");
    setSessions([]);
    setOpenId(null);
    async function load() {
      try {
        const { data, error: failure } = await createClient().rpc("admin_chat_sessions", { search_text: query, page_number: page }).abortSignal(controller.signal);
        if (controller.signal.aborted) return;
        if (failure) throw failure;
        setSessions(((data ?? []) as Session[]).slice(0, sessionPageSize));
        setHasMore((data?.length ?? 0) > sessionPageSize);
      } catch {
        if (!controller.signal.aborted) setError("Unable to load conversations. Check your connection, admin access, and that the chat session pagination migration has been applied.");
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [page, query, revision]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setPage(0);
    setQuery(search.trim());
    setRevision((value) => value + 1);
  }

  return <section className="cms-panel cms-conversations" aria-label="Saved chat conversations" aria-busy={busy}>
    <div className="cms-panel-heading">
      <div><h2>Visitor chats</h2><p>20 conversations per page · Times in Singapore (UTC+8)</p></div>
      <button type="button" className="cms-button cms-button-secondary" disabled={busy} onClick={() => { setPage(0); setRevision((value) => value + 1); }}><RefreshCw size={16} />Refresh</button>
    </div>
    <form className="cms-list-toolbar" onSubmit={submitSearch}>
      <label className="cms-search"><Search size={17} /><input aria-label="Search all conversations" placeholder="Search all conversations…" maxLength={500} value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      <button type="submit" className="cms-button cms-button-secondary" disabled={busy}>Search</button>
      {query && <button type="button" className="cms-text-button" disabled={busy} onClick={() => { setSearch(""); setQuery(""); setPage(0); }}>Clear search</button>}
      <span className="cms-chat-meta">Search questions, answers, or session IDs across all chats.</span>
    </form>
    {error && <p role="alert" className="cms-notice">{error}</p>}
    {busy && <div className="cms-loading" role="status"><LoaderCircle size={20} className="animate-spin" />Loading conversations…</div>}
    {!busy && !error && !sessions.length && <div className="cms-empty"><h3>{query ? "No matching conversations" : page ? "No conversations on this page" : "No conversations yet"}</h3><p>{query ? "Try a different search." : "Saved visitor questions and replies will appear here."}</p></div>}
    <div className="cms-chat-sessions">{sessions.map((session) => <section key={session.conversation_id} className="cms-chat-session cms-chat-session-row">
      <div className="cms-chat-session-info"><strong>{session.first_question}</strong><p className="cms-chat-meta">{session.exchange_count} {Number(session.exchange_count) === 1 ? "exchange" : "exchanges"} · Latest {date(session.latest_at)}</p></div>
      <button type="button" className="cms-button cms-button-secondary" aria-haspopup="dialog" aria-label={`View conversation: ${session.first_question}`} onClick={() => setOpenId(session.conversation_id)}><Eye size={16} />View</button>
    </section>)}</div>
    {sessions.filter((session) => session.conversation_id === openId).map((session) => <ConversationModal key={session.conversation_id} session={session} close={() => setOpenId(null)} />)}
    <nav className="cms-panel-footer cms-chat-pagination" aria-label="Conversation pages">
      <button type="button" className="cms-button cms-button-secondary" disabled={busy || page === 0} onClick={() => setPage((value) => value - 1)}>Previous</button>
      <span>Page {page + 1}{!busy && !error ? ` · ${sessions.length} conversations` : ""}</span>
      <button type="button" className="cms-button cms-button-secondary" disabled={busy || !!error || !hasMore} onClick={() => setPage((value) => value + 1)}>Next</button>
    </nav>
  </section>;
}
