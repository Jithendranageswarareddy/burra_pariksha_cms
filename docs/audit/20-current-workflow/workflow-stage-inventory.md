# Workflow Stage Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 06 of 41  

---

## 1. Inventory of All Discovered Stages Across Models

| Model | Stages Defined | Primary Code Reference | Active Status |
| :--- | :---: | :--- | :--- |
| **Canonical 15-Stage** | 15 Stages | `src/lib/workflow/canonical-workflow.ts` | **ACTIVE PRODUCTION CORE** |
| **10-Stage Question Validation**| 10 Layers | `question-validation.engine.ts` | **ACTIVE SUB-WORKFLOW (Stage 2)** |
| **7-Stage UI Workspace** | 7 Workspace Tabs | `src/pages/VideoDetailPage.tsx` | **ACTIVE SUB-WORKFLOW (Stages 3-11)** |
| **6-Point Master QC** | 6 Checks | `production-asset-validation.service.ts` | **ACTIVE GATE (Stage 7)** |
| **Legacy 5-Phase Conveyor** | 5 Phases | Historical service headers | **SUPERSEDED / REMNANT** |
| **20-Phase Architectural Plan**| 20 Phases | Documentation & scripts | **SPECIFICATION / TEST REMNANT** |
