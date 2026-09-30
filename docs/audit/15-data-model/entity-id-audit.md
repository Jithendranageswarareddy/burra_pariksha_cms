# Entity Identity & Identifier Generation Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 04 of 51  

---

## 1. Master Identifier Specification (`src/lib/schemas/google-sheets-schema.ts:121–145`)

BP-CMS employs formatted prefix strings backed by monotonic sequence numbers stored in the `SEQUENCES` Google Sheets tab:

| Entity Type | Prefix | Pad Length | Canonical ID Example | Generation Service | Allocation Method |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `QUESTION` | `BP-Q-` | 6 | `BP-Q-000001` | `sequenceSafetyService` | Atomic sheet cell update + mutex |
| `VIDEO` | `BP-V-` | 6 | `BP-V-000001` | `sequenceSafetyService` | Atomic sheet cell update + mutex |
| `CONTENT_MASTER` | `BP-CNT-` | 6 | `BP-CNT-000001` | `sequenceSafetyService` | Atomic sheet cell update + mutex |
| `SCRIPT` | `BP-S-` | 6 | `BP-S-000001` | `sequenceSafetyService` | Atomic sheet cell update + mutex |
| `THUMBNAIL` | `BP-T-` | 6 | `BP-T-000001` | `sequenceSafetyService` | Atomic sheet cell update + mutex |
| `PINNED_COMMENT` | `BP-PIN-` | 6 | `BP-PIN-000001` | `sequenceSafetyService` | Atomic sheet cell update + mutex |
| `ASSIGNMENT` | `BP-ASN-` | 6 | `BP-ASN-000001` | `sequenceSafetyService` | Atomic sheet cell update + mutex |
| `CATEGORY` | `BP-CAT-` | 3 | `BP-CAT-001` | `sequenceSafetyService` | Atomic sheet cell update + mutex |
| `TOPIC` | `BP-TOP-` | 4 | `BP-TOP-0001` | `sequenceSafetyService` | Atomic sheet cell update + mutex |
| `SUBTOPIC` | `BP-SUB-` | 6 | `BP-SUB-000001` | `sequenceSafetyService` | Atomic sheet cell update + mutex |
| `USER` | `USR-` | 3 | `USR-001` | `sequenceSafetyService` | Atomic sheet cell update + mutex |
| `CONTENT_PLAN` | `BP-PLN-` | 4 | `BP-PLN-0001` | `sequenceSafetyService` | Atomic sheet cell update + mutex |
| `CONTENT_BATCH` | `BP-BCH-` | 4 | `BP-BCH-0001` | `sequenceSafetyService` | Atomic sheet cell update + mutex |
| `SOCIAL_REVIEW` | `BP-REV-` | 6 | `BP-REV-000001` | `sequenceSafetyService` | Atomic sheet cell update + mutex |
| `DRAFT_QUESTION` | `BP-DFT-` | 6 | `BP-DFT-000001` | `questionDraftsRepository` | Memory counter or timestamp |
| `WORKFLOW` | `WF-` | N/A | `WF-1727620000-00001-abcd-BP-V-001` | `WorkflowService` | Timestamp + Counter + Random |
| `AUDIT_LOG` | `LOG-` | N/A | `LOG-1727620000-xyz123` | `AuditService` | Timestamp + Random string |

---

## 2. ID / Entity Type Confusion Vulnerabilities

A major finding is that **repositories and domain services accept generic `id: string` arguments**:
- In `src/lib/services/video.service.ts:380`: `getVideo(id: string)` accepts any string. If a developer accidentally passes a Question ID (`BP-Q-000042`) instead of a Video ID (`BP-V-000042`), the method attempts a lookup in `VIDEOS` sheet and fails with a generic 404 rather than a type error.
- In test runners and historical reset scripts (`seed-100-questions-e2e-workflow.ts`), synthetic IDs like `TEST-Q-001` were inserted into production sheets, violating the canonical sequence format.
