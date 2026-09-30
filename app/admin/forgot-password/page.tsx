"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function requestReset(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/admin/reset-password`,
    });

      if (error) setMessage(error.message);
      else setSent(true);
    } catch {
      setMessage("Unable to send the reset link. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-6">
      <form onSubmit={requestReset} className="w-full max-w-md space-y-5 glass rounded-3xl p-8">
        <h1 className="text-3xl font-bold">Reset password</h1>
        {sent ? (
          <p className="text-emerald-300">If this email belongs to an account, a reset link has been sent.</p>
        ) : (
          <>
            <p className="text-zinc-400">Enter your admin email and we’ll send you a password reset link.</p>
            <input className="w-full rounded-xl bg-white/10 px-4 py-3" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <button disabled={loading} className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "Sending…" : "Send reset link"}
            </button>
            {message && <p className="text-red-300">{message}</p>}
          </>
        )}
        <a href="/admin" className="block text-center text-sm text-violet-300">Back to sign in</a>
      </form>
    </main>
  );
}
