# Lifecycle Stage 09: Social Review & Packaging

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 23 of 35  
**Document:** 12 of 35  

---

## 1. Transition Details

| Attribute | Forensic Value |
| :--- | :--- |
| **Origin Entity** | QC-Approved Video, Thumbnail, and Pinned Comment Draft |
| **Action** | Social Review Sign-Off |
| **Resulting Entity** | `SocialReviewPackage` (`SR-######`) |
| **State** | `SocialReviewPackage.status = APPROVED`, `Publishing.pinnedCommentReady = true` |
| **Page / Component** | `SocialReviewPage.tsx` |
| **Active Route** | `/social-review/:reviewId` |
| **REST API** | `POST /api/social-reviews/:id/approve` |
| **Service Layer** | `social-review.service.ts`, `pinned-comment.service.ts` |
| **Repository Layer** | `socialReviewsRepository.appendRecord()`, `pinnedCommentsRepository.appendRecord()` |
| **Authoritative Storage**| Google Sheets `SOCIAL_REVIEWS` & `PINNED_COMMENTS` |
| **Next Entity / State** | Gate D Publishing Setup |

---

## 2. Evidence from Runtime Item

- In runtime record `PUB-000001`, `pinnedCommentReady: true`.
- This confirms that the pinned comment review step for this reference content item successfully executed and marked readiness on the publishing record.
