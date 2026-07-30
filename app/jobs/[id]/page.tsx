import Link from "next/link";
import { notFound } from "next/navigation";
import { JobStatusSelect } from "@/components/job-status-select";
import { requireUser } from "@/lib/auth";
import { getJobWorkspace } from "@/lib/data/jobs";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { job } = await getJobWorkspace(supabase, user.id, id);
  if (!job) notFound();

  const analysis = job.rule_analysis;

  return (
    <div className="page-stack">
      <section className="glass-card page-header-card job-detail-header">
        <div>
          <div className="page-eyebrow"><span className="live-dot" /> Saved opportunity</div>
          <h1 className="page-title">{job.title}</h1>
          <p className="page-description">
            {job.employer ?? "Employer not recorded"}{job.location ? ` · ${job.location}` : ""}
          </p>
        </div>
        <JobStatusSelect jobId={job.id} initialStatus={job.status} />
      </section>

      <section className="dashboard-grid job-summary-grid">
        <article className="glass-card content-card">
          <div className="card-header">
            <div>
              <div className="page-eyebrow">Rule-based first pass</div>
              <h2 className="section-heading">Opportunity signal</h2>
            </div>
            {job.recommendation ? <span className={`status-chip recommendation-${job.recommendation}`}>{job.recommendation}</span> : null}
          </div>

          {analysis ? (
            <div className="decision-result persisted-analysis">
              <div className="result-tile"><span>Best-fit lane</span><strong>{analysis.primaryLane}</strong></div>
              <div className="result-tile"><span>Technical heaviness</span><strong>{analysis.technicalHeaviness}/100</strong></div>
              <div className="signal-section">
                <h4>Relevant signals</h4>
                <div className="chip-row">{analysis.matchedSignals.map((value) => <span key={value} className="signal-chip">{value}</span>)}</div>
              </div>
              <div className="signal-section">
                <h4>Caution signals</h4>
                {analysis.cautionSignals.length ? <div className="chip-row">{analysis.cautionSignals.map((value) => <span key={value} className="signal-chip">{value}</span>)}</div> : <p>No material caution signal.</p>}
              </div>
              <p className="analysis-explanation">{analysis.explanation}</p>
            </div>
          ) : (
            <div className="empty-inline-state">No preliminary analysis is stored for this role.</div>
          )}
        </article>

        <article className="glass-card content-card next-card action-next-card">
          <div className="page-eyebrow">Next step</div>
          <h3>Deep evidence analysis</h3>
          <p>Map every written requirement to approved Career Profile evidence, identify honest gaps and preserve the result on this opportunity.</p>
          <div className="impact-row"><span>Guardrail</span><strong>Approved evidence only</strong></div>
          <div className="impact-row"><span>Status</span><strong>{job.deep_analysis_status.replace("_", " ")}</strong></div>
          <span className="secondary-button is-disabled" aria-disabled="true">Deep analysis is being added</span>
        </article>
      </section>

      <section className="glass-card content-card">
        <div className="card-header">
          <div>
            <h2 className="section-heading">Original job description</h2>
            <p className="section-subtitle">The exact source used for every analysis and résumé decision.</p>
          </div>
          {job.source_url ? <a href={job.source_url} target="_blank" rel="noreferrer" className="secondary-button">Open source ↗</a> : null}
        </div>
        <div className="job-description-reader">{job.raw_description}</div>
      </section>

      <div className="page-footer-actions">
        <Link href="/jobs" className="secondary-button">← Back to jobs</Link>
        <Link href="/applications" className="primary-button">Open Applications <span aria-hidden="true">→</span></Link>
      </div>
    </div>
  );
}
