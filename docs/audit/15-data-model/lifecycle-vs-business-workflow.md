# Entity Lifecycle vs Canonical 15-Stage Workflow Reconciliation

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 37 of 51  

---

## 1. Lifecycle to Workflow Mapping

The business conveyor comprises 15 macro steps, whereas entities maintain fine-grained micro-states.

| Conveyor Stage | Primary Governing Entity | Required Entity State | Prerequisite State |
| :---: | :--- | :--- | :--- |
| **01: Question Gen** | `Question` | `status === GENERATED` | None |
| **02: Verification** | `Question` | `status === APPROVED` & `validationStatus === VALID` | `GENERATED` |
| **03: Scriptwriting** | `Script` | `status === APPROVED` | Question `APPROVED` |
| **04: Teleprompter** | `Video` | `status === RECORDING` | Script `APPROVED` |
| **05: Raw Footage** | `Video` & `MediaAsset` | `status === RECORDED` (`driveFileId` exists) | `RECORDING` |
| **06: Editing Bay** | `Video` & `MediaAsset` | `status === EDITED` (`editedVideoDriveId` exists) | `RECORDED` |
| **07: Final QC** | `Video` | `status === READY_TO_UPLOAD` (12-point QC true) | `EDITED` |
| **08: Thumbnail** | `Thumbnail` | `status === APPROVED` | `READY_TO_UPLOAD` |
| **09: Pinned Comment**| `PinnedComment` | `status === APPROVED` | `READY_TO_UPLOAD` |
| **10: Social Review** | `SocialReviewBundle` | `currentReviewStatus === APPROVED` | Thumb & Video QC true |
| **11: Publishing Setup**| `Publishing` | `status === SCHEDULED` | Social Review true |
| **12: Live Distribution**| `Publishing` & `Video` | `status === PUBLISHED`, Video `UPLOADED` | Future schedule time reached |
| **13: Platform Sync** | `Publishing` | Platform post IDs recorded | Live upload completed |
| **14: Analytics** | `SocialAnalytics` | View / retention metrics synced | Live URL active |
| **15: Intelligence** | `CommentIntelligence` | Questions clustered -> feeds Stage 01 | Audience comments present |
