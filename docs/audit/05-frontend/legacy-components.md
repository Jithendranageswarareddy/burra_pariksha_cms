# Legacy & Unused Component Candidates Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 05 — Frontend Architecture Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Unrouted / Superseded Pages in `src/pages/` (8 Candidates)

These 8 page components exist in the repository but have 0 active routes in `src/App.tsx`:

1. **`ProductionBoardPage.tsx`**:
   - Replaced by `ProductionTrackerPage.tsx`.
   - `App.tsx` route `/production-board` redirects to `/production?status=EDITING`.
2. **`PublishingPackagePage.tsx`**:
   - Replaced by `PlatformPackagesPage.tsx`.
   - `App.tsx` route `/publishing-package` redirects to `/platform-packages`.
3. **`VideoEditPage.tsx`**:
   - Standalone editor page from Stage 06; superseded by `VideoDetailPage.tsx?tab=editing`.
4. **`VideoFinalPage.tsx`**:
   - Standalone review page from Stage 07; superseded by `VideoDetailPage.tsx?tab=final-review`.
5. **`VideoPinnedCommentPage.tsx`**:
   - Standalone comment page from Stage 09; superseded by `VideoDetailPage.tsx?tab=pinned-comment`.
6. **`VideoRecordPage.tsx`**:
   - Standalone recording page from Stage 04; superseded by `VideoDetailPage.tsx?tab=recording`.
7. **`VideoReviewScriptPage.tsx`**:
   - Standalone review page from Stage 03; superseded by `VideoDetailPage.tsx?tab=script`.
8. **`VideoThumbnailPage.tsx`**:
   - Standalone thumbnail page from Stage 08; superseded by `VideoDetailPage.tsx?tab=thumbnail`.

---

## 2. Low-Consumer / Orphan Component Candidates
- **`src/design-system/components/Form.tsx`**: Declared in design system but has only 1 consumer across all 115 files.
- **`src/design-system/components/StepIndicator.tsx`**: Superseded by `ProductionJourneyBar.tsx` and `WorkflowStepNav.tsx`.
