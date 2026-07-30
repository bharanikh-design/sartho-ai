import Link from "next/link";
import { careerProfile, evidenceItems } from "@/data/profile";

const actions = [
  {
    href: "/career-truth",
    symbol: "✓",
    label: "Evidence to review",
    value: String(evidenceItems.length),
    note: "Confirm what Sartho may use",
    action: "Review Career Profile",
    tour: "career-profile",
  },
  {
    href: "/jobs",
    symbol: "✦",
    label: "Analyse a role",
    value: "New",
    note: "Requirements, recruiter signals and fit",
    action: "Start role analysis",
    tour: "analyse-role",
  },
  {
    href: "/applications",
    symbol: "↗",
    label: "Application journey",
    value: "0",
    note: "Track messages, interviews and outcomes",
    action: "Open applications",
    tour: "applications",
  },
];

export default function HomePage() {
  return (
    <div className="page-stack">
      <section className="hero-panel home-hero glass-card">
        <div className="hero-copy">
          <div className="page-eyebrow"><span className="live-dot" /> Evidence-led AI Career Copilot</div>
          <h1>Find the right role.<br />Prove your fit.</h1>
          <p>
            Sartho connects verified career evidence to role matching, truthful résumé decisions,
            interview preparation and one clear view of every outcome.
          </p>
          <div className="hero-actions">
            <Link href="/jobs" className="primary-button" data-tour="analyse-role">Analyse a role <span aria-hidden="true">↗</span></Link>
            <Link href="/career-truth" className="secondary-button" data-tour="career-profile">Review Career Profile</Link>
          </div>
        </div>

        <div className="home-hero-signal" aria-label={`${evidenceItems.length} career evidence items awaiting review`}>
          <span className="signal-label">Career readiness</span>
          <strong>Start with truth</strong>
          <p>{evidenceItems.length} evidence records are ready for your confirmation.</p>
          <Link href="/career-truth">Continue review <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <section className="metric-grid action-metric-grid" aria-label="Your next actions">
        {actions.map((action) => (
          <Link key={action.href} href={action.href} className="glass-card-soft metric-card action-metric" data-tour={action.tour}>
            <span className="metric-icon" aria-hidden="true">{action.symbol}</span>
            <div className="metric-label">{action.label}</div>
            <div className="metric-value">{action.value}</div>
            <div className="metric-note">{action.note}</div>
            <span className="metric-action">{action.action}<span aria-hidden="true">→</span></span>
          </Link>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="glass-card content-card">
          <div className="card-header">
            <div>
              <div className="page-eyebrow">Current positioning</div>
              <h2 className="position-title">{careerProfile.headline}</h2>
            </div>
            <span className="meta-pill">{careerProfile.experienceYears}+ years · {careerProfile.location}</span>
          </div>

          <div className="lane-list">
            {careerProfile.targetLanes.map((lane, index) => (
              <div key={lane.name} className="lane-row">
                <div className="lane-top">
                  <span className="lane-index">0{index + 1}</span>
                  <span className="lane-name">{lane.name}</span>
                  <span className="lane-weight">{lane.weight}%</span>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${lane.weight}%` }} /></div>
              </div>
            ))}
          </div>
        </article>

        <article className="glass-card content-card next-card action-next-card">
          <div className="page-eyebrow">Next best action</div>
          <h3>Verify three transition achievements</h3>
          <p>That will improve Sartho’s confidence when matching you to Transition, EUC, ITSM and delivery-leadership roles.</p>
          <div className="impact-row"><span>Impact</span><strong>Unlocks accurate résumé tailoring</strong></div>
          <div className="impact-row"><span>Estimated effort</span><strong>3 minutes</strong></div>
          <div className="next-action-buttons">
            <Link href="/career-truth" className="primary-button">Start <span aria-hidden="true">→</span></Link>
            <details className="why-details">
              <summary>Why this?</summary>
              <p>Role matching is only as reliable as the evidence behind it. Confirming these programme achievements lets Sartho show recruiters the scale, governance and outcomes that distinguish your profile.</p>
            </details>
          </div>
        </article>
      </section>
    </div>
  );
}
