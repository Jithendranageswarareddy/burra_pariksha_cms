# Repository Terminology Cleanup: 06 — Rename & Normalization Map

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Domain Rename & Normalization Map  
**Status:** **AUTHORITATIVE MAP**  
**Date:** 2026-09-29  

---

## 1. Domain Service & Repository Mapping

| Legacy / Numbered Identifier | Canonical Domain Implementation | Responsibility | Status |
| :--- | :--- | :--- | :---: |
| `phase12-workflow.service.ts` | `workflow-orchestration.service.ts` | Step-by-step state machine orchestration | **CANONICAL** |
| `phase13-refinement.service.ts` | `question-config.service.ts` / `question.service.ts` | Question refinement & style tuning | **CANONICAL** |
| `phase14-drive.service.ts` | `google-drive.service.ts` | Google Drive weekly folder & media uploads | **CANONICAL** |
| `phase15-script-production.service.ts`| `script.service.ts` | Teleprompter script authoring & word timing | **CANONICAL** |
| `phase17-video-production.service.ts` | `video.service.ts` | Video recording & take management | **CANONICAL** |
| `phase18-thumbnail-intelligence.service.ts`| `thumbnail.service.ts` | Thumbnail concept generation | **CANONICAL** |
| `phase19-pinned-comment-intelligence.service.ts`| `pinned-comment.service.ts` | Pinned comment generation | **CANONICAL** |
| `phase20-social-review.service.ts` | `social-review.service.ts` | Social copy & quality review | **CANONICAL** |
| `phase21-platform-adaptation.service.ts`| `platform-adaptation.service.ts` | Multi-platform post formatting | **CANONICAL** |
| `phase22-publishing-hub.service.ts`| `publishing.service.ts` | Multi-platform publishing schedules | **CANONICAL** |
| `phase23-production.service.ts` | `production-board.service.ts` | Production pipeline overview | **CANONICAL** |
| `phase25-consensus.service.ts` | `consensus.engine.ts` | Multi-layer AI verification consensus | **CANONICAL** |
| `phase26-copilot.service.ts` | `studio-copilot.service.ts` | In-studio AI presenter copilot | **CANONICAL** |
| `phase20-social-reviews.repository.ts`| `social-reviews.repository.ts` | Social review Google Sheets store | **CANONICAL** |
| `phase22-publishing.repository.ts` | `publishing.repository.ts` | Publishing records Google Sheets store | **CANONICAL** |
| `phase24-orchestrator.service.ts` | `orchestrator.ts` (in `lib/ai/`) | Multi-provider AI orchestration core | **CANONICAL** |
| `phase24-registry.ts` | `registry.ts` (in `lib/ai/`) | AI provider model registry | **CANONICAL** |
| `phase24-ai.ts` | `types/index.ts` (domain types) | AI orchestration type definitions | **CANONICAL** |
