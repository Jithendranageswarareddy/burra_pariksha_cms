# Lifecycle Stage 01: Question Generation

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 23 of 35  
**Document:** 04 of 35  

---

## 1. Transition Details

| Attribute | Forensic Value |
| :--- | :--- |
| **Origin Entity** | User Syllabus Configuration / AI Prompt |
| **Action** | "Generate Question" / "Save Draft" |
| **Resulting Entity** | `QuestionDraft` |
| **Identifier** | `BP-DFT-######-XXXX` (e.g. `BP-DFT-529472-5SOD`) |
| **State** | `QuestionStatus.DRAFT` |
| **Page / Component** | `QuestionStudioPage.tsx` |
| **Active Route** | `/studio` |
| **REST API** | `POST /api/question-drafts` |
| **Service Layer** | `question-draft.service.ts:saveDraft()` |
| **Repository Layer** | `questionDraftsRepository.appendRecord()` |
| **Authoritative Storage**| Google Sheets `QUESTION_DRAFTS` worksheet |
| **Next Entity / State** | `QuestionDraft` -> Sent to Verification |

---

## 2. Forensic Findings & Behavioral Proof

1. **Strict Draft Isolation:** Stage 01 writes strictly to `QUESTION_DRAFTS`. It does not allocate permanent numerical sequence IDs (`BP-Q-*`) and does not write to the canonical `QUESTIONS` tab.
2. **Taxonomy & Options:** Full 4-option array (A, B, C, D), correct option index, and Telugu mathematical derivation are saved in the draft record payload.
3. **Draft Linking:** The draft entity holds no canonical question reference because canonical sequences have not yet been minted.
