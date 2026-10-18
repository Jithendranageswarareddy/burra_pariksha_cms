# BURRA PARIKSHA CMS — FIVE-PASS QUALITY HARDENING BASELINE

**Repository:** `Jithendranageswarareddy/burra_pariksha_cms`
**Date:** Post-Sprint 10 Release Baseline
**Document Location:** `docs/quality/HARDENING-BASELINE.md`
**Authority:** `AGENTS.md`, Five-Pass Autonomous End-to-End Hardening Program
**Deployment Authority:** Project owner manual deployment only. Zero automated production mutations.

---

## 1. Executive Baseline & Initial Audit State

The five-pass hardening program establishes an auditable quality baseline across all functional surfaces:
1. **Frontend UI/UX & Client Reliability:** Evaluates state management, form validation, dirty tracking, accessibility, responsive rendering, and audience preview segregation across all three content modes.
2. **Backend API Contracts & Security:** Evaluates route validation, error envelopes, authentication, RBAC, strict anti-self-approval (GAR-02), and optimistic concurrency control (OCC).
3. **Firestore Persistence & Concurrency:** Evaluates datastore authority, transactional isolation, schema mapping, query efficiency, and fail-closed isolation guards.
4. **AI Providers & Secret Hygiene:** Evaluates provider abstractions, bounded retries, quota/timeout handling, sanitized error propagation, and zero secret leakage.
5. **Full System Integration & Release Gate:** Consolidated verification across all three content modes (`QUESTION_CHALLENGE_SHORT`, `TOPIC_INTRODUCTION`, `EXPLAINED_QUESTIONS_VIDEO`).

---

## 2. Initial Architectural Inventory & Physical Boundaries

- **Authoritative Datastore:** Cloud Firestore collection `question_drafts` (Zero Google Sheets, SQLite, or secondary runtime stores).
- **Taxonomy:** Canonical two-tier `Topic -> Subtopic` schema (Category obsolete).
- **Workflow:** Authoritative 15-stage workflow (`Stage 01` through `Stage 15`).
- **Modes Registered:**
  - Mode 1: `QUESTION_CHALLENGE_SHORT` (9:16 vertical, 1 MCQ, <= 58s duration, 10-point proof checklist).
  - Mode 2: `TOPIC_INTRODUCTION` (9:16 or 16:9, strictly 0 questions, 15 char min concept, 5-point concept checklist).
  - Mode 3: `EXPLAINED_QUESTIONS_VIDEO` (16:9 landscape, {5, 10, 15, 20} questions, 10-point proof checklist).
- **Physical Boundary Gates:** Enforced by `tests/architecture/s7-frontend-backend-boundary.test.ts` (Zero backend/database imports in frontend; zero frontend imports in backend).

---

## 3. Tooling & Test Command Baseline

| Gate / Suite | Script Command | Baseline Status | Notes |
| :--- | :--- | :---: | :--- |
| **TypeScript Static Check** | `npm run lint` | PASS | 0 type errors across frontend, backend, shared, and tests. |
| **Topic Intro Unit Tests** | `npm run test:s10-t16` | PASS | 8/8 unit tests passing. |
| **Explained Questions Unit Tests** | `npm run test:s10-t17` | PASS | 8/8 unit tests passing. |
| **Multi-Mode Integration Tests** | `npm run test:s10-t18` | PASS | 6/6 integration tests passing. |
| **Launch Closure Regression** | `npx tsx tests/unit/question-generation/s9-s10-launch-closure.unit.test.ts` | PASS | 5/5 launch closure tests passing. |
| **Architecture Boundaries** | `npm run test:architecture` | PASS | 5/5 architectural gates passing. |
| **Datastore Isolation Guard** | `npm run test:isolation` | PASS | 8/8 fail-closed isolation tests passing. |
| **Production Build** | `npm run build` | PASS | Vite client and esbuild server bundles clean. |

---

## 4. Hardening Program Roadmap

- **Pass 1:** Frontend UI, UX, Accessibility, Forms, and Client-Side Reliability (`HARDENING-PASS-1.md`).
- **Pass 2:** Backend, API Contracts, Authentication, RBAC, and Workflow Security (`HARDENING-PASS-2.md`).
- **Pass 3:** Firestore Persistence, Data Integrity, Concurrency, and Isolation (`HARDENING-PASS-3.md`).
- **Pass 4:** AI Providers, Key Safety, Generation Quality, and Failure Recovery (`HARDENING-PASS-4.md`).
- **Pass 5:** Complete System Integration, Regression, and Deployment Readiness (`HARDENING-PASS-5.md` & `HARDENING-FINAL-REPORT.md`).
