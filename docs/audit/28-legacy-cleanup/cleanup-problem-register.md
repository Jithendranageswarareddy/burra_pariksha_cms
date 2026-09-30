# Step 28: Cleanup Problem Register

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Classified Cleanup Problem Register  
**Status:** **AUTHORITATIVE AUDIT**  
**Date:** 2026-09-29  

---

## 1. Problem Classification Matrix

| Problem ID | Category | Component | Severity | Description & Root Cause | Impact | Affected Artifacts |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **CLN-CRIT-01**| `DUPLICATION` | State Enums | **CRITICAL** | `Video.status` and `Question.videoStatus` track duplicate production states, leading to silent desync in `VideoService`. | State machine divergence | `video.service.ts`, `questions.repository.ts` |
| **CLN-HIGH-01**| `DUPLICATION` | Drive Services | **HIGH** | `phase14-drive.service.ts` and `google-drive.service.ts` implement conflicting weekly folder resolution conventions. | Fragmented Google Drive asset tree | `google-drive.service.ts`, `phase14-drive.service.ts` |
| **CLN-HIGH-02**| `DUPLICATION` | UI Components | **HIGH** | `src/components/ui/` and `src/components/common/` duplicate Button, Modal, Card, and Input components. | Design inconsistency and bundle bloat | `src/components/common/*`, `src/components/ui/*` |
| **CLN-MED-01** | `LEGACY` | Incremental Tests | **MEDIUM** | 120+ historical phase test scripts persist in `src/tests/`, obscuring canonical regression suite. | High maintenance overhead | `src/tests/task*.ts`, `src/tests/run-phase*.ts` |
| **CLN-LOW-01** | `TERMINOLOGY`| Documentation | **LOW** | "Phase" (development milestone) and "Stage" (15 business stages) used interchangeably. | Conceptual confusion | Documentation & comments |

---

## 2. Definitive Operational State

No files were deleted, renamed, or modified during this read-only forensic audit. All classifications represent recommendations for future implementation phases.
