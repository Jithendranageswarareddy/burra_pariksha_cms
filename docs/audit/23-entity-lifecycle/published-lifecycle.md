# Lifecycle Stage 11: Published / Live Verification

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 23 of 35  
**Document:** 14 of 35  

---

## 1. Transition Details

| Attribute | Forensic Value |
| :--- | :--- |
| **Origin Entity** | Live Platform URLs (YouTube Shorts, Instagram Reels, Facebook) |
| **Action** | Ingest Live Platform URL & Mark Published |
| **Resulting Entity** | Published Record in `PUBLISHING` + Baseline in `ANALYTICS` |
| **State** | `Publishing.youtube.status = PUBLISHED` |
| **Page / Component** | `PublishingPage.tsx` |
| **Active Route** | `/publishing` |
| **REST API** | `POST /api/publishing/mark-published` |
| **Service Layer** | `publishing.service.ts:markPlatformPublished()` |
| **Repository Layer** | `publishingRepository.updateRecord()`, `analyticsRepository.appendRecord()` |
| **Authoritative Storage**| Google Sheets `PUBLISHING` and `ANALYTICS` |
| **Next Entity / State** | Platform Sync & Analytics Ingestion |

---

## 2. CRITICAL CASCADE FAILURE (STG-HIGH-02)

1. **Intended Behavior:** When all target platforms (YouTube, Instagram, Facebook) are confirmed published, the associated `Video` record in `VIDEOS` sheet should transition to `UPLOADED` or `PUBLISHED`.
2. **Actual Code Behavior:**
   - In `publishing.service.ts:markPlatformPublished`, the service updates `publishingRepository.updateRecord()`.
   - It appends a baseline 0-view row to `ANALYTICS`.
   - **It NEVER calls `videoService.transitionStatus()` or `videosRepository.updateRecord()`!**
3. **Forensic Result:** `Video.status` in `VIDEOS` worksheet remains permanently frozen in `READY_TO_UPLOAD`. The video entity never knows it has been published.
