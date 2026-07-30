"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const slides = [
  {
    eyebrow: "Turn experience into possibility",
    title: "Your career story deserves to open the right doors.",
    description: "Bring together the roles, achievements and strengths that define you. Sartho creates a trusted foundation so every recommendation reflects what you have genuinely accomplished.",
    badge: "Available now",
    visual: "profile",
  },
  {
    eyebrow: "Know where you truly belong",
    title: "See the opportunity behind the job description.",
    description: "Sartho looks beyond keywords to understand the role, the recruiter’s real priorities, your strongest advantages and the gaps that deserve an honest decision.",
    badge: "Available now",
    visual: "match",
  },
  {
    eyebrow: "Stand out without pretending",
    title: "Tell the version of your story that deserves to be seen.",
    description: "Résumé Delta will show what to emphasise, move, rewrite or leave out — always linked to evidence, always under your control and never based on invented claims.",
    badge: "Next release",
    visual: "resume",
  },
  {
    eyebrow: "Be ready when the moment arrives",
    title: "Walk into every conversation with clarity and confidence.",
    description: "Prepare for the questions that matter, use your strongest real examples and keep every recruiter conversation, interview and outcome connected in one purposeful journey.",
    badge: "Next release",
    visual: "journey",
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [index, setIndex] = useState(0);
  const [name, setName] = useState("there");

  useEffect(() => {
    const completed = window.localStorage.getItem("sartho-onboarding-complete");
    if (completed === "true") {
      router.replace("/");
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      const fullName = data.user?.user_metadata?.full_name as string | undefined;
      const emailName = data.user?.email?.split("@")[0];
      setName(fullName?.split(" ")[0] || emailName || "there");
    });
  }, [router, supabase]);

  const slide = slides[index];
  const isLast = index === slides.length - 1;

  function finish() {
    window.localStorage.setItem("sartho-onboarding-complete", "true");
    window.localStorage.setItem("sartho-tour-pending", "true");
    router.push("/");
  }

  return (
    <main className="welcome-page">
      <div className="welcome-ambient welcome-ambient-one" aria-hidden="true" />
      <div className="welcome-ambient welcome-ambient-two" aria-hidden="true" />

      <header className="welcome-header">
        <div className="auth-brand">
          <span className="brand-mark" aria-hidden="true"><span>S</span></span>
          <div><strong>Sartho</strong><small>AI Career Copilot</small></div>
        </div>
        <button type="button" className="ghost-button" onClick={finish}>Skip tour</button>
      </header>

      <section className="welcome-stage glass-card">
        <div className="welcome-copy" key={`copy-${index}`}>
          <span className="welcome-greeting">Welcome, {name}.</span>
          <span className="page-eyebrow">{slide.eyebrow}</span>
          <h1>{slide.title}</h1>
          <p>{slide.description}</p>
          <span className={`welcome-badge ${slide.badge === "Available now" ? "is-live" : ""}`}>{slide.badge}</span>
        </div>

        <div className="welcome-visual" key={`visual-${index}`} aria-hidden="true">
          <FeatureVisual kind={slide.visual} />
        </div>
      </section>

      <footer className="welcome-controls">
        <button type="button" className="secondary-button" onClick={() => setIndex((current) => Math.max(0, current - 1))} disabled={index === 0}>Back</button>
        <div className="welcome-progress" aria-label={`Step ${index + 1} of ${slides.length}`}>
          {slides.map((item, itemIndex) => (
            <button key={item.title} type="button" className={itemIndex === index ? "is-active" : ""} onClick={() => setIndex(itemIndex)} aria-label={`Go to step ${itemIndex + 1}`} />
          ))}
        </div>
        <button type="button" className="primary-button" onClick={() => isLast ? finish() : setIndex((current) => current + 1)}>
          {isLast ? "Begin my journey" : "Next"}<span aria-hidden="true">→</span>
        </button>
      </footer>

      <div className="journey-strip" aria-label="Sartho journey">
        {['Discover', 'Align', 'Stand out', 'Prepare', 'Land it'].map((item, itemIndex) => (
          <div key={item} className={itemIndex <= index + 1 ? "is-active" : ""}>
            <span>{itemIndex + 1}</span><strong>{item}</strong>{itemIndex < 4 ? <i /> : null}
          </div>
        ))}
      </div>
    </main>
  );
}

function FeatureVisual({ kind }: { kind: string }) {
  if (kind === "profile") {
    return (
      <div className="feature-device">
        <div className="feature-device-bar"><i /><i /><i /></div>
        <div className="profile-demo-row"><span>✓</span><div><strong>US$6M transition programme</strong><small>Approved evidence · High confidence</small></div></div>
        <div className="profile-demo-row"><span>✓</span><div><strong>40-person distributed delivery</strong><small>Approved evidence · High confidence</small></div></div>
        <div className="profile-demo-row is-pending"><span>?</span><div><strong>Operational readiness ownership</strong><small>Review before Sartho may use it</small></div></div>
      </div>
    );
  }

  if (kind === "match") {
    return (
      <div className="feature-device match-demo">
        <div className="match-score"><strong>88%</strong><span>Strong fit</span></div>
        <div className="match-bars">
          <label>Required qualifications<i><b style={{ width: '88%' }} /></i></label>
          <label>Leadership scale<i><b style={{ width: '92%' }} /></i></label>
          <label>Technical heaviness<i><b style={{ width: '24%' }} /></i></label>
        </div>
        <span className="match-confidence">High-confidence evidence</span>
      </div>
    );
  }

  if (kind === "resume") {
    return (
      <div className="feature-device resume-demo">
        <div className="resume-sheet">
          <span className="resume-line strong" /><span className="resume-line" /><span className="resume-line short" />
          <div className="resume-change"><del>Managed EUC project activities</del><ins>Led a US$6M multi-country EUC separation programme</ins></div>
          <span className="resume-line" /><span className="resume-line medium" />
        </div>
        <div className="resume-proof">Evidence linked</div>
      </div>
    );
  }

  return (
    <div className="feature-device journey-demo">
      {['Recruiter outreach', 'Résumé prepared', 'Interview practice', 'Outcome tracked'].map((item, itemIndex) => (
        <div key={item} className="journey-demo-row"><span>{itemIndex + 1}</span><strong>{item}</strong><i /></div>
      ))}
    </div>
  );
}
