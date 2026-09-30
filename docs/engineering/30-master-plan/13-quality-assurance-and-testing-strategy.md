# Step 30: 13 — Quality Assurance & Testing Strategy

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Quality Assurance & Automated Testing Blueprint  
**Status:** **AUTHORITATIVE BLUEPRINT**  
**Date:** 2026-09-29  

---

## 1. Testing Pyramid & Target Coverage

To ensure long-term stability and prevent regression across the 15-stage workflow, BP-CMS adopts a strict testing hierarchy:

```
        / \
       / E2E \       15% — Playwright E2E Tests (Complete 15-stage journeys)
      /───────\
     / Integr. \     35% — Vitest Integration Tests (API + DB Transactions)
    /───────────\
   /  Unit Tests \   50% — Vitest Unit Tests (State machines, Zod, RBAC)
  /───────────────\
```

---

## 2. Core E2E Test Suite Matrix (Playwright)

| Test Suite | Scenario Covered | Assertions |
| :--- | :--- | :--- |
| `01-question-lifecycle.spec.ts` | Author draft -> Verify -> Canonicalize -> Reload page | Asserts zero 404s, ID updates from `BP-DFT-*` to `BP-Q-*` |
| `02-recording-to-edit.spec.ts` | Claim studio -> Upload raw -> Claim edit directly | Asserts direct transition without multi-hop PATCH bypass |
| `03-rbac-route-guards.spec.ts` | Attempt unauthorized route mounts across 12 roles | Asserts 403 Forbidden redirects and zero API leaks |
| `04-publishing-pipeline.spec.ts`| QC pass -> Thumbnail attach -> Social config -> Publish | Asserts single-transaction status update across all entities |
| `05-intelligence-loop.spec.ts` | Metric ingest -> Diagnosis -> 1-click topic creation | Asserts feedback loop pre-populates Stage 01 studio workspace |

---

## 3. Continuous Integration Release Gates

1. **Pre-Commit Hook:** Linting (ESLint), TypeScript compilation check (`tsc --noEmit`), and Unit tests must pass.
2. **Pull Request Gate:** Vitest integration tests and schema migration dry-runs must achieve 100% pass rate.
3. **Staging Deployment Gate:** Full Playwright E2E test run against staging environment before promoting to production.
