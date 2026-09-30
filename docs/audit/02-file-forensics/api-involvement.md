# API Involvement Map

**System:** Burra Pariksha Content Management System (BP-CMS)
**Audit Step:** 02 — Complete File-by-File Forensic Inventory
**Audit Date:** 2026-09-28

Total files participating in API definition, routing, or HTTP calls: **70**

| Path | Category | Role | Endpoints Defined / Handled / Called |
| :--- | :--- | :--- | :--- |
| `01-product-truth.md` | undefined | Client Fetcher | `/api/*` endpoints |
| `02-repository-inventory.md` | undefined | Client Fetcher | `/api/*` endpoints |
| `03-routing-navigation-audit.md` | undefined | Client Fetcher | `/api/*` endpoints |
| `04-page-workflow-map.md` | undefined | Client Fetcher | `/api/*` endpoints |
| `05-backend-data-map.md` | undefined | Client Fetcher | `/api/*` endpoints |
| `06-canonical-architecture.md` | undefined | Client Fetcher | `/api/*` endpoints |
| `08-production-workflow-verification.md` | undefined | Client Fetcher | `/api/*` endpoints |
| `08-workflow-convergence-implementation.md` | undefined | Client Fetcher | `/api/*` endpoints |
| `09-api-convergence-implementation.md` | undefined | Client Fetcher | `/api/*` endpoints |
| `09-production-hardening.md` | undefined | Client Fetcher | `/api/*` endpoints |
| `10-production-readiness.md` | undefined | Client Fetcher | `/api/*` endpoints |
| `10-service-convergence-implementation.md` | undefined | Client Fetcher | `/api/*` endpoints |
| `11-legacy-removal-implementation.md` | undefined | Client Fetcher | `/api/*` endpoints |
| `12-data-ownership-implementation.md` | undefined | Client Fetcher | `/api/*` endpoints |
| `12-final-verification-report.md` | undefined | Client Fetcher | `/api/*` endpoints |
| `AUTHENTICATION-REFRESH-TOKEN-FORENSIC-AUDIT.md` | undefined | Client Fetcher | `/api/*` endpoints |
| `bun.lock` | undefined | Client Fetcher | `/api/*` endpoints |
| `package.json` | undefined | Client Fetcher | `/api/*` endpoints |
| `scripts/execute-production-baseline-reset.ts` | undefined | Client Fetcher | `/api/*` endpoints |
| `scripts/final-baseline-read-only-audit.ts` | undefined | Client Fetcher | `/api/*` endpoints |
| `scripts/verify-drive-state.ts` | undefined | Client Fetcher | `/api/*` endpoints |
| `server.ts` | undefined | Express Server Bootstrap | `/api/*` endpoints |
| `src/components/video/EditingWorkspace.tsx` | undefined | Client Fetcher | `/api/*` endpoints |
| `src/components/video/ThumbnailWorkspace.tsx` | undefined | Client Fetcher | `/api/*` endpoints |
| `src/lib/ai/gemini.service.ts` | undefined | Client Fetcher | `/api/*` endpoints |
| `src/lib/ai/index.ts` | undefined | Client Fetcher | `/api/*` endpoints |
| `src/lib/ai/phase24-registry.ts` | undefined | Client Fetcher | `/api/*` endpoints |
| `src/lib/ai/providers/cerebras.adapter.ts` | undefined | Client Fetcher | `/api/*` endpoints |
| `src/lib/ai/providers/cohere.adapter.ts` | undefined | Client Fetcher | `/api/*` endpoints |
| `src/lib/ai/providers/experimental-labs.adapter.ts` | undefined | Client Fetcher | `/api/*` endpoints |
| `src/lib/ai/providers/groq.adapter.ts` | undefined | Client Fetcher | `/api/*` endpoints |
| `src/lib/ai/providers/huggingface.adapter.ts` | undefined | Client Fetcher | `/api/*` endpoints |
| `src/lib/ai/providers/mistral.adapter.ts` | undefined | Client Fetcher | `/api/*` endpoints |
| `src/lib/ai/providers/openrouter.adapter.ts` | undefined | Client Fetcher | `/api/*` endpoints |
| `src/lib/ai/providers/xai.client.ts` | undefined | Client Fetcher | `/api/*` endpoints |
| `src/lib/ai/schemas/thumbnail-intelligence.schema.ts` | undefined | Client Fetcher | `/api/*` endpoints |
| `src/lib/ai/validators/blind-verifier.ts` | undefined | Client Fetcher | `/api/*` endpoints |
| `src/lib/api-client.ts` | undefined | Client Fetcher | `/api/*` endpoints |
| `src/lib/ownership/data-ownership.ts` | undefined | Client Fetcher | `/api/*` endpoints |
| `src/lib/services/comment-intelligence.service.ts` | undefined | Client Fetcher | `/api/*` endpoints |
| `src/lib/services/google-drive.service.ts` | undefined | Client Fetcher | `/api/*` endpoints |
| `src/lib/services/phase26-copilot.service.ts` | undefined | Client Fetcher | `/api/*` endpoints |
| `src/lib/validation/multi-layer-verification.engine.ts` | undefined | Client Fetcher | `/api/*` endpoints |
| `src/pages/PlanningPage.tsx` | undefined | Client Fetcher | `/api/*` endpoints |
| `src/pages/VideoThumbnailPage.tsx` | undefined | Client Fetcher | `/api/*` endpoints |
| `src/server/middleware/auth.middleware.ts` | undefined | Express Auth Middleware | `/api/*` endpoints |
| `src/server/routes.ts` | undefined | Express Core Router | `/api/*` endpoints |
| `src/server/test-routes.ts` | undefined | Client Fetcher | `/api/*` endpoints |
| `src/tests/comprehensive-e2e-suite.ts` | undefined | API Test Harness | `/api/*` endpoints |
| `src/tests/negative-tests.ts` | undefined | API Test Harness | `/api/*` endpoints |
| `src/tests/phase10-publishing-verification.ts` | undefined | API Test Harness | `/api/*` endpoints |
| `src/tests/phase14-step2-verification.ts` | undefined | API Test Harness | `/api/*` endpoints |
| `src/tests/phase14-step3-verification.ts` | undefined | API Test Harness | `/api/*` endpoints |
| `src/tests/phase24-ai-orchestrator.ts` | undefined | API Test Harness | `/api/*` endpoints |
| `src/tests/phase7-real-drive-e2e.ts` | undefined | API Test Harness | `/api/*` endpoints |
| `src/tests/qs19b-runtime-verification.ts` | undefined | API Test Harness | `/api/*` endpoints |
| `src/tests/qs19d-server-static-serving.test.ts` | undefined | API Test Harness | `/api/*` endpoints |
| `src/tests/question-studio-config-integration.test.ts` | undefined | API Test Harness | `/api/*` endpoints |
| `src/tests/task2e2-video-script-versioning.ts` | undefined | API Test Harness | `/api/*` endpoints |
| `src/tests/task2e3-thumbnail-workflow.ts` | undefined | API Test Harness | `/api/*` endpoints |
| `src/tests/task2e4-pinned-comment-workflow.ts` | undefined | API Test Harness | `/api/*` endpoints |
| `src/tests/task2e5-publishing-workflow.ts` | undefined | API Test Harness | `/api/*` endpoints |
| `src/tests/task3f49-full-restore-ui-verification.ts` | undefined | API Test Harness | `/api/*` endpoints |
| `src/tests/task3f49-recovery-admin-status-ui-verification.ts` | undefined | API Test Harness | `/api/*` endpoints |
| `src/tests/task3f49-recovery-dry-run-ui-verification.ts` | undefined | API Test Harness | `/api/*` endpoints |
| `src/tests/task3f49-recovery-security-verification.ts` | undefined | API Test Harness | `/api/*` endpoints |
| `src/tests/task3f49-recovery-snapshot-history-ui-verification.ts` | undefined | API Test Harness | `/api/*` endpoints |
| `src/tests/task3f55-global-search-routing-verification.ts` | undefined | API Test Harness | `/api/*` endpoints |
| `src/tests/task7c-question-studio-quality-verification.ts` | undefined | API Test Harness | `/api/*` endpoints |
| `src/tests/unified-question-creation.test.ts` | undefined | API Test Harness | `/api/*` endpoints |
