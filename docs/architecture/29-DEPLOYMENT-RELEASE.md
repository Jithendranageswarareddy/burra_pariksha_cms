# Burra Pariksha CMS
# 29 — Deployment & Release Architecture

Stage: 29 — Deployment & Release Architecture

STATUS:
ACCEPTED — COMPLETE — CLOSED

Implementation Status:
COMPLETE

Technical Verification:
PASSED

GitHub Verification:
PASSED

Product Owner Acceptance:
ACCEPTED

Stage Closure:
CLOSED

Closure Date:
2026-10-02

Version:
1.1.0

Purpose:
Establishes the authoritative Deployment & Release Architecture for the Burra Pariksha Content Management System (BP-CMS).
Codifies:
1. **The Canonical Post-Acceptance Deployment Pipeline:**
   GitHub -> Commit -> Review -> Merge -> Deploy -> Cloud Run -> Smoke Test -> Workflow Test -> Release.
2. **The 13-Item Mandatory Release Checklist:**
   Strict prerequisites spanning GitHub, Automated Tests, Environment & Secrets, Database & Firestore, API Contracts, Frontend Build, Media Boundary, Authentication, RBAC & Capabilities, Workflow Integrity, Cloud Run Scale-to-Zero, Production Smoke Tests, and Rollback Procedures.
3. **Cloud Run Serverless Deployment & Cost Control:**
   Serverless containerized deployment with scale-to-zero (min-instances=0, max-instances=2, memory=512Mi, cpu=1), ensuring strict compliance with COST-001 (<= ₹100 INR/month ceiling).
4. **Zero-Downtime Rollback Plan:**
   Automated Cloud Run traffic diversion to previous known-good revision upon smoke test or workflow test failure.

---

## 01. Document Control

| Attribute | Specification | Evidence / Governance Note |
| :--- | :--- | :---: |
| **Document Title** | BP-CMS Stage 29 Deployment & Release Architecture | FACT |
| **File Path** | `docs/architecture/29-DEPLOYMENT-RELEASE.md` | FACT |
| **Document Stage** | Stage 29 — Deployment & Release | FACT |
| **Authority** | Master SDLC Release Standard | FACT |
| **Status** | ACCEPTED — COMPLETE — CLOSED | FACT |
| **Version** | `1.1.0` (Master SDLC Reset Baseline) | FACT |
| **Closure Date** | 2026-10-02 | FACT |
| **Preceding Verified Stages** | Stage 01 through Stage 28 (All Accepted & Closed) | FACT |
| **Subsequent Stages** | Stage 30 (Operational System Handoff & Governance) | FACT |
| **Hosting Platform** | Google Cloud Run (Containerized Monolith) | FACT |
| **Monthly Budget Ceiling** | <= ₹100 INR / month (Free Tier: 2M req, 360k vCPU-s) | FACT |

---

## 02. Canonical Post-Acceptance Deployment Pipeline

The transition from accepted code to live production follows an unskippable 8-stage sequential pipeline:

```
  ┌───────────────────────────────────────────────────────────────────────────┐
  │              CANONICAL POST-ACCEPTANCE DEPLOYMENT PIPELINE                │
  └─────────────────────────────────────┬─────────────────────────────────────┘
                                        │
                                        ▼
  ┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
  │   1. GITHUB COMMIT     │ ───► │       2. REVIEW        │ ───► │        3. MERGE        │
  │ • Clean working tree   │      │ • Peer & SME review    │      │ • Fast-forward merge   │
  │ • Deterministic SHA    │      │ • Antigravity audit    │      │ • Protected main branch│
  │ • Signed commit & tag  │      │ • Zero open blockers   │      │ • Release tag creation │
  └────────────────────────┘      └────────────────────────┘      └────────────────────────┘
                                                                               │
                                                                               ▼
  ┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
  │        6. RELEASE      │ ◄─── │   5. WORKFLOW TEST     │ ◄─── │     4. DEPLOY TO       │
  │ • Traffic at 100%      │      │ • End-to-end telemetry │      │        CLOUD RUN       │
  │ • Live status updated  │      │ • Telugu SME workflow  │      │ • Docker multi-stage   │
  │ • Release notes issued │      │ • Transition validation│      │ • Scale-to-zero config │
  └────────────────────────┘      └────────────────────────┘      └────────────────────────┘
              ▲                               │                                ▲
              │                               ▼                                │
              │                   ┌────────────────────────┐                   │
              │                   │     SMOKE TEST         │ ──────────────────┘
              │                   │ • /api/health ping     │      (If Failed: Trigger
              │                   │ • Route accessibility  │       Instant Rollback)
              │                   │ • Precondition checks  │
              └───────────────────┴────────────────────────┘
```

---

## 03. The 13-Item Mandatory Release Checklist

Every release must satisfy all 13 checklist items before receiving production release certification:

