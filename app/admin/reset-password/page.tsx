"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);

  useEffect(() => {
    async function establishRecoverySession() {
      const code = new URLSearchParams(window.location.search).get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) setMessage(error.message);
        else {
          setSessionValid(true);
          window.history.replaceState({}, document.title, "/admin/reset-password");
        }
      } else {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) setMessage("This reset link is missing or has expired. Request a new one.");
        else setSessionValid(true);
      }

      setCheckingSession(false);
    }

    establishRecoverySession();
  }, []);

  async function updatePassword(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setMessage("Your reset session has expired. Request a new reset link.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(error.message);
      return;
    }

    // Do not leave the recovery session authenticated after changing the password.
    const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
    if (signOutError) {
      setMessage(signOutError.message);
      return;
    }

    setSaved(true);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-6">
      <form onSubmit={updatePassword} className="w-full max-w-md space-y-5 glass rounded-3xl p-8">
        <h1 className="text-3xl font-bold">Set new password</h1>
        {checkingSession ? (
          <p className="text-zinc-400">Checking reset link…</p>
        ) : !sessionValid ? (
          <><p className="text-red-300">{message || "This reset link is invalid or has expired."}</p><a href="/admin/forgot-password" className="block text-violet-300">Request a new reset link</a></>
        ) : saved ? (
          <><p className="text-emerald-300">Password updated successfully. You have been signed out.</p><a href="/admin" className="block text-violet-300">Log in to the CMS</a></>
        ) : (
          <>
            <input className="w-full rounded-xl bg-white/10 px-4 py-3" type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <input className="w-full rounded-xl bg-white/10 px-4 py-3" type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            <button disabled={checkingSession} className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60">Update password</button>
            {message && <p className="text-red-300">{message}</p>}
          </>
        )}
      </form>
    </main>
  );
}
