# Lifecycle Stage 10: Publishing Setup & Gate D

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 23 of 35  
**Document:** 13 of 35  

---

## 1. Transition Details

| Attribute | Forensic Value |
| :--- | :--- |
| **Origin Entity** | Complete Media Package (`Video`, `Thumbnail`, `Script`, `SocialReview`) |
| **Action** | Gate D Pre-Publish Readiness Audit & Scheduling |
| **Resulting Entity** | Scheduled `Publishing` Record (`PUB-000001`) |
| **State** | `Publishing.status = SCHEDULED` |
| **Page / Component** | `PublishingPage.tsx` |
| **Active Route** | `/publishing` |
| **REST API** | `POST /api/publishing/schedule` |
| **Service Layer** | `publishing.service.ts:validatePublishReadiness()` |
| **Repository Layer** | `publishingRepository.updateRecord()` |
| **Authoritative Storage**| Google Sheets `PUBLISHING` worksheet |
| **Next Entity / State** | Live Publication Ingestion |

---

## 2. Gate D Strict Verification

`publishing.service.ts` enforces a 5-point gate:
1. `videoReady`: `Video.status === 'READY_TO_UPLOAD'`
2. `thumbnailReady`: `Publishing.thumbnailReady === true`
3. `pinnedCommentReady`: `Publishing.pinnedCommentReady === true`
4. `scriptReady`: Script exists and verified
5. `metadataReady`: Title and description character limits met
- For reference item `PUB-000001`, Gate D currently evaluates to **BLOCKED** because `thumbnailReady` is false and `Video.status` is `QUEUED`.
