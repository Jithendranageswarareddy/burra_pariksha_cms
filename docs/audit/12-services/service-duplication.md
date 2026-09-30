# Service Duplication Forensic Audit (6 Overlapping Service Pairs)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 27 of 30  

---

## 1. Executive Summary

Static analysis discovered **6 pairs of overlapping services** where modern domain services duplicate logic previously implemented in phase-specific service modules.

---

## 2. Duplicate Service Register

| Modern Domain Service | Legacy / Overlapping Service | Overlapping Entities & Logic | Risk / Inconsistency |
| :--- | :--- | :--- | :--- |
| `script.service.ts` | `phase15-script-production.service.ts` | Teleprompter script generation, cue markers | Pacing constants differ (140 wpm vs 160 wpm) |
| `video.service.ts` | `phase17-video-production.service.ts` | Video take recording, cut submission | Status enum strings diverge slightly |
| `thumbnail.service.ts` | `phase18-thumbnail-intelligence.service.ts`| Thumbnail prompt formulation & variant choice | Duplicate prompt generation templates |
| `publishing.service.ts` | `phase23-production.service.ts` | Multi-platform publishing setup & dispatch | Discrepancy in YouTube title length bounds |
| `pinned-comment.service.ts`| `phase19-pinned-comment-intelligence.service`| Pinned comment generation and CTA links | Two distinct AI prompt generators active |
| `workflow.service.ts` | `workflow-orchestration.service.ts` | Conveyor stage advancement and state tracking | Parallel state machine transition logic |
