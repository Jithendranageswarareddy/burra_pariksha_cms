# Stage 11 — Published

## 3.1 Page Identity
- `/publishing` and publishing workspace; publication recording is a shared
  publishing flow; **Reviewed**. Related FC-015.

## 3.2 Purpose
- Execute/record live publication and verify returned platform URLs.

## 3.3 Entry Condition
- Stage 10 scheduled/ready package and publishing capability.

## 3.4 Required Data
- Package, platform statuses, external publication IDs/URLs, timestamps, and actor.

## 3.5 GET Requests
- Publishing APIs retrieve package/publication state; exact endpoints **UNVERIFIED**.

## 3.6 User Inputs
- Execute publication, record external result, retry failed platform, and verify URL.

## 3.7 Defaults
- Existing scheduled platform statuses; no platform is assumed published.

## 3.8 Primary Action
- Publish/record publication. Each platform operation must be explicit and safely
  retryable or have duplicate protection.

## 3.9 API Request
- Publishing service handles platform command and publication result; backend owns
  credentials, validation, and authorization.

## 3.10 Backend Use Case
- Publishing integrations, publication repository, workflow, audit, and retries.

## 3.11 Response
- Returns per-platform status/URL; partial results remain visible and do not claim
  all-platform success.

## 3.12 Persistence
- `Publication` references and statuses persist in Firestore; platform binaries and
  credentials remain external/server-side.

## 3.13 Workflow State
- Scheduled → published evidence; partial publication continues to Stage 12
  reconciliation rather than falsely completing all platforms.

## 3.14 Audit
- Each publication attempt/result and actor is audited; exact event names **UNVERIFIED**.

## 3.15 Error States
- Platform outage, credentials, duplicate publication, invalid URL, partial success,
  network failure, and unauthorized execution.

## 3.16 Empty States
- No scheduled package is a prerequisite state; no publication results is distinct
  from failed retrieval.

## 3.17 Next Action
- Publication evidence proceeds to Platform Sync; failed platforms expose controlled
  retry without duplicating successful platforms.

## 3.18 Role Visibility
- Publishing manager/publisher executes; other roles view status only.

## 3.19 Performance
- Execute platforms independently, show per-platform progress, and avoid duplicate
  requests. Target: **TBD**.

## 3.20 Acceptance Criteria
- Publishing components/services exist. External publication, idempotency, audit,
  and integration coverage are **UNVERIFIED**.
