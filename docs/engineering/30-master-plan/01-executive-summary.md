# Step 30: 01 — Executive Architectural Summary & Target Vision

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Executive Architecture Summary  
**Status:** **AUTHORITATIVE BLUEPRINT**  
**Date:** 2026-09-29  

---

## 1. Executive Summary

The Burra Pariksha Content Management System (BP-CMS) is the central operational hub for creating, producing, reviewing, publishing, and analyzing bilingual aptitude and educational examination content. Over 29 forensic audit steps, the system's codebase, data flows, APIs, UI workflows, and security mechanisms were comprehensively analyzed.

While BP-CMS demonstrates impressive functional breadth—including an interactive 15-stage workflow conveyor, multi-modal Gemini AI integration, bilingual Telugu/English question authoring, teleprompter recording tools, and analytics dashboards—its foundation currently suffers from critical architectural bottlenecks:
1. **Google Sheets as Primary Database:** High read/write latency (300ms–1500ms), 60 req/min quota throttling, lack of ACID transactions, and race-condition vulnerabilities during concurrent updates.
2. **State Machine Divergence:** Split status fields between `Question.videoStatus`, `Video.status`, and `Publishing.status`, requiring multi-hop API workarounds and causing silent state desynchronizations.
3. **Missing Frontend Route Authorization:** UI components rely on API authorization; direct URL navigation allows authenticated users of any role to mount administrative or privileged pages.
4. **Unintegrated Social Publishing & Analytics:** Social publishing and metrics tracking are manually triggered via UI stubs rather than asynchronous background workers.

This Master Engineering Plan articulates a complete, zero-loss transformation strategy to evolve BP-CMS into an enterprise-grade, resilient, multi-tenant content production engine.

---

## 2. Core Transformation Objectives

```
+-------------------------------------------------------------------------------------------------------+
|                                        BP-CMS TARGET ARCHITECTURE                                     |
+-------------------------------------------------------------------------------------------------------+
|  1. RELATIONAL CORE       | PostgreSQL / Cloud SQL via Drizzle ORM with strict ACID transactions      |
|  2. CANONICAL STATE       | Unified 15-Stage Finite State Machine (FSM) with audit-trailed transitions  |
|  3. ZERO-TRUST RBAC       | Multi-layer defense: React Router guards, Express middleware, Object ACLs |
|  4. ROBUST STORAGE        | Deterministic Google Drive hierarchy with automated folder provisioning   |
|  5. WORKER ENGINE         | Asynchronous BullMQ workers for video transcoding, YouTube API & metrics  |
|  6. CLOSED-LOOP AI        | Dynamic prompt optimization feeding Stage 15 intelligence back to Stage 1 |
+-------------------------------------------------------------------------------------------------------+
```

---

## 3. Key Quantitative Architectural Targets

| Metric | Current State | Target State | Engineering Strategy |
| :--- | :--- | :--- | :--- |
| **API Mutation Latency** | 450ms – 1,800ms | **< 35ms (p95)** | Relational DB indices, connection pooling, prepared statements |
| **Concurrent Creators** | 3–5 simultaneous users | **150+ active creators** | PostgreSQL row-level locks, transactional isolation |
| **State Consistency** | 3 separate status columns | **100% Single Source of Truth** | Centralized `WorkflowState` entity with ACID state history |
| **Publishing Automation**| Manual checkbox stubs | **100% Automated Background API**| Resilient BullMQ queues with exponential backoff & OAuth 2.0 |
| **Recovery Time (RTO)** | 4–12 hours (Manual sheet restore) | **< 15 minutes** | Automated Point-in-Time Recovery (PITR) & daily snapshots |
| **Recovery Point (RPO)** | 24 hours | **< 5 minutes** | Continuous WAL archiving in Google Cloud SQL |
| **Test Coverage** | 0% automated integration tests | **> 85% E2E & Integration Coverage** | Vitest + Playwright full pipeline test harness |

---

## 4. Architectural Target Topology

```
[ Creators / Editors / Managers / Admins ]
                    │
                    ▼ HTTPS
     [ Google Cloud CDN / Cloud Run ]
                    │
       ┌────────────┴────────────┐
       ▼                         ▼
 [ React 19 SPA (Vite) ]   [ Express REST API Server (Node.js/TS) ]
 (Tailwind + Lucide)       ├── Auth & RBAC Middleware (JWT / HMAC)
                           ├── Canonical State Machine Engine
                           ├── Gemini AI Synthesis Core
                           └── REST Controllers (Zod Validated)
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 ▼                       ▼                       ▼
      [ Cloud SQL PostgreSQL ]   [ Google Drive Storage ]   [ Redis / BullMQ ]
      (Authoritative Database)   (Raw/Edited MP4 & Assets)  (Asynchronous Jobs)
                 │                                               │
                 │                                               ▼
                 │                                    [ External API Connectors ]
                 │                                    ├── YouTube Data API v3
                 │                                    ├── Meta Graph API (Insta)
                 │                                    └── X / Twitter API v2
                 ▼
      [ GCP Cloud Storage Archive ]
      (Hourly Disaster Recovery Backups)
```

This target topology eliminates single points of failure, provides sub-second UI responsiveness, enforces strict role boundaries, and ensures end-to-end data integrity.
