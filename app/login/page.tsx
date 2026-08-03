"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

/*
 * Sign-in — the product's front door.
 *
 * Restrained violet on near-black, aligned to the app's existing tokens. Applied
 * sparingly (mark, active stage, focus, CTA) so it reads considered
 * rather than gaudy. The journey strip animates through the five stages so the
 * page feels alive without a carousel's weight.
 *
 * Copy is deliberately sparse — the tagline sits with the mark, the headline is
 * one line, and the card says only what the moment needs.
 *
 * Styles are inlined so this page can be deployed as a single file.
 */
const styles = `
.hh {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: clamp(20px, 3vw, 30px);
  padding: clamp(22px, 3.4vw, 46px);
  overflow: hidden;
  color: var(--text, #f4f6ff);
}
/* One pool of light, following the theme. */
.hh::before {
  content: "";
  position: absolute; z-index: 0;
  top: -34%; left: 8%;
  width: min(78vw, 900px); aspect-ratio: 1;
  border-radius: 999px;
  background: radial-gradient(circle, color-mix(in srgb, var(--violet, #a68cff) 22%, transparent), transparent 62%);
  filter: blur(40px);
  pointer-events: none;
}

.hh-top, .hh-stage { position: relative; z-index: 2; }
.hh-top { display: flex; align-items: baseline; gap: 11px; animation: rise .8s ease both; }
.hh-top strong { font-size: 15px; font-weight: 600; }
.hh-top span { font-size: 12.5px; color: var(--text-tertiary); }

.hh-stage {
  display: grid;
  align-content: center;
  justify-items: center;
  text-align: center;
  gap: clamp(34px, 4.6vw, 56px);
  width: 100%;
}

.hh-stage h1 {
  max-width: 13ch;
  margin: 0;
  font-size: clamp(46px, 10vw, 152px);
  line-height: .9;
  letter-spacing: -0.058em;
  font-weight: 600;
  text-wrap: balance;
  animation: rise 1.2s cubic-bezier(.2,.7,.2,1) .15s both;
}
.hh-stage h1 em {
  font-style: normal;
  color: var(--text);
  text-shadow: 0 0 54px color-mix(in srgb, var(--violet, #a68cff) 55%, transparent);
}

.hh-act { display: grid; justify-items: center; gap: 14px; animation: rise 1s ease .8s both; }
.hh-cta {
  min-height: 54px;
  display: inline-flex; align-items: center; gap: 11px;
  padding: 0 28px;
  border: 1px solid var(--line-bright);
  border-radius: 999px;
  color: var(--canvas);
  background: var(--text);
  cursor: pointer; font: inherit;
  font-size: 15px; font-weight: 600; letter-spacing: -0.008em;
  box-shadow: var(--shadow-soft);
  transition: transform .25s cubic-bezier(.2,.7,.2,1), box-shadow .25s ease;
}
.hh-cta:hover:not(:disabled) { transform: translateY(-2px); box-shadow: var(--shadow); }
.hh-cta:disabled { opacity: .6; cursor: progress; }
.hh-note { margin: 0; color: var(--text-tertiary); font-size: 12.5px; }
.hh-error { max-width: 46ch; margin: 0; color: var(--rose); font-size: 13px; line-height: 1.55; }

.hh :is(button, a):focus-visible { outline: 2px solid var(--blue); outline-offset: 4px; }

@keyframes rise {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: none; }
}

@media (max-width: 700px) {
  .hh-stage { gap: 26px; }
  .hh-stage h1 { font-size: clamp(38px, 12vw, 62px); }
}
@media (prefers-reduced-motion: reduce) {
  .hh * { animation: none !important; transition: none !important; }
}
`;

function friendlyAuthMessage(message: string) {
  const value = message.toLowerCase();

  if (value.includes("invalid api key")) {
    return "Sartho cannot reach its secure sign-in service yet. The Supabase connection saved in this deployment needs one correction.";
  }

  if (value.includes("unsupported provider") || value.includes("provider is not enabled")) {
    return "Google sign-in has not been enabled for Sartho yet. Complete the one-time Google connection in Supabase, then try again.";
  }

  if (
    value.includes("unable to exchange external code") ||
    value.includes("invalid_client") ||
    value.includes("client secret")
  ) {
    return "Google accepted your account, but Supabase could not complete the secure code exchange. The Google Client Secret saved in Supabase does not match this Client ID.";
  }

  return message;
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const error =
      hashParams.get("error_description") ??
      searchParams.get("error") ??
      hashParams.get("error");

    // Reads browser-only URL/hash params unavailable during SSR, so this must
    // run in an effect rather than being derived during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (error) setMessage(friendlyAuthMessage(error));

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
    });
  }, [router, supabase]);

  async function signInWithGoogle() {
    setBusy(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    });

    if (error) {
      setBusy(false);
      setMessage(friendlyAuthMessage(error.message));
    }
  }

  return (
    <main className="hh">
      <style>{styles}</style>

      <header className="hh-top">
        <strong>Sartho</strong>
        <span>Career representation</span>
      </header>

      <div className="hh-stage">
        <h1>Your own headhunter. <em>Finally.</em></h1>

        <div className="hh-act">
          <button type="button" className="hh-cta" onClick={signInWithGoogle} disabled={busy}>
            <GoogleIcon />
            <span>{busy ? "Opening…" : "Continue with Google"}</span>
          </button>
          <p className="hh-note">Private beta — approved accounts only.</p>
        </div>

        {message ? <p className="hh-error" role="alert">{message}</p> : null}
      </div>
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
