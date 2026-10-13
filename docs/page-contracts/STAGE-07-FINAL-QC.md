# Stage 07 — Final QC

## 3.1 Page Identity
- Shared route `/videos/:videoId?tab=final-review`; `FinalReviewWorkspace`;
  **Reviewed**. Related FC-012.

## 3.2 Purpose
- Certify the master cut against the six-point QC gate.

## 3.3 Entry Condition
- Edited/master-cut video in final review and independent QC capability.

## 3.4 Required Data
- Master media, QC checklist, audio/timing/safe-zone evidence, reviewer identity,
  remarks, and current status.

## 3.5 GET Requests
- Video/QC context uses typed APIs; exact endpoint composition **UNVERIFIED**.

## 3.6 User Inputs
- Six checklist outcomes, remarks, and certify/request-changes action. Media is
  read-only during review.

## 3.7 Defaults
- Pending checklist with no implicit pass; exact checklist defaults **UNVERIFIED**.

## 3.8 Primary Action
- Certify or request changes. GAR-02 and all QC gates must pass; certification
  cannot publish.

## 3.9 API Request
- Video status/QC API submits checklist and expected version; backend validates.

## 3.10 Backend Use Case
- Video production/QC service, workflow, audit, repository.

## 3.11 Response
- Certified response enables thumbnail/publishing prerequisites; changes remain
  in editing/review according to backend state.

## 3.12 Persistence
- QC status/remarks persist with video/edit metadata in Firestore; exact schema
  **UNVERIFIED**.

## 3.13 Workflow State
- Final review → ready to upload when certified; failed QC routes to revision.

## 3.14 Audit
- Certification/rejection and checklist actor must be audited; event names **UNVERIFIED**.

## 3.15 Error States
- Incomplete checklist, GAR-02, missing master, stale version, invalid transition,
  network failure, and duplicate certification.

## 3.16 Empty States
- No QC queue: empty review state. No master: prerequisite error, not an empty
  successful checklist.

## 3.17 Next Action
- Certification proceeds to packaging/thumbnail; request changes returns to editing.

## 3.18 Role Visibility
- QC reviewer certifies; editor can view/fix; backend enforces independence.

## 3.19 Performance
- Load one review package, defer media preview, and prevent duplicate certification.
  Target: **TBD**.

## 3.20 Acceptance Criteria
- Final review workspace and statuses exist. Six-point persistence, GAR-02 E2E,
  audit, and measured performance are **UNVERIFIED**.
