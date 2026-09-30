# Database State & Lifecycle Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 19 of 39  

---

## 1. State Columns Across Persistent Tables

BP-CMS relies on state columns to drive the 15-stage production conveyor:

| Table | Status Column Name | TypeScript Enum | Total Permitted States |
| :--- | :--- | :--- | :---: |
| `QUESTIONS` | `status` | `QuestionStatus` | 7 |
| `QUESTIONS` | `validation_status` | `QuestionValidationStatus` | 4 |
| `VIDEOS` | `status` | `VideoProductionStatus` | 11 |
| `ASSIGNMENTS` | `status` | `AssignmentStatus` | 4 |
| `PUBLISHING` | `status` | `SocialPublishStatus` | 5 |
| `CONTENT_MASTERS` | `status` | `ContentMasterStatus` | 7 |
| `CONTENT_PLANS` | `status` | `ContentPlanStatus` | 5 |
| `CONTENT_BATCHES` | `status` | `ContentBatchStatus` | 4 |
| `SOCIAL_REVIEWS` | `review_status` | `SocialReviewStatus` | 4 |

---

## 2. State Transition Integrity Gap

- **Absence of Storage State Machines:**  
  In an enterprise database, state transitions can be restricted via triggers (`BEFORE UPDATE`) or check constraints. In Google Sheets, any string can be written directly to any status cell.
- **Competing Writers:**  
  As discovered in Step 13, 8 state columns are mutated by up to 50 distinct domain services without distributed locks, enabling conflicting status writes.
