# Social Review & Quality Gating State Machine

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 13 of 30  
**Document:** 11 of 30  

---

## 1. Social Review Triple State Architecture

The social review and distribution packaging pipeline integrates three intersecting state machines declared in `src/types/index.ts`:

1. **`SocialReviewStatus` (Human Review):**
   - `PENDING_REVIEW`: Package generated; awaiting human SME/Lead sign-off.
   - `APPROVED`: Human approved for platform distribution.
   - `CHANGES_REQUESTED`: Human flagged issues; returned for editor/copywriter revision.
   - `REJECTED`: Rejected entirely.
   - `STALE_REVISION_REQUIRED`: Automatically triggered when upstream content hash changes after prior review.

2. **`SocialQualityStatus` (AI Scoring):**
   - `EXCELLENT`: Score >= 90; no compliance warnings.
   - `GOOD`: Score 75–89; minor style notes.
   - `NEEDS_IMPROVEMENT`: Score 60–74; flagged for review.
   - `REJECTED`: Score < 60; integrity, hallucination, or copyright violation.

3. **`SocialEnhancementStatus` (Package Lifecycle):**
   - `DRAFT` -> `VALIDATED` -> `NEEDS_REVIEW` -> `REJECTED`.

---

## 2. Hard Quality Invariants (`src/lib/services/social-review.service.ts:340–370`)

In `socialReviewService.getReviewPackageBundle()`, hard blockers prevent advancing to `APPROVED`:
- **Source Question Invariant:** Source question `validationStatus` must be `VALID`. If `NOT_VALIDATED` or `INVALID`, human approval is strictly blocked.
- **AI Quality Guard:** If `qualityAssessment.status === SocialQualityStatus.REJECTED`, the bundle is hard-blocked:
  ```
  "AI Quality Assessment status is REJECTED due to integrity issues."
  ```
- **Stale Version Guard:** The review payload must match `bundle.currentVersionHash`. If an upstream script or thumbnail was modified after the review package was rendered, the server rejects approval with HTTP 409 (Conflict).
