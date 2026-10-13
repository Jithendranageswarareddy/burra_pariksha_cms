# Stage 12 — Platform Sync

## 3.1 Page Identity
- Publishing/platform packages workspace; sync service; **Reviewed**. Related FC-016.
- Evidence: [`frontend/app/App.tsx`](../../frontend/app/App.tsx),
  [`frontend/pages/PlatformPackagesPage.tsx`](../../frontend/pages/PlatformPackagesPage.tsx),
  [`backend/features/publishing/services/platform-adaptation.service.ts`](../../backend/features/publishing/services/platform-adaptation.service.ts),
  [`docs/features/FC-016-PLATFORM-RELEASE-SYNC.md`](../features/FC-016-PLATFORM-RELEASE-SYNC.md),
  [`docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md`](../architecture/07-CANONICAL-15-STEP-WORKFLOW.md).

## 3.2 Purpose
- Reconcile platform metadata, URLs, and statuses after publication.

## 3.3 Entry Condition
- Publication reference exists and actor can run sync.

## 3.4 Required Data
- Publication records, platform responses, expected metadata, discrepancies, and
  sync timestamps.

## 3.5 GET Requests
- Publishing APIs read platform package/publication state; provider-specific GET
  calls are backend-owned and exact routes **UNVERIFIED**.

## 3.6 User Inputs
- Select platform, start sync, inspect discrepancy, and acknowledge/retry.

## 3.7 Defaults
- All platforms with publication evidence are candidates; no platform is silently
  treated as reconciled.

## 3.8 Primary Action
- Run reconciliation and record result; it must not republish content.

## 3.9 API Request
- Platform sync service sends publication ID/platform selection; backend validates.

## 3.10 Backend Use Case
- Platform adaptation/sync, publication repository, workflow, audit, integrations.

## 3.11 Response
- Returns per-platform reconciled/discrepant status and evidence.

## 3.12 Persistence
- Reconciliation metadata/status persists in Firestore; provider data is external.

## 3.13 Workflow State
- Published → reconciled/Stage 12 complete; discrepancy remains actionable and
  blocks Analytics readiness where required.

## 3.14 Audit
- Sync attempts and discrepancy resolution require audit; events **UNVERIFIED**.

## 3.15 Error States
- Provider outage, auth/rate limit, mismatched metadata, stale record, duplicate
  sync, and network failure.

## 3.16 Empty States
- No publication evidence: prerequisite explanation; no discrepancies is a valid
  successful result, not an empty failure.

## 3.17 Next Action
- Reconciled publication enables Analytics ingestion; unresolved discrepancies stay
  in sync.

## 3.18 Role Visibility
- Publishing/sync managers operate; analytics viewers consume results.

## 3.19 Performance
- Sync providers independently, respect rate limits, and show progress. Target: **TBD**.

## 3.20 Acceptance Criteria
- Publishing service contains sync-related operations. Provider reconciliation,
  audit, and E2E coverage are **UNVERIFIED**.
