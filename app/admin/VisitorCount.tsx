"use client";

import { useEffect, useState } from "react";
import { Eye, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function VisitorCount() {
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setBusy(true);
      setError("");
      try {
        const result = await createClient().rpc("site_visitor_count").abortSignal(controller.signal);
        if (result.error) throw result.error;
        if (!controller.signal.aborted) setCount(Number(result.data));
      } catch {
        if (!controller.signal.aborted) setError("Visitor count unavailable. Check the visitor migration and your admin access.");
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    }
    void load();
    const interval = window.setInterval(() => setRevision((value) => value + 1), 60000);
    return () => { controller.abort(); window.clearInterval(interval); };
  }, [revision]);

  return <section className="cms-panel cms-visitors" aria-labelledby="visitor-count-title">
    <div className="cms-panel-heading">
      <div><h2 id="visitor-count-title"><Eye size={18} />Unique visitors</h2><p>Each new IP counts once, from when tracking started.</p></div>
      <button type="button" className="cms-button cms-button-secondary" disabled={busy} onClick={() => setRevision((value) => value + 1)} aria-label="Refresh visitor count"><RefreshCw size={16} className={busy ? "animate-spin" : ""} />Refresh</button>
    </div>
    <div className="cms-visitor-total" aria-live="polite">
      {error ? <p role="alert">{error}</p> : <><strong>{busy && count === null ? "…" : count?.toLocaleString()}</strong><span>All-time unique IPs · Updates every minute</span></>}
    </div>
  </section>;
}
