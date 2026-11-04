"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, ChevronRight, Code2, FolderOpen, Mail, Send, X } from "lucide-react";
import { portfolioReply, type ChatContext, type ChatReply } from "@/lib/portfolio-chat";
import "./portfolio-chat.css";

type Message = ChatReply & { role: "user" | "assistant"; id: number; isError?: boolean };
const actions = [
  { label: "Browse Projects", question: "Show me your projects", icon: FolderOpen },
  { label: "Skills & Experience", question: "What are your skills?", icon: Code2 },
  { label: "Get in Touch", question: "How can I contact you?", icon: Mail },
];

function Avatar() {
  return <span className="portfolio-chat-avatar" aria-hidden="true"><Bot size={27} strokeWidth={1.8} /><span /></span>;
}

export default function PortfolioChat(context: ChatContext) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const conversation = useRef<HTMLDivElement>(null);
  const pending = useRef<AbortController | null>(null);
  const sequence = useRef(0);

  useEffect(() => {
    return () => { pending.current?.abort(); pending.current = null; };
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (conversation.current) conversation.current.scrollTop = conversation.current.scrollHeight;
  }, [messages, typing, open]);

  function close() {
    setOpen(false);
    requestAnimationFrame(() => launcher.current?.focus());
  }

  async function send(value: string) {
    const question = value.trim().slice(0, 500);
    if (!question || pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    let reply: ChatReply = portfolioReply(question, context);
    setMessages((previous) => [...previous, { role: "user", text: question, id: ++sequence.current }]);
    setInput("");
    setTyping(true);
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ question, history: messages.filter((message) => !message.isError).slice(-8).map(({ role, text }) => ({ role, text })) }),
      });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.source === "gemini" && typeof data.text === "string" && data.text.trim()) {
        reply = { ...reply, text: data.text };
      }
    } catch {
      // Keep the local answer on network errors, timeout, or unavailable Gemini.
    } finally {
      clearTimeout(timeout);
      if (pending.current !== controller) return;
      setMessages((previous) => [...previous, { role: "assistant", ...reply, id: ++sequence.current }]);
      setTyping(false);
      pending.current = null;
    }
  }

  return <div className="portfolio-chat">
    {open && <section id="portfolio-chat-panel" className="portfolio-chat-panel" role="dialog" aria-modal="false" aria-labelledby="portfolio-chat-title" onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); close(); } }}>
      <header className="portfolio-chat-header">
        <Avatar />
        <div><h2 id="portfolio-chat-title">Portfolio Assistant</h2><p>Your guide to {context.settings.display_name.split(" ")[0]}’s work</p></div>
        <button type="button" onClick={close} aria-label="Close chat"><X size={20} /></button>
      </header>
      <div className="portfolio-chat-conversation" ref={conversation}>
        <div className="portfolio-chat-bubble">Hi there! 👋 I’m {context.settings.display_name.split(" ")[0]}’s portfolio assistant. What would you like to explore?</div>
        {!messages.length && <div className="portfolio-chat-actions">{actions.map(({ label, question, icon: Icon }) => <button key={label} type="button" onClick={() => send(question)}><span><Icon size={19} /></span>{label}<ChevronRight size={17} /></button>)}</div>}
        <div role="log" aria-label="Chat messages" aria-live="polite" aria-relevant="additions">
          {messages.map((message) => <div key={message.id} className={`portfolio-chat-bubble ${message.role === "user" ? "portfolio-chat-user" : ""}`}>
            <span className="sr-only">{message.role === "user" ? "You: " : "Assistant: "}</span>{message.text}
            {message.link && <a href={message.link.href} onClick={close}>{message.link.label}<ChevronRight size={14} /></a>}
          </div>)}
        </div>
        {typing && <div className="portfolio-chat-typing" role="status"><span /><span /><span /><span className="sr-only">Assistant is typing</span></div>}
      </div>
      {messages.length > 0 && <div className="portfolio-chat-suggestions" aria-label="Suggested questions">{actions.map((action) => <button key={action.label} type="button" disabled={typing} onClick={() => send(action.question)}>{action.label}</button>)}</div>}
      <footer className="portfolio-chat-footer">
        <form onSubmit={(event) => { event.preventDefault(); send(input); }}>
          <input ref={inputRef} aria-label="Message the portfolio assistant" placeholder="Ask about projects, skills, or contact…" maxLength={500} value={input} onChange={(event) => setInput(event.target.value)} />
          <button type="submit" aria-label="Send message" disabled={!input.trim() || typing}><Send size={19} /></button>
        </form>
        <p>Answers from this portfolio · Automated guide</p>
      </footer>
    </section>}
    <button ref={launcher} type="button" className={`portfolio-chat-launcher is-compact ${open ? "is-hidden" : ""}`} onClick={() => setOpen(true)} aria-label="Chat with portfolio assistant" aria-expanded={open} aria-controls={open ? "portfolio-chat-panel" : undefined} tabIndex={open ? -1 : 0}>
      <span className="portfolio-chat-launcher-label">Chat with my assistant</span><Avatar />
    </button>
  </div>;
}
