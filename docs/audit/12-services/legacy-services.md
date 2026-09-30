# Legacy & Phase-Specific Services Forensic Audit (11 Services)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 33 of 30  

---

## 1. Historical Phase Architecture

During iterative development, phase-stamped services were authored to meet specific milestone goals. While modern canonical services now handle these domains, **11 legacy phase services remain present in `src/lib/services/`**:

| Legacy Service File | Historical Phase Milestone | Modern Replacement Service | Risk of Retention |
| :--- | :--- | :--- | :--- |
| `phase12-workflow.service.ts` | Phase 12 (Core Workflow) | `workflow.service.ts` | Divergent stage transition rules |
| `phase13-refinement.service.ts` | Phase 13 (Question Polish) | `question.service.ts` | Allows un-audited status mutation |
| `phase14-drive.service.ts` | Phase 14 (Drive Setup) | `google-drive.service.ts` | Duplicate folder generation logic |
| `phase15-script-production.service.ts`| Phase 15 (Script Teleprompter)| `script.service.ts` | Overlapping teleprompter speeds |
| `phase17-video-production.service.ts` | Phase 17 (Video Pipeline) | `video.service.ts` | Inconsistent QC checklist requirements |
| `phase18-thumbnail-intelligence.service`| Phase 18 (Thumbnails) | `thumbnail.service.ts` | Redundant prompt templates |
| `phase19-pinned-comment-intelligence.service`| Phase 19 (Comments) | `pinned-comment.service.ts`| Redundant CTA link generation |
| `phase20-social-review.service.ts` | Phase 20 (Social Review) | `social-review.service.ts` | Outdated social approval schema |
| `phase23-production.service.ts` | Phase 23 (Production Sheet) | `publishing.service.ts` | Conflicting platform status enums |
| `phase25-consensus.service.ts` | Phase 25 (AI Consensus) | `comment-intelligence.service` | Experimental consensus logic |
