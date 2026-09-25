export const PLATFORM_MANIFEST_VERSION = 'sartho-platform-manifest-2026-09-25.1';
export const PLATFORM_SCHEMA_VERSION = 'sartho-platform-schema-1';
export const REQUIRED_MIGRATION_VERSION = '2026-09-25-platform-reliability-foundation';

export type PlatformDeploymentEnvironment = 'production' | 'preview' | 'development' | 'test' | 'unknown';

export type PlatformManifest = {
  manifestVersion: typeof PLATFORM_MANIFEST_VERSION;
  appName: 'sartho-ai';
  appVersion: string;
  gitSha: string | null;
  gitShaShort: string | null;
  schemaVersion: string;
  requiredMigrationVersion: string;
  buildTimestamp: string | null;
  deploymentEnvironment: PlatformDeploymentEnvironment;
};

type EnvReader = Record<string, string | undefined>;

function firstNonEmpty(...values: Array<string | undefined>): string | null {
  for (const value of values) {
    const trimmed = String(value || '').trim();
    if (trimmed) return trimmed;
  }
  return null;
}

function normalizeDeploymentEnvironment(value: string | null): PlatformDeploymentEnvironment {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'production' || normalized === 'prod') return 'production';
  if (normalized === 'preview' || normalized === 'staging') return 'preview';
  if (normalized === 'development' || normalized === 'dev' || normalized === 'local') return 'development';
  if (normalized === 'test' || normalized === 'ci') return 'test';
  return 'unknown';
}

function normalizeGitSha(value: string | null): string | null {
  const normalized = String(value || '').trim();
  if (!/^[0-9a-f]{7,40}$/i.test(normalized)) return null;
  return normalized;
}

function normalizeTimestamp(value: string | null): string | null {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const unixSeconds = /^\d{10}$/.test(raw) ? Number(raw) : null;
  const unixMillis = /^\d{13}$/.test(raw) ? Number(raw) : null;
  const parsed = unixSeconds
    ? new Date(unixSeconds * 1000)
    : unixMillis
      ? new Date(unixMillis)
      : new Date(raw);
  const time = parsed.getTime();
  if (!Number.isFinite(time)) return null;
  return parsed.toISOString();
}

/**
 * Server-owned identity for Sartho deployments.
 *
 * This reads only stable build/runtime variables and never returns secrets.
 * Missing values stay null/unknown because false identity makes incidents worse.
 */
export function readPlatformManifest(env: EnvReader = process.env): PlatformManifest {
  const gitSha = normalizeGitSha(firstNonEmpty(
    env.VERCEL_GIT_COMMIT_SHA,
    env.GITHUB_SHA,
    env.NEXT_PUBLIC_GIT_SHA,
    env.SARTHO_GIT_SHA,
  ));

  return {
    manifestVersion: PLATFORM_MANIFEST_VERSION,
    appName: 'sartho-ai',
    appVersion: firstNonEmpty(env.NEXT_PUBLIC_APP_VERSION, env.SARTHO_APP_VERSION, env.npm_package_version) || '0.1.0',
    gitSha,
    gitShaShort: gitSha ? gitSha.slice(0, 7) : null,
    schemaVersion: firstNonEmpty(env.SARTHO_SCHEMA_VERSION) || PLATFORM_SCHEMA_VERSION,
    requiredMigrationVersion: firstNonEmpty(env.SARTHO_REQUIRED_MIGRATION_VERSION) || REQUIRED_MIGRATION_VERSION,
    buildTimestamp: normalizeTimestamp(firstNonEmpty(
      env.SARTHO_BUILD_TIMESTAMP,
      env.NEXT_PUBLIC_BUILD_TIMESTAMP,
      env.VERCEL_DEPLOYMENT_CREATED_AT,
    )),
    deploymentEnvironment: normalizeDeploymentEnvironment(firstNonEmpty(
      env.SARTHO_DEPLOYMENT_ENV,
      env.VERCEL_ENV,
      env.NODE_ENV,
    )),
  };
}

export function publicPlatformManifest(manifest: PlatformManifest = readPlatformManifest()): PlatformManifest {
  return { ...manifest };
}
