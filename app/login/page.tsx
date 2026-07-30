"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<Mode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"error" | "success">("error");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error) setMessage(error);

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/welcome");
    });
  }, [router, supabase]);

  async function signInWithGoogle() {
    setBusy(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/welcome`,
      },
    });

    if (error) {
      setBusy(false);
      setMessageType("error");
      setMessage(error.message);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    if (mode === "signup") {
      if (!fullName.trim()) {
        setBusy(false);
        setMessageType("error");
        setMessage("Please enter your name.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/welcome`,
        },
      });

      setBusy(false);
      if (error) {
        setMessageType("error");
        setMessage(error.message);
        return;
      }

      if (data.session) {
        router.replace("/welcome");
        return;
      }

      setMessageType("success");
      setMessage("Account created. Check your email to confirm your address, then return to Sartho.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);

    if (error) {
      setMessageType("error");
      setMessage(error.message);
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
          <div><strong>Sartho</strong><small>AI Career Copilot</small></div>
        </div>
        <div className="auth-story-copy">
          <span className="page-eyebrow"><span className="live-dot" /> Evidence before automation</span>
          <h1>Find the right role.<br />Prove your fit.</h1>
          <p>Sartho turns your real career evidence into focused role matching, truthful résumé tailoring, interview preparation and one clear application journey.</p>
        </div>
        <div className="auth-route-preview" aria-hidden="true">
          <span className="route-node is-active">Profile</span><i />
          <span className="route-node">Match</span><i />
          <span className="route-node">Tailor</span><i />
          <span className="route-node">Prepare</span>
        </div>
      </section>

      <section className="auth-card glass-strong">
        <div className="auth-card-heading">
          <span className="auth-kicker">Private beta</span>
          <h2>{mode === "signin" ? "Welcome back" : "Create your workspace"}</h2>
          <p>{mode === "signin" ? "Sign in to continue your career journey." : "Start with a secure personal workspace."}</p>
        </div>

        <button type="button" className="oauth-button" onClick={signInWithGoogle} disabled={busy}>
          <GoogleIcon />
          <span>Continue with Google</span>
        </button>

        <div className="auth-divider"><span>or continue with email</span></div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "signup" ? (
            <label>
              <span>Full name</span>
              <input autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" required />
            </label>
          ) : null}

          <label>
            <span>Email address</span>
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
          </label>

          <label>
            <span>Password</span>
            <input type="password" minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" required />
          </label>

          {message ? <div className={`auth-message ${messageType}`}>{message}</div> : null}

          <button type="submit" className="primary-button auth-submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button type="button" className="auth-switch" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(null); }}>
          {mode === "signin" ? "New to Sartho? Create an account" : "Already have an account? Sign in"}
        </button>

        <p className="auth-footnote">Your profile and application records stay behind your account. Sartho never submits an application without your approval.</p>
      </section>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.36l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.41 13.94A6.02 6.02 0 0 1 6.1 12c0-.67.12-1.33.31-1.94V7.44H3.06A10 10 0 0 0 2 12c0 1.61.38 3.14 1.06 4.56l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.88A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.94 5.44l3.35 2.62C7.2 7.7 9.4 5.94 12 5.94Z" />
    </svg>
  );
}
