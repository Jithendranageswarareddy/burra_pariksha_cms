# Edited & Final Video Asset Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 07 of 40  

---

## 1. Distinction Between Production Video Stages

BP-CMS explicitly distinguishes three video production stages:
1. **RAW:** Raw recorded footage from camera/teleprompter.
2. **EDITED:** Post-production rough cuts, trimmed footage, color-graded sequences (`edited_cut_v1.mp4`, `edited_cut_v2.mp4`).
3. **FINAL:** Fully rendered, approved master file ready for publishing (`final_published_render.mp4`, `reviewer_final.mp4`).

---

## 2. Live Drive Evidence for Edited & Final Cuts

Inspection of live folder `BP-CNT-906043` reveals:
- **Folder `Edited` (`1vjv0XEd6GZUibxaqDE8rmM7lDT7CasV6`):**
  - `edited_cut_v1.mp4` (ID: `1NFz6njFWFININhPo4DETOLHkyXZ8xuht`)
  - `edited_cut_v2.mp4` (ID: `1uRr4IMIVFrfiiJxKo114LDXTSU34Qo-s`)
- **Folder `Final` (`1yLls9MI-P2YNr7RGFGTIhA8NLQyx7ISp`):**
  - `final_published_render.mp4` (ID: `1uxjTslIr0F23WDnpQR3jf1HSKbUyn3Nn`)
  - `reviewer_final.mp4` (ID: `12X1vGtfGq7c4xQlU2sfq_LfQTv9w7mxP`)

---

## 3. Storage & Metadata Linkage
- Edited cuts and final renders are stored as **distinct physical files** in separate Drive folders.
- In Google Sheets, `VIDEOS.final_render_path` stores the web link to the final video file.
- Publishing service (`src/lib/services/publishing.service.ts:1238`) checks `video.finalRenderPath || video.driveFolderUrl` before permitting live social media distribution.
