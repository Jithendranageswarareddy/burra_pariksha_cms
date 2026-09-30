# Content Master State Machine Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 13 of 30  
**Document:** 09 of 30  

---

## 1. ContentMasterStatus State Model

Defined in `src/types/index.ts:275–285`, `ContentMasterStatus` represents the overarching production container binding together Questions, Scripts, Videos, Thumbnails, and Social Publications.

### Defined States (9 States)
- `DRAFT`: Planning container initiated.
- `ACTIVE`: Work authorized; children entities generating.
- `READY_FOR_REVIEW`: All child components completed; ready for package review.
- `CHANGES_REQUESTED`: Reviewer rejected one or more child assets.
- `APPROVED`: Package fully approved for broadcast.
- `SCHEDULED`: Scheduled on social calendar.
- `PUBLISHED`: All target distribution channels live.
- `COMPLETED`: Canonical completion verified; archived to performance tracking.
- `ARCHIVED`: Retired or scrapped.

---

## 2. Master Completion Preconditions (`src/lib/services/content-master.service.ts:380–485`)

To transition a Content Master from `ACTIVE` to `COMPLETED`, `contentMasterService.validateCompletion()` enforces a strict battery of cross-domain invariants:

1. **Master State Invariant:** Master must be in `ACTIVE` status (cannot complete from `DRAFT` or `ARCHIVED`).
2. **Primary Question Invariant:** Linked Question must have `validationStatus === QuestionValidationStatus.VALID` AND `status === QuestionStatus.APPROVED`.
3. **Video Invariant:** Every linked Video must reach terminal production status `VideoProductionStatus.UPLOADED`.
4. **Thumbnail Invariant:** Every linked Thumbnail must have `status === 'APPROVED'`.
5. **Social Review Invariant:** Linked Social Review Package must have `currentReviewStatus === SocialReviewStatus.APPROVED`.
6. **Multi-Platform Distribution Invariant:** All three social platforms (`youtube`, `instagram`, `facebook`) must have `status === SocialPublishStatus.PUBLISHED`.

---

## 3. Deadlock Hazards in Multi-Video Content Masters

A single Content Master can theoretically link multiple Videos (e.g. Telugu version, English version, alternate cut). If Video 1 is published successfully to all platforms, but Video 2 is put `ON_HOLD` or cancelled, the Content Master can **never reach `COMPLETED` status**, because rule #3 requires *all* linked videos to be `UPLOADED`. There is no mechanism to detach or decouple cancelled videos from a Content Master without manual Google Sheets intervention.
