# Step 27: Final Test System Baseline

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Master Test-System Baseline Specification  
**Status:** **AUTHORITATIVE AUDIT**  
**Date:** 2026-09-29  

---

## 1. 32-Point Forensic Test-System Questionnaire Answers

1. **How many test-related files exist?** 225 test and verification scripts in `src/tests/`.
2. **How many test frameworks exist?** 1 primary execution harness (`tsx` running standalone TypeScript scripts).
3. **How many unit tests exist?** ~35 isolated unit tests (e.g. `canonical-sequence-parsing.test.ts`, `qs21b-mathematical-safety-gate.test.ts`).
4. **How many component tests exist?** 0 React Testing Library component tests.
5. **How many API tests exist?** ~45 integration scripts testing Express routes and REST endpoints.
6. **How many integration tests exist?** ~80 service-to-repository integration scripts.
7. **How many workflow tests exist?** ~50 multi-step workflow verification scripts.
8. **How many state-machine tests exist?** ~15 tests validating state transitions (e.g. `stage02-video-transitions.test.ts`).
9. **How many E2E tests exist?** ~10 full-flow integration scripts (e.g. `comprehensive-e2e-suite.ts`).
10. **How many UI tests exist?** ~15 UI verification scripts (DOM inspection / headless checks).
11. **How many external-system tests exist?** ~25 scripts testing Google Sheets, Google Drive, and Gemini APIs.
12. **Which tests are CANONICAL?** 45 core regression tests including `canonical-sequence-parsing.test.ts`, `d01-concurrency-protection.test.ts`, `stage02-video-transitions.test.ts`, `test-isolation-safety-gate.test.ts`.
13. **Which are LEGACY?** ~120 phase-specific incremental scripts (`phase03` through `phase12`, `task3d*`, `task3f*`).
14. **Which are DUPLICATE?** ~40 scripts duplicating basic CRUD assertions across multiple task files.
15. **Which are OBSOLETE?** ~20 scripts targeting removed UI components or legacy 5-stage workflows.
16. **Where is coverage MISSING?** Automated YouTube Data API v3 integration, Meta Graph API publishing, and client-side React Router role guards.
17. **Which tests are flaky?** Scripts relying on live Google Sheets API network calls without retry backoff.
18. **Which tests are mutation-risk?** `phase09-publishing-workflow-verification.ts`, `phase14-real-drive-e2e.ts`, `phase7-real-drive-e2e.ts`.
19. **Which tests touch Google Sheets?** Any script executed without `SKIP_SHEETS_SYNC=true`.
20. **Which tests touch Google Drive?** `phase14-real-drive-e2e.ts`, `phase7-real-drive-e2e.ts`, `thumbnail-real-upload-workflow.test.ts`.
21. **Which tests touch databases?** 0 (Current persistence uses Google Sheets).
22. **Which tests call Gemini?** `phase-7-ai-generation-engine.ts`, `task2d-gemini-verification.ts`.
23. **Which tests touch production-like resources?** All un-sandboxed phase verification scripts.
24. **Which tests depend on execution order?** Legacy phase runners (`run-phase*.ts`).
25. **Which tests depend on external services?** Live Drive and Gemini verification tests.
26. **Which tests conflict with the 15-stage workflow?** Legacy scripts assuming 5-stage or 10-stage milestones.
27. **Which tests conflict with the current state machine?** Scripts expecting direct `QUEUED -> EDITING` transition without 3-hop PATCH workaround.
28. **What does QUEUED → EDITING look like from the test perspective?** Rejection in `stage02-video-transitions.test.ts`, bypassed in UI integration scripts.
29. **What does Video.status vs Question.videoStatus look like from the test perspective?** Separate asserts in `stage02-video-transitions.test.ts` acknowledging the dual-field divergence.
30. **What important behavior has no meaningful test?** Automated YouTube upload retry queues, Instagram Reel publishing, and fine-grained object ownership edge cases.
31. **What are the highest-risk test-system problems?** Live sheet mutation and lack of unified test runner (`TEST-CRIT-01`, `TEST-HIGH-01`).
32. **What remains UNKNOWN?** Exact execution frequency in historical CI environments prior to AI Studio migration.

---

## 2. Conclusion

Step 27 audit is complete. 100% read-only analysis; zero test scripts executed in mutating mode, zero files modified.
