# Step 30: 11 — Phased Implementation Roadmap

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Phased Engineering Execution Roadmap  
**Status:** **AUTHORITATIVE BLUEPRINT**  
**Date:** 2026-09-29  

---

## 1. Five-Phase Implementation Overview

To ensure risk-free deployment without disrupting ongoing content production, the implementation is divided into five sequential phases:

```
[ Phase 1: Stabilization & High-Severity Fixes ] ──► (Week 1–2)
                      │
                      ▼
[ Phase 2: Security, RBAC & Route Guards ] ────────► (Week 3–4)
                      │
                      ▼
[ Phase 3: Relational Persistence Migration ] ─────► (Week 5–6)
                      │
                      ▼
[ Phase 4: Async Worker & External Integrations ] ─► (Week 7–8)
                      │
                      ▼
[ Phase 5: Production Hardening & Telemetry ] ─────► (Week 9–10)
```

---

## 2. Phase-by-Phase Work Packages

### Phase 1: Stabilization & High-Severity Fixes (Weeks 1–2)
- **WP-1.1:** Resolve BRK-HD-01 (Draft Reload 404) via atomic canonical ID redirects.
- **WP-1.2:** Resolve BRK-HD-02 (`QUEUED -> EDITING` state barrier) by updating `StateTransitionGraph`.
- **WP-1.3:** Fix Video-Question status synchronization swallow in `video.service.ts`.
- **WP-1.4:** Reconcile dual design system imports between `src/components/ui/` and `src/components/common/`.

### Phase 2: Security, RBAC & Route Guards (Weeks 3–4)
- **WP-2.1:** Implement React Router `RequireRole` and `RequireCapability` page guards across all routes.
- **WP-2.2:** Add step-up MFA challenge for administrative recovery and database mutations.
- **WP-2.3:** Implement fine-grained `ObjectAuthService` anti-self-approval enforcement.
- **WP-2.4:** Standardize role enums and eliminate string literal drift across services.

### Phase 3: Relational Persistence Migration (Weeks 5–6)
- **WP-3.1:** Provision Cloud SQL PostgreSQL 16 instance and configure Drizzle ORM schemas.
- **WP-3.2:** Execute automated ETL script to migrate all 25 Google Sheets tabs into relational tables.
- **WP-3.3:** Enable dual-write synchronization between PostgreSQL and Google Sheets for validation.
- **WP-3.4:** Perform zero-downtime cutover to PostgreSQL as primary authoritative database.

### Phase 4: Async Worker & External Integrations (Weeks 7–8)
- **WP-4.1:** Provision Redis 7.2 instance and deploy BullMQ worker fleet.
- **WP-4.2:** Implement automated YouTube Data API v3 video upload and pinned comment worker.
- **WP-4.3:** Implement Meta Graph API v20.0 Instagram Reel publishing worker.
- **WP-4.4:** Build hourly/daily automated metrics ingestion workers with statistical anomaly detection.

### Phase 5: Production Hardening & Telemetry (Weeks 9–10)
- **WP-5.1:** Integrate OpenTelemetry distributed tracing and structured Pino logging.
- **WP-5.2:** Configure GCP Cloud Monitoring alerts, uptime checks, and SLA dashboards.
- **WP-5.3:** Deploy automated hourly database snapshot workers to Google Cloud Storage.
- **WP-5.4:** Execute end-to-end load tests (500 concurrent users) and final security penetration tests.
