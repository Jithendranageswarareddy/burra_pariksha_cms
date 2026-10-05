# Current Sprint: Sprint 2

**Sprint:** 2  
**Name:** System Stabilization & Golden Path  
**Status:** IN PROGRESS (S2-T08 Live UAT & Republish Pending)  
**Start Date:** 2026-10-04  
**Primary Target:** End-to-end Question Golden Path (Creation -> Verification -> Approval -> State Update -> Audit -> Persistence Proof)

## Sprint 2 Task Breakdown

| Task ID | Task Name | Priority | Status | Description |
| :--- | :--- | :---: | :---: | :--- |
| **S2-T01** | **Baseline Freeze** | P0 | DONE | Verify GitHub main import, establish immutable baseline report, confirm 0 build/lint/test errors. |
| **S2-T02** | **Runtime Recovery** | P0 | DONE | Verify dev server, API endpoints, and client-side bundle execution in AI Studio runtime. |
| **S2-T03** | **Environment Stabilization** | P0 | DONE | Map all local secrets and environment variables required for full integration. |
| **S2-T04** | **Architecture / Route Cleanup Map** | P1 | DONE | Formulate route and service dependency map to isolate legacy vs canonical paths. |
| **S2-T05** | **Question Golden Path** | P0 | DONE | Execute complete slice: Create -> Save -> Library -> Detail -> Verify -> Approve -> Workflow update. |
| **S2-T06** | **Real Persistence Proof** | P0 | DONE | Verify read-back persistence after full browser refresh and database restart. |
| **S2-T07** | **Regression / Smoke Tests** | P1 | DONE | Execute comprehensive smoke tests across auth, rbac, db, audit, and workflow modules. |
| **S2-T08** | **AI Studio Published App & Live Human UAT** | P0 | INCOMPLETE | Verify actual published custom URL `burraparikshacontentmanagementsystem.ai.studio` and human UAT workflow. |

---

## S2-T08 Google AI Studio Published Application & Live UAT Record

- **Actual Application URL:** `https://burraparikshacontentmanagementsystem.ai.studio/`
- **Application Identification:**
  - Associated with this project: **YES**
  - Page Title: `Burra Pariksha CMS`
  - Server Engine: Express on Google Frontend
  - Backend Datastore Mode: `GOOGLE_SHEETS_PRODUCTION`
- **Live Endpoint Verification:**
  - `/readyz`: **200 OK** (`{"status":"ok","checks":{"database":"UP","drive":"OAUTH2"}}`)
  - `/api/health`: **200 OK** (`mode: "GOOGLE_SHEETS_PRODUCTION"`, `databaseConfigured: true`)
  - `/healthz`: HTTP 404 (Intercepted by Google Cloud Frontend edge router; internal application health handled by `/readyz` and `/api/health`)
- **Live Production Authentication:**
  - `POST /api/v1/auth/login` (Jithendra, `USR-001`): **200 OK** — JWT session token issued, HTTP-only `bp_session` cookie set.
  - `GET /api/v1/auth/me`: **200 OK** — Authenticated identity verified.
- **Live Production Question Draft Creation & Persistence:**
  - `POST /api/questions/draft`: **201 Created** — Draft created in production (ID: `BP-DFT-726236-OCIR`).
  - `GET /api/questions/draft/:id`: **200 OK** — Content verified bit-for-bit from production datastore.
  - `POST /api/questions/draft/:id/approve` (Self-approval by creator): **403 Forbidden** — GAR-02 anti-self-approval rule strictly enforced.
- **Published Version Comparison:**
  - Published Frontend Asset: `/assets/index-x4hr5DDC.js` (Build from Oct 4)
  - Current Compiled Asset: `/assets/index-BIjR7gFE.js` (Compiled cleanly Oct 5 via `compile_applet`)
  - Finding: **CURRENT BUILD != PUBLISHED VERSION**.
  - In the Oct 4 published revision, Surendra Reddy (`USR-002`) holds single-role `VIDEO_EDITOR` (which lacks `QUESTION:APPROVE`). In the current Sprint 2 codebase, multi-role RBAC (`CONTENT_MANAGER`, `REVIEWER`, `VIDEO_EDITOR`) enables independent review.
- **Action Required to Complete S2-T08:**
  - Trigger **Publish / Republish** in Google AI Studio to deploy the latest compiled build (`index-BIjR7gFE.js`) to `https://burraparikshacontentmanagementsystem.ai.studio/`.
  - Conduct final multi-role live human review on the republished URL.
- **Final Task Status:** **INCOMPLETE** (Pending AI Studio Republish action by user).
