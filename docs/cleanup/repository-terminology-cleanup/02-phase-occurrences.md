# Repository Terminology Cleanup: 02 — Phase Occurrences Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Phase Terminology Elimination Inventory  
**Status:** **AUTHORITATIVE AUDIT**  
**Date:** 2026-09-29  

---

## 1. Inventory of Phase-Named Artifacts in Active Source Code

### 1.1 Services (`src/lib/services/`)
1. `phase12-workflow.service.ts` → Canonical: `workflow-orchestration.service.ts` / `workflow.service.ts`
2. `phase13-refinement.service.ts` → Canonical: `question-refinement.service.ts`
3. `phase14-drive.service.ts` → Canonical: `google-drive.service.ts`
4. `phase15-script-production.service.ts` → Canonical: `script.service.ts`
5. `phase17-video-production.service.ts` → Canonical: `video.service.ts`
6. `phase18-thumbnail-intelligence.service.ts` → Canonical: `thumbnail.service.ts`
7. `phase19-pinned-comment-intelligence.service.ts` → Canonical: `pinned-comment.service.ts`
8. `phase20-social-review.service.ts` → Canonical: `social-review.service.ts`
9. `phase21-platform-adaptation.service.ts` → Canonical: `platform-adaptation.service.ts`
10. `phase22-publishing-hub.service.ts` → Canonical: `publishing.service.ts`
11. `phase23-production.service.ts` → Canonical: `production-board.service.ts`
12. `phase25-consensus.service.ts` → Canonical: `consensus.engine.ts` (in `src/lib/validation/`)
13. `phase26-copilot.service.ts` → Canonical: `studio-copilot.service.ts`

### 1.2 Repositories (`src/lib/repositories/`)
1. `phase20-social-reviews.repository.ts` → Canonical: `social-reviews.repository.ts`
2. `phase22-publishing.repository.ts` → Canonical: `publishing.repository.ts`

### 1.3 Types (`src/types/`)
1. `phase24-ai.ts` → Canonical: `ai-orchestration.types.ts`
2. `phase25-consensus.ts` → Canonical: `ai-consensus.types.ts`
3. `phase26-copilot.ts` → Canonical: `studio-copilot.types.ts`

### 1.4 AI Modules (`src/lib/ai/`)
1. `phase24-orchestrator.service.ts` → Canonical: `orchestrator.ts`
2. `phase24-registry.ts` → Canonical: `registry.ts`

---

## 2. Classification of Remaining References

All phase terminology in historical audit records (`docs/audit/`) is strictly isolated from active application execution and maintained solely for forensic traceability.
