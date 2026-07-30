"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

function friendlyAuthMessage(message: string) {
  const value = message.toLowerCase();

  if (value.includes("invalid api key")) {
    return "Sartho cannot reach its secure account service yet. The Supabase publishable key in this deployment is invalid or out of date.";
  }

  if (value.includes("email not confirmed")) {
    return "This account has not been confirmed yet. Confirm it in Supabase, then sign in again.";
  }

  if (value.includes("invalid login credentials")) {
    return "The email address or password does not match the authorised Sartho account.";
  }

  return message;
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error) setMessage(friendlyAuthMessage(error));

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/welcome");
    });
  }, [router, supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);

    if (error) {
      setMessage(friendlyAuthMessage(error.message));
      return;
    }

    router.replace("/welcome");
    router.refresh();
  }

  return (
    <main className="auth-page">
      <div className="auth-ambient auth-ambient-one" aria-hidden="true" />
      <div className="auth-ambient auth-ambient-two" aria-hidden="true" />

      <section className="auth-story" aria-label="About Sartho">
        <div className="auth-brand">
          <span className="brand-mark" aria-hidden="true"><span>S</span></span>
          <div><strong>Sartho AI</strong><small>Your career, intelligently guided.</small></div>
        </div>

        <div className="auth-story-copy">
          <span className="page-eyebrow"><span className="live-dot" /> Your next chapter starts here</span>
          <h1>One right role<br />can change everything.</h1>
          <p>
            Sartho helps you find work worthy of your experience, prove why you belong, prepare with confidence,
            and be ready to land the opportunity when it appears.
          </p>
          <div className="auth-promise">
            <strong>Find it. Align for it. Stand out. Prepare. Land it.</strong>
            <span>Evidence-backed career intelligence, always under your control.</span>
          </div>
        </div>

        <div className="auth-route-preview" aria-label="Your Sartho journey">
          <span className="route-node is-active">Discover</span><i />
          <span className="route-node">Align</span><i />
          <span className="route-node">Stand out</span><i />
          <span className="route-node">Land it</span>
        </div>
      </section>

      <section className="auth-card glass-strong">
        <div className="auth-card-heading">
          <span className="auth-kicker">Private career workspace</span>
          <h2>Welcome back</h2>
          <p>Sign in with the authorised Sartho account to continue your journey.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Email address</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              minLength={8}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              required
            />
          </label>

          {message ? <div className="auth-message error" role="alert">{message}</div> : null}

          <button type="submit" className="primary-button auth-submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in to Sartho"}
          </button>
        </form>

        <p className="auth-access-note">
          Access is currently invitation-only. Accounts are created securely by the workspace administrator.
        </p>

        <p className="auth-footnote">
          Your career information belongs to you. Nothing is used in an application or submitted without your approval.
        </p>
      </section>
    </main>
  );
}
