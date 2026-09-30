# Comprehensive Workflow Discovery

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 02 of 41  

---

## 1. Repository Scanning & Workflow Terminology

A full-text AST scan across `src/` revealed widespread workflow terms representing different architectural development eras:

### Discovered Workflow Concepts & Anchors:
1. **`CANONICAL_15_STEPS`:** The dominant structural reference in `src/lib/workflow/canonical-workflow.ts` and `src/contexts/ProductionJourneyContext.tsx`.
2. **`VALID_VIDEO_TRANSITIONS`:** Strict 11-state transition matrix in `src/lib/services/video.service.ts:59-75`.
3. **`MultiLayerVerificationEngine`:** 10-point pedagogical verification engine in `src/lib/validation/`.
4. **`QuestionStatus`:** 6-state lifecycle enum for question text.
5. **`VideoProductionStatus`:** 13-state lifecycle enum for production tracking.
6. **`SocialPublishStatus`:** 4-state lifecycle enum for multi-platform distribution.
7. **Phase-Numbered Services:** 18 services prefixed by Phase numbers (e.g. `phase12-workflow.service.ts`, `phase14-drive.service.ts`, `phase22-publishing-hub.service.ts`).