| # | Item Identifier | Domain | Verification Requirement | Failure Action |
| :-: | :--- | :--- | :--- | :--- |
| **01** | `GITHUB_COMMIT` | Version Control | Working tree 100% clean; deterministic commit SHA recorded; release tag generated (`vX.Y.Z`). | Block Deploy |
| **02** | `TESTS` | Quality Assurance | 100% pass on static compilation (`tsc`), unit tests, integration tests, 9-scenario matrix, and all historical regression suites (Stages 02–28). | Block Deploy |
| **03** | `ENVIRONMENT` | Configuration | Google Secret Manager secrets injected; `.env` keys validated against schema; zero plaintext secrets in repo; `CMS_TEST_ISOLATION=production`. | Block Deploy |
| **04** | `DATABASE` | Data Layer | Firestore Native security rules deployed; composite indexes active; optimistic concurrency control (OCC) preconditions verified. | Block Deploy |
| **05** | `API` | Integration | REST routes adhere to `ApiResponseEnvelope`; rate limits active (100 req/min); OpenAPI spec matching; CORS & Helmet security headers active. | Block Deploy |
| **06** | `FRONTEND` | Presentation | Vite client production build succeeds (`npm run build`); JS/CSS assets minified and cache-busted; SPA fallback routing verified (`dist/index.html`). | Block Deploy |
| **07** | `MEDIA` | Storage Boundary | Google Drive OAuth2 refresh token verified (`GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN`); folder permissions validated; AP-007/AP-008 metadata boundary strictly upheld. | Block Deploy |
| **08** | `AUTHENTICATION` | Security | `SESSION_SECRET` cryptographically secure; secure HTTP-only cookie configuration; refresh token rotation active; CSRF protections operational. | Block Deploy |
| **09** | `RBAC` | Authorization | Capability matrix enforced; `sessionVersion` user invalidation active; GAR-02 anti-self-approval rule inviolable in backend authority. | Block Deploy |
| **10** | `WORKFLOW` | Business Domain | Canonical 15-step sequence intact (`AP-001`); step transition validation active; closed-loop feedback path (Step 15 -> Step 01) operational. | Block Deploy |
| **11** | `CLOUD_RUN` | Infrastructure | Container built from production `Dockerfile`; `min-instances=0` (scale-to-zero); `max-instances=2`; `memory=512Mi`; `cpu=1`; PORT mapping valid; cost <= ₹100 INR/mo. | Block Deploy |
| **12** | `PRODUCTION_SMOKE_TEST`| Verification | Automated HTTP smoke test against live Cloud Run URL passes (`/api/health` 200 OK, SPA root 200 OK, read-only smoke ping). | Halt & Rollback |
| **13** | `ROLLBACK_PLAN` | Reliability | Previous known-good Cloud Run revision identified; automated traffic diversion command verified; non-destructive schema compatibility confirmed. | Block Deploy |

---

## 04. Cloud Run Configuration & Cost Ceiling Controls

To guarantee compliance with **COST-001** ($\le$ ₹100 INR/month total cloud expenditure) and **AP-012**, the Cloud Run service is strictly configured with:

1. **Scale-to-Zero (`min-instances = 0`):**
   - The container scales down to 0 instances when idle.
   - For our low-volume workload (1–5 questions/day, ~2–4 operational hours/day), active compute is ~15,000 vCPU-seconds/month (<5% of Google Cloud Run's free tier of 360,000 vCPU-seconds).
   - Compute Cost: **₹0.00 / month**.
2. **Concurrency & Resource Allocation:**
   - `cpu`: 1 vCPU
   - `memory`: 512 MiB
   - `concurrency`: 80 concurrent requests per instance
   - `max-instances`: 2 (ceiling prevents runaway costs)
   - `timeout`: 300 seconds (for batch processing and Drive upload tasks)
3. **Environment Port Mapping:**
   - Cloud Run automatically injects `$PORT` (default `8080`).
   - The Express application in `server.ts` binds dynamically to `process.env.PORT || 3000`.

---

## 05. Production Smoke Testing & Automated Rollback

### Automated Smoke Test Protocol
Immediately following Cloud Run revision deployment:
1. **Health Ping:** `GET /api/health` must return `200 OK` with `{ status: "ok", uptime: ..., timestamp: ... }`.
2. **SPA Entry Ping:** `GET /` must return `200 OK` with HTML content containing `Burra Pariksha`.
3. **Database Precondition Ping:** `GET /api/v1/health/db` must verify Firestore connectivity within $\le 500$ ms.
4. **Auth Handshake Ping:** `GET /api/v1/auth/session` must respond with `401 Unauthorized` for unauthenticated client (confirming auth guard is active).

### Instant Rollback Procedure
If any smoke test check fails or a critical workflow regression is detected:
```bash
# Divert 100% traffic immediately back to previous known-good Cloud Run revision
gcloud run services update-traffic burra-pariksha-cms \
  --project=burra-pariksha \
  --region=asia-south1 \
  --to-revisions=PREVIOUS_REVISION=100
```
- **Execution Time:** < 5 seconds.
- **Data Safety:** Backward-compatible Firestore schema ensures previous revision operates without data corruption.

---

## 06. Verification Gate Certification Criteria

A release receives formal **`ACCEPTED — COMPLETE — CLOSED`** certification only when:
1. All 13 items of the Release Checklist are verified as `true`.
2. Cloud Run configuration satisfies `min-instances=0` and cost ceiling $\le$ ₹100 INR/month.
3. Production smoke tests and workflow verification pass with 0 errors.
4. Rollback execution plan is registered and operational.
