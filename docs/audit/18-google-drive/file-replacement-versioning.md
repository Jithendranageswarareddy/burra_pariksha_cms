# File Replacement & Versioning Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 24 of 40  

---

## 1. Monotonic Versioning Architecture

BP-CMS enforces monotonic version increments rather than destructive file overwrites:

```typescript
// src/lib/services/video.service.ts:899
const rawAssetsBefore = await mediaAssetsRepository.findByContentIdAndStage(targetContentId, 'RAW');
const maxMediaVersion = rawAssetsBefore.reduce((max, a) => Math.max(max, Number(a.version) || 0), 0);
const currentVideoVer = Number(existingVideo?.version) || 0;
const nextVersion = Math.max(maxMediaVersion, currentVideoVer) + 1;
```

---

## 2. Verification of Versioning in Live Storage

In live folder `BP-CNT-000001/Videos`:
- **Take 1 (Version 1):** `vd1.1.mp4` (File ID: `1wlXNHcCg1334EJFv1WZ0E1HkrRb-pdXB`, Size: 2.65MB).
- **Take 2 (Version 2):** `vd1.2.mp4` (File ID: `1hE5dPcuPByYdUogk5AEKEO7JSKeK_9EK`, Size: 2.68MB).

**Findings:**
1. Uploading Take 2 did NOT overwrite or delete Take 1. Both files remain intact in Google Drive.
2. The active pointer in `VIDEOS.drive_file_id` was updated from Take 1 to Take 2.
3. The `MEDIA_ASSETS` sheet maintains both records (`MEDIA-000001-RAW-1` and `MEDIA-000001-RAW-2`), allowing editors to switch back to Take 1 at any time.
