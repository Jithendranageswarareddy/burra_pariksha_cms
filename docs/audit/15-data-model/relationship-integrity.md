# Relationship Integrity & Referential Enforcement

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 28 of 51  

---

## 1. Zero Database Foreign Keys

A paramount forensic finding is that **zero referential integrity constraints exist at the storage tier**:
- Google Sheets has no foreign key triggers or constraint engines.
- If a user deletes row `BP-Q-000001` from the `QUESTIONS` sheet tab, the corresponding records in `VIDEOS`, `SCRIPT`, `QUESTION_VIDEOS`, and `CONTENT_MASTERS` **remain completely intact**, pointing to a non-existent question ID.

---

## 2. Application-Level Referential Integrity Checkers
Referential integrity is enforced purely through application-level checks in `data-integrity.service.ts` and `ReferenceIntegrityError` assertions in services:
```typescript
const question = await questionsRepository.findById(video.questionId);
if (!question) {
  throw new ReferenceIntegrityError(`Referenced question "${video.questionId}" does not exist.`);
}
```
However, batch CSV imports (`POST /api/taxonomy/import/execute`) bypass these service checks, allowing broken foreign keys to enter production sheets.
