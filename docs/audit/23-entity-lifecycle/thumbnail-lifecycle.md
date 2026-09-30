# Lifecycle Stage 08: Thumbnail Studio

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 23 of 35  
**Document:** 11 of 35  

---

## 1. Transition Details

| Attribute | Forensic Value |
| :--- | :--- |
| **Origin Entity** | Approved Video & Hook Headline |
| **Action** | Upload & Approve Thumbnail |
| **Resulting Entity** | `Thumbnail` (`BP-T-######`) |
| **State** | `Thumbnail.status = APPROVED`, `Publishing.thumbnailReady = true` |
| **Page / Component** | `VideoDetailPage.tsx?tab=thumbnail` -> `ThumbnailWorkspace.tsx` |
| **Active Route** | `/videos/:id?tab=thumbnail` |
| **REST API** | `POST /api/thumbnails` |
| **Service Layer** | `thumbnail.service.ts:saveThumbnail()` |
| **Repository Layer** | `thumbnailsRepository.appendRecord()`, `thumbnailVersionsRepository.appendRecord()` |
| **Authoritative Storage**| Google Drive (Image Binary) + Google Sheets `THUMBNAILS` & `PUBLISHING` |
| **Next Entity / State** | Social Review Packaging |

---

## 2. Evidence from Runtime Item

- In runtime record `PUB-000001`, `thumbnailReady: false`.
- `thumbnailsRepository.findByVideoId('BP-V-000001')` returned `null`.
- This confirms that for `BP-V-000001`, the thumbnail stage has not yet been executed in production.
- Code analysis confirms that once uploaded, `thumbnail.service.ts` automatically updates `publishingRepository.updateRecord({ thumbnailReady: true })`.
