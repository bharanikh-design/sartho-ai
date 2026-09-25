# Platform Reliability Foundation

This document defines the first Sartho reliability foundation slice.

The intent is operational safety, not visible product change.

## Scope

This foundation adds five seams:

1. Platform identity
2. Deployment contract
3. Workflow trace
4. Durable dispatcher seam
5. Operations health snapshot

It does not change candidate intelligence, resume flows, matching, scoring, UX, homepage behaviour, database mutations, or user-visible product surfaces.

## 1. Platform identity

`lib/platform/manifest.ts` owns runtime identity.

It reports:

- app name
- app version
- git SHA
- schema version
- required migration version
- build timestamp
- deployment environment

The manifest deliberately returns `null` or `unknown` instead of guessing.

## 2. Deployment contract

`lib/platform/deployment-contract.ts` reduces component checks into one status:

- `READY`
- `DEGRADED`
- `NOT_READY`

Required `NOT_READY` checks make the deployment `NOT_READY`.
Optional degraded checks keep the platform visible without pretending everything is healthy.

## 3. Workflow trace

`lib/platform/workflow-trace.ts` gives every workflow:

- workflow ID
- trace ID
- stage names
- start and finish timestamps
- bounded durations
- warnings
- retries
- failure class
- recovery note

This is not an arbitrary logging bag. It avoids user data, prompts, secrets, resumes, job descriptions, and raw exception messages.

## 4. Durable dispatcher seam

`lib/platform/workflow-dispatcher.ts` introduces one dispatch API:

- `immediate` works today
- `queued` rejects explicitly until a real backend exists

This prevents a fake queue from claiming durable async execution before one exists.

## 5. Operations health snapshot

`lib/platform/health.ts` builds a cockpit-ready status shape covering:

- application
- version
- environment
- schema
- migrations
- database/storage
- AI
- search
- notifications
- workflow trace
- dispatcher
- queue

This snapshot is intentionally not wired into a UI route in this PR. The foundation lands first; routes and cockpit UI should come in a separate PR.

## Four questions for every new Sartho feature

Every new feature must answer:

1. **Health** — Can I prove I am healthy?
2. **Trace** — Can I prove what happened?
3. **Recovery** — If I fail, what survives?
4. **Ownership** — Who is the authority?

## Non-goals

This PR does not touch:

- search relevance
- candidate context
- resume studio
- interview prep
- homepage
- matching
- scoring
- UX
- existing database behaviour
- existing user journeys

## Test coverage

`lib/platform/platform-reliability.test.ts` covers:

- manifest normalization and secret exclusion
- deployment contract aggregation
- workflow trace stage capture
- failure trace safety
- immediate dispatcher behaviour
- queued-mode explicit rejection
- platform health snapshot status construction
