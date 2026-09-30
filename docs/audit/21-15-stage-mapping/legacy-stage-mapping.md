# Legacy Logic & Historical Stage Mapping

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 21 of 30  
**Document:** 25 of 31  

---

## 1. Discovered Historical Code Mappings

| Canonical Stage | Primary Modern Engine | Legacy Remnant Code | Competing Architectural Lineage |
| :---: | :--- | :--- | :--- |
| **01** | `question-draft.service.ts` | Phase 3 `question.service.ts` | Direct `createQuestion` bypasses draft stage. |
| **02** | `MultiLayerVerificationEngine` | Phase 5 `question-validation.service.ts` | Imperative validation helpers in legacy routes. |
| **03** | `script.service.ts` | Phase 6 `script.service.ts` | Phase 15 `phase15-script-production.service.ts`. |
| **04** | `RecordingWorkspace.tsx` | `/videos/:id/recording` discrete page | Legacy 5-phase conveyor model. |
| **05** | `GoogleDriveService` | Phase 7 Drive upload | Phase 14 Drive service folder layout divergence. |
| **06** | `EditingWorkspace.tsx` | `/videos/:id/editing` discrete page | Phase 17 video production service stubs. |
| **07** | `ProductionAssetValidationService`| `/videos/:id/final-review` discrete page| Legacy manual QC checkboxes. |
| **08** | `thumbnail.service.ts` | Phase 6 thumbnail service | Phase 18 thumbnail intelligence service. |
| **09** | `social-review.service.ts` | Phase 20 social review | Phase 26 unified copilot suggestion store. |
| **10** | `publishing.service.ts` | Phase 6 manual publishing | Phase 22 publishing hub service. |
