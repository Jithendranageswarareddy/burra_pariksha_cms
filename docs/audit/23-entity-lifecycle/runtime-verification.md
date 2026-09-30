# Runtime Verification Evidence

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 23 of 35  
**Document:** 33 of 35  

---

## 1. Live Production Artifacts Inspected

The following runtime records were queried directly from the connected Google Sheets and in-memory caches:

1. **Question Record `BP-Q-000001`:**
   - `status`: `APPROVED`
   - `videoStatus`: `QUEUED`
   - `contentId`: `BP-CNT-000001`
2. **Video Record `BP-V-000001`:**
   - `status`: `QUEUED`
   - `driveFileId`: `1hE5dPcuPByYdUogk5AEKEO7JSKeK_9EK`
   - `fileName`: `vd1.2.mp4`
   - `fileSize`: `2684852` (2.68 MB)
   - `version`: `2`
   - `finalRenderValidationStatus`: `INVALID`
3. **Script Record `BP-S-000001`:**
   - Linked to `questionId: BP-Q-000001`
4. **Publishing Record `PUB-000001`:**
   - `thumbnailReady`: `false`
   - `pinnedCommentReady`: `true`
   - `completedPlatformsCount`: `0`
