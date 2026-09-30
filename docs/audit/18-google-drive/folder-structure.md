# Google Drive Folder Structure Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 04 of 40  

---

## 1. Dual Folder Hierarchy Conventions

A forensic investigation of `src/lib/services/google-drive.service.ts` and live Google Drive queries reveals **two distinct, competing folder hierarchy conventions**:

### Convention A: Phase 7 Conveyor Tree (`ensureContentHierarchy`)
Used by: `video.service.ts` and `thumbnail.service.ts`
```
[Root: GOOGLE_DRIVE_ROOT_FOLDER_ID]
  └── Content (Folder ID: 1ay-prfhC8jxQ2I-fIwj1vG_gjyjc-WSx)
        ├── BP-CNT-000001 (Folder ID: 1uiSG4_vtYoeF8FVBRZw9HrTBwNPF46yo)
        │     ├── Videos (Folder ID: 1DBudvMCAA7uc8qHDuZEmnTvvEVPtHVrr)
        │     │     ├── vd1.1.mp4 (File ID: 1wlXNHcCg1334EJFv1WZ0E1HkrRb-pdXB)
        │     │     └── vd1.2.mp4 (File ID: 1hE5dPcuPByYdUogk5AEKEO7JSKeK_9EK)
        │     ├── Scripts (Folder ID: 1ht1OQOenHbNK_K2HvinN-OTwFESsT_5d)
        │     └── Thumbnails (Folder ID: 1V4EDuzVy2n5C3xFwiV7486mzxccmbHvD)
        ├── BP-CNT-172872
        ├── BP-CNT-875634
        ├── BP-CNT-731056
        ├── BP-CNT-561774
        └── BP-CNT-743611
```

### Convention B: Phase 14 Production Stage Tree (`ensureProductionHierarchy`)
Used by: `phase14-drive.service.ts`
```
[Root: GOOGLE_DRIVE_ROOT_FOLDER_ID]
  ├── BP-CNT-906043 (Directly under Root; bypasses Content parent)
  │     ├── Raw (raw_footage_01.mp4)
  │     ├── Edited (edited_cut_v1.mp4, edited_cut_v2.mp4)
  │     ├── Final (final_published_render.mp4, reviewer_final.mp4)
  │     └── Thumbnail
  ├── BP-CNT-802170
  ├── BP-CNT-E2E17-1790513156435 (Test folder)
  └── BP-CNT-E2E17-1790514028670 (Test folder)
```

---

## 2. Architectural Impact of Dual Folder Conventions

1. **Folder Fragmentation:**  
   Assets uploaded via Phase 7 (`videoService.uploadVideoAsset`) are saved inside `Root/Content/BP-CNT-######/Videos`. Assets uploaded via Phase 14 (`phase14DriveService.uploadProductionAsset`) are saved inside `Root/BP-CNT-######/Raw` or `Root/BP-CNT-######/Final`.
2. **Incompatible Path Assumptions:**  
   Services inspecting `Root/Content` cannot find Phase 14 assets, and services inspecting `Root/BP-CNT-######` cannot find Phase 7 assets.
