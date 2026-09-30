# SDLC Pre-Gate: 02 — Phase Terminology Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Phase Terminology & Reference Inventory  
**Status:** **AUTHORITATIVE ANALYSIS**  
**Date:** 2026-09-29  

---

## 1. Inventory of Phase-Named Artifacts

### 1.1 Services in `src/lib/services/`
1. `phase12-workflow.service.ts` → Workflow orchestration & stage transition logic
2. `phase13-refinement.service.ts` → Question refinement & AI prompt tuner
3. `phase14-drive.service.ts` → Google Drive weekly folder resolver & upload service
4. `phase15-script-production.service.ts` → Teleprompter script authoring & word timing
5. `phase17-video-production.service.ts` → Video recording state management & take tracking
6. `phase18-thumbnail-intelligence.service.ts` → AI prompt generator for thumbnail design
7. `phase19-pinned-comment-intelligence.service.ts` → Community pinned comment generator
8. `phase20-social-review.service.ts` → Multi-platform social copy review & approval
9. `phase21-platform-adaptation.service.ts` → YouTube / Instagram / Facebook formatting
10. `phase22-publishing-hub.service.ts` → Publishing calendar & multi-platform schedule
11. `phase23-production.service.ts` → Production board overview & team workload
12. `phase25-consensus.service.ts` → Multi-agent AI validation consensus
13. `phase26-copilot.service.ts` → Real-time assistant for studio presenters

### 1.2 Repositories in `src/lib/repositories/`
1. `phase20-social-reviews.repository.ts` → Social reviews sheet store
2. `phase22-publishing.repository.ts` → Publishing records sheet store

### 1.3 Types in `src/types/`
1. `phase24-ai.ts` → Multi-provider AI definitions
2. `phase25-consensus.ts` → Consensus validation definitions
3. `phase26-copilot.ts` → Studio copilot definitions

### 1.4 AI Modules in `src/lib/ai/`
1. `phase24-orchestrator.service.ts` → AI provider orchestration engine
2. `phase24-registry.ts` → AI provider model registry

### 1.5 Package Scripts in `package.json`
- `test:phase03` through `test:phase30` (27 phase-named test scripts)

---

## 2. Professional Terminology Mapping

| Category | Legacy Terminology | Canonical Target Terminology |
| :--- | :--- | :--- |
| **Business Pipeline** | `Phase 01` – `Phase 15` | **Stage 01** – **Stage 15** (Canonical Business Workflow) |
| **Engineering Tasks** | `Phase 1 Implementation` | **Work Package 001** – **Work Package N** (SDLC Delivery) |
| **Historical Audits** | `Step 01` – `Step 30` | **Audit Step 01** – **Audit Step 30** (Traceability Maintained) |
| **Services & Repos** | `phaseXX-*.service.ts` | **Domain Services** (e.g. `workflow-orchestration.service.ts`) |
