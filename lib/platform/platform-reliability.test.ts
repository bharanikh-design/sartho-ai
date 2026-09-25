import { describe, expect, it } from 'vitest';
import { evaluateDeploymentContract } from './deployment-contract';
import { buildPlatformHealthSnapshot } from './health';
import { readPlatformManifest } from './manifest';
import { dispatchWorkflow } from './workflow-dispatcher';
import {
  currentWorkflowTraceIds,
  failWorkflowStage,
  finishWorkflowStage,
  noteWorkflowRetry,
  noteWorkflowWarning,
  runWorkflowTraceScope,
  startWorkflowStage,
} from './workflow-trace';

describe('Sartho platform reliability foundation', () => {
  it('normalizes manifest identity without leaking secrets', () => {
    const manifest = readPlatformManifest({
      NEXT_PUBLIC_APP_VERSION: '1.2.3',
      VERCEL_GIT_COMMIT_SHA: 'abcdef1234567890',
      VERCEL_ENV: 'production',
      SARTHO_BUILD_TIMESTAMP: '1790334000',
      GEMINI_API_KEY: 'must-not-appear',
    });

    expect(manifest.appName).toBe('sartho-ai');
    expect(manifest.appVersion).toBe('1.2.3');
    expect(manifest.gitShaShort).toBe('abcdef1');
    expect(manifest.deploymentEnvironment).toBe('production');
    expect(JSON.stringify(manifest)).not.toContain('must-not-appear');
  });

  it('aggregates required NOT_READY checks above optional degradation', () => {
    const contract = evaluateDeploymentContract({
      generatedAt: '2026-09-25T00:00:00.000Z',
      checks: [
        { component: 'application', status: 'READY', required: true, reason: 'ok' },
        { component: 'queue', status: 'DEGRADED', required: false, reason: 'not configured yet' },
        { component: 'migrations', status: 'NOT_READY', required: true, reason: 'missing' },
      ],
    });

    expect(contract.status).toBe('NOT_READY');
    expect(contract.summary).toMatchObject({ ready: 1, degraded: 1, notReady: 1, requiredNotReady: 1 });
  });

  it('records workflow ids, stages, retries, warnings and recovery safely', async () => {
    let clock = Date.parse('2026-09-25T00:00:00.000Z');
    const outcome = await runWorkflowTraceScope('search -> rank -> save', async () => {
      const ids = currentWorkflowTraceIds();
      expect(ids?.workflowId).toBe('workflow-1');
      expect(ids?.traceId).toBe('trace-1');

      const stage = startWorkflowStage('provider:search');
      noteWorkflowRetry(stage);
      noteWorkflowWarning(stage, 'first provider timed out');
      clock += 25;
      finishWorkflowStage(stage, { recovery: 'used fallback provider' });
      return 'done';
    }, {
      workflowId: 'workflow-1',
      traceId: 'trace-1',
      now: () => clock,
    });

    expect(outcome.ok).toBe(true);
    expect(outcome.trace.status).toBe('succeeded');
    expect(outcome.trace.stages[0]).toMatchObject({
      name: 'provider:search',
      status: 'recovered',
      retries: 1,
      warnings: ['first provider timed out'],
      recovery: 'used fallback provider',
    });
  });

  it('keeps failed workflow trace without throwing from the outcome API', async () => {
    const outcome = await runWorkflowTraceScope('failing workflow', async () => {
      const stage = startWorkflowStage('save');
      failWorkflowStage(stage, new TypeError('raw message must not leak'));
      throw new TypeError('raw message must not leak');
    }, {
      workflowId: 'workflow-2',
      traceId: 'trace-2',
      now: () => Date.parse('2026-09-25T00:00:00.000Z'),
    });

    expect(outcome.ok).toBe(false);
    expect(outcome.trace.status).toBe('failed');
    expect(outcome.trace.stages[0].failure).toBe('TypeError');
    expect(JSON.stringify(outcome.trace)).not.toContain('raw message');
  });

  it('dispatches immediate workflows and rejects fake queued mode', async () => {
    const completed = await dispatchWorkflow({
      workflowName: 'candidate-intelligence',
      workflowId: 'workflow-3',
      traceId: 'trace-3',
      now: () => Date.parse('2026-09-25T00:00:00.000Z'),
    }, () => ({ ok: true }));

    expect(completed.status).toBe('completed');
    expect(completed.trace?.stages[0].name).toBe('dispatch:immediate');

    const rejected = await dispatchWorkflow({
      workflowName: 'candidate-intelligence',
      workflowId: 'workflow-4',
      traceId: 'trace-4',
      mode: 'queued',
    }, () => ({ ok: true }));

    expect(rejected).toMatchObject({
      mode: 'queued',
      status: 'rejected',
      reason: 'queue_backend_not_configured',
      trace: null,
    });
  });

  it('builds a cockpit-ready health snapshot', () => {
    const snapshot = buildPlatformHealthSnapshot({
      env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
        GEMINI_API_KEY: 'configured',
        SERPAPI_KEY: 'configured',
        VERCEL_ENV: 'preview',
      },
      durableSchemaPresent: true,
      now: () => Date.parse('2026-09-25T00:00:00.000Z'),
    });

    expect(snapshot.status).toBe('DEGRADED');
    expect(snapshot.manifest.appName).toBe('sartho-ai');
    expect(snapshot.contract.checks.map((check) => check.component)).toContain('workflow_trace');
    expect(snapshot.contract.checks.map((check) => check.component)).toContain('dispatcher');
    expect(snapshot.dispatcher.mode).toBe('immediate');
  });
});
