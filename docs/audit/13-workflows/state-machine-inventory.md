# Comprehensive State Machine Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 13 of 30  
**Document:** 03 of 30  

---

## 1. Master State Machine Registry

Static code analysis discovered **14 distinct status, state, and lifecycle enums** defined across the repository.

| Enum Identifier | Source Declaration File | Line Numbers | Cardinality (States) | Primary Storage Sheet | Primary Entity Bound |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `CanonicalWorkflowState` (Model A)| `src/lib/workflow/canonical-workflow.ts` | 28–36 | 7 | Local UI / Derived | Stage Conveyor |
| `CanonicalWorkflowState` (Model B)| `src/lib/services/workflow-orchestration.service.ts`| 33–45 | 11 | `WORKFLOW` / Runtime | Cross-Domain Entity |
| `QuestionStatus` | `src/types/index.ts` | 15–22 | 6 | `QUESTIONS` | Question |
| `QuestionValidationStatus` | `src/types/index.ts` | 24–30 | 5 | `QUESTIONS` | Question Validation |
| `RenderValidationStatus` | `src/types/index.ts` | 32–37 | 4 | `VIDEOS` | Video Render |
| `VideoProductionStatus` | `src/types/index.ts` | 39–54 | 13 | `VIDEOS` | Video |
| `SocialPublishStatus` | `src/types/index.ts` | 83–90 | 6 | `PUBLISHING` | Platform Publishing |
| `ContentPlanStatus` | `src/types/index.ts` | 116–122 | 5 | `CONTENT_PLANS` | Curriculum Plan |
| `ContentBatchStatus` | `src/types/index.ts` | 124–130 | 5 | `CONTENT_BATCHES` | Question Batch |
| `AssignmentStatus` | `src/types/index.ts` | 132–138 | 5 | `ASSIGNMENTS` | User Assignment |
| `ContentMasterStatus` | `src/types/index.ts` | 275–285 | 9 | `CONTENT_MASTERS` | Master Content Item |
| `SocialEnhancementStatus` | `src/types/index.ts` | 1771–1776 | 4 | In-Memory / Ephemeral | AI Metadata Package |
| `SocialQualityStatus` | `src/types/index.ts` | 2039–2044 | 4 | In-Memory / Ephemeral | AI Quality Assessment|
| `SocialReviewStatus` | `src/types/index.ts` | 2086–2092 | 5 | `SOCIAL_REVIEWS` | Human Review Package |
| `PlatformAdaptationStatus` | `src/types/index.ts` | 2556–2563 | 6 | `ADAPTATIONS` | Platform Post Adapt |

---

## 2. Cross-Entity State Matrix

Entities in BP-CMS maintain interconnected state dependencies. An entity cannot legally advance unless its parent or dependency is in a prerequisite status:

```
[CONTENT_MASTER: ACTIVE]
   |
   +---> [QUESTION: APPROVED] (requires QuestionValidationStatus: VALID)
            |
            +---> [VIDEO: QUEUED -> ... -> UPLOADED] (requires Script: APPROVED, Thumbnail: APPROVED)
                     |
                     +---> [SOCIAL_REVIEW: APPROVED] (requires QualityAssessment != REJECTED)
                              |
                              +---> [PUBLISHING: SCHEDULED -> PUBLISHED]
```

---

## 3. Storage Representation Analysis

1. **Google Sheets String Serialization:** All states are serialized as raw string values in designated Google Sheets columns (e.g., Column F in `QUESTIONS`, Column G in `VIDEOS`). No database constraints, check clauses, or foreign keys enforce valid enum values at the storage tier.
2. **Schema Invariant Vulnerability:** If an administrator or user manually modifies a status cell in Google Sheets to an unrecognized string (e.g. `"DONE"` instead of `"COMPLETED"`), the backend deserializer silently defaults to undefined or fails with a 500 error when applying enum comparison methods.
