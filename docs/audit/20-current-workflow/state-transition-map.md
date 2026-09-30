# State Transition Map

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 17 of 41  

---

## 1. Comprehensive Legal Transition Table

| Source State | Legally Permitted Target States | Enforcing Function |
| :--- | :--- | :--- |
| **NOT_STARTED** | `QUEUED` | `VideoService.validateTransition` |
| **QUEUED** | `SCRIPT_REQUIRED`, `SCRIPT_READY`, `ON_HOLD`, `CANCELLED` | `VideoService.validateTransition` |
| **SCRIPT_REQUIRED** | `SCRIPT_READY`, `ON_HOLD`, `CANCELLED` | `VideoService.validateTransition` |
| **SCRIPT_READY** | `RECORDING`, `RECORDED`, `ON_HOLD`, `CANCELLED` | `VideoService.validateTransition` |
| **RECORDING** | `RECORDED`, `SCRIPT_READY`, `ON_HOLD`, `CANCELLED` | `VideoService.validateTransition` |
| **RECORDED** | `EDITING`, `RECORDING`, `ON_HOLD`, `CANCELLED` | `VideoService.validateTransition` |
| **EDITING** | `EDITED`, `RECORDED`, `ON_HOLD`, `CANCELLED` | `VideoService.validateTransition` |
| **EDITED** | `FINAL_REVIEW`, `EDITING`, `ON_HOLD`, `CANCELLED` | `VideoService.validateTransition` |
| **FINAL_REVIEW** | `READY_TO_UPLOAD`, `EDITING`, `ON_HOLD`, `CANCELLED` | `VideoService.validateTransition` |
| **READY_TO_UPLOAD**| `UPLOADED`, `FINAL_REVIEW`, `ON_HOLD`, `CANCELLED` | `VideoService.validateTransition` |
| **UPLOADED** | NONE (Terminal) | `VideoService.validateTransition` |
| **ON_HOLD** | Resume to previous non-hold state, `CANCELLED` | `VideoService.validateTransition` |
| **CANCELLED** | NONE (Terminal) | `VideoService.validateTransition` |
