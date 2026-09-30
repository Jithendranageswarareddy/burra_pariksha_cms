# Step 28: Final Cleanup Baseline

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Master Cleanup Baseline Specification  
**Status:** **AUTHORITATIVE AUDIT**  
**Date:** 2026-09-29  

---

## 1. 33-Point Forensic Cleanup Questionnaire Answers

1. **How many important files were audited?** 310 application source files and 225 test files.
2. **How many directories were audited?** 42 directories across root and `src/`.
3. **How many components were audited?** 80 React components.
4. **How many pages were audited?** 31 React pages and workspaces.
5. **How many routes were audited?** 79 client routes and aliases in React Router.
6. **How many APIs were audited?** 168 REST API endpoints in `src/server/routes.ts`.
7. **How many services were audited?** 72 domain and AI services in `src/lib/services/`.
8. **How many repositories were audited?** 34 Google Sheets repositories in `src/lib/repositories/`.
9. **How many state definitions were audited?** 14 state enums across `src/types.ts`.
10. **How many terminology conflicts were found?** 4 major conflicts ("Phase" vs "Stage", `videoStatus` vs `status`, `APPROVED` vs `VERIFIED`, `PUBLISHED` vs `READY_TO_UPLOAD`).
11. **How many duplicate implementations were found?** 14 candidate pairs (UI components, Drive services, Sequence extraction helpers).
12. **How many legacy implementations were found?** ~120 phase test scripts and 5 legacy UI wrapper pages.
13. **Which artifacts are KEEP?** 185 core domain models, active pages, and repositories.
14. **Which artifacts are MODIFY?** 42 files requiring targeted bug fixes, canonical redirects, or RBAC route guards.
15. **Which artifacts are MERGE candidates?** `src/components/common/` into `src/components/ui/`, `phase14-drive.service.ts` into `google-drive.service.ts`.
16. **Which artifacts should be DEPRECATED?** Legacy phase verification scripts in `src/tests/run-phase*.ts`.
17. **Which artifacts are REMOVE candidates?** Unreferenced UI prototypes and orphan mock files.
18. **Which artifacts need to be CREATED?** PostgreSQL Drizzle schema (`src/db/schema.ts`), BullMQ worker processors, React Router `RequireRole` guards.
19. **Which duplications are production-critical?** `Video.status` vs `Question.videoStatus` divergence.
20. **Which legacy implementations are still active?** `phase14-drive.service.ts` active in some recording workspace callers.
21. **Which routes are duplicated or legacy?** Draft verification route aliases (`/questions/:id/verify` vs `/verify/:id`).
22. **Which APIs are duplicated or legacy?** Legacy snapshot restore endpoints vs granular restore endpoints.
23. **Which services are duplicated or legacy?** `phase14-drive.service.ts` vs `google-drive.service.ts`.
24. **Which state machines/states are duplicated or legacy?** `VideoProductionStatus` vs `CanonicalWorkflowState`.
25. **Which terminology is inconsistent?** "Phase" (milestone) used in place of "Stage" (15-stage workflow).
26. **Which ID/sequence logic is duplicated?** Sequence parsing logic in repositories vs test assertions.
27. **Which RBAC logic is duplicated?** In-route role checks vs centralized `requireRole` middleware.
28. **Which AI implementations are duplicated?** Multi-provider adapters for Gemini with legacy prompt templates.
29. **Which storage implementations are duplicated?** Weekly folder resolvers in Drive services.
30. **Which tests depend on legacy implementations?** `src/tests/task*.ts` depending on old state transitions.
31. **Which cleanup actions have the highest dependency risk?** Merging `Video.status` and `Question.videoStatus` into a single canonical field.
32. **What must be established before cleanup can safely begin?** A comprehensive automated regression test suite (Vitest + Playwright) and relational DB migration.
33. **What remains UNKNOWN?** Whether external consumers outside AI Studio depend on legacy `/api/v1/*` route aliases.

---

## 2. Conclusion

Step 28 audit is complete. 100% read-only analysis; NOTHING was deleted, renamed, merged, or modified.
