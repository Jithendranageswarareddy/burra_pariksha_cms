# Google Sheets ↔ Google Drive Reconciliation

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 15 of 40  

---

## 1. Live Reconciliation Audit Results

A direct reconciliation between live Google Sheets records and live Google Drive files was executed on **2026-09-29**:

| Sheet Entity & ID | Stored `driveFileId` in Sheet | Live Google Drive File State | Reconciliation Classification |
| :--- | :--- | :--- | :---: |
| **MediaAsset:** `MEDIA-000001-RAW-1` | `1wlXNHcCg1334EJFv1WZ0E1HkrRb-pdXB` | **EXISTS** (`vd1.1.mp4`, 2.65MB, inside `Videos` folder) | **PERFECT MATCH** |
| **MediaAsset:** `MEDIA-000001-RAW-2` | `1hE5dPcuPByYdUogk5AEKEO7JSKeK_9EK` | **EXISTS** (`vd1.2.mp4`, 2.68MB, inside `Videos` folder) | **PERFECT MATCH** |
| **Video:** `BP-V-000001` | `1hE5dPcuPByYdUogk5AEKEO7JSKeK_9EK` | **EXISTS** (Matches Take 2 file) | **PERFECT MATCH** |
| **Video:** `BP-V-372937` | `undefined` (empty cell) | ❌ **NO FILE ATTACHED** | **ENTITY WITHOUT DRIVE ASSET** |
| **MediaAsset:** `MEDIA-172872-RAW-1` | `1La1zcgjPW7whpuCo3fp2qJrNqIx2rb-p` | In Trash / Cleaned up | **DANGLING REFERENCE** |
| **MediaAsset:** `MEDIA-172872-RAW-2` | `1_BHViPhsSObQtX-Wnwoy1tpRvjvWYdV4` | In Trash / Cleaned up | **DANGLING REFERENCE** |
| **MediaAsset:** `MEDIA-731056-RAW-1` | `fixed_drive_file_id_12345` | ❌ Non-existent synthetic string | **SYNTHETIC PLACEHOLDER HAZARD** |
| **MediaAsset:** `MEDIA-561774-RAW-1` | `fixed_drive_file_id_12345` | ❌ Non-existent synthetic string | **SYNTHETIC PLACEHOLDER HAZARD** |
| **MediaAsset:** `MEDIA-743611-RAW-1` | `fixed_drive_file_id_12345` | ❌ Non-existent synthetic string | **SYNTHETIC PLACEHOLDER HAZARD** |
| **Video:** `BP-V-731056` | `fixed_drive_file_id_12345` | ❌ Non-existent synthetic string | **SYNTHETIC PLACEHOLDER HAZARD** |
| **Video:** `BP-V-561774` | `fixed_drive_file_id_12345` | ❌ Non-existent synthetic string | **SYNTHETIC PLACEHOLDER HAZARD** |
| **Video:** `BP-V-743611` | `fixed_drive_file_id_12345` | ❌ Non-existent synthetic string | **SYNTHETIC PLACEHOLDER HAZARD** |

---

## 2. Reconciliation Summary
- **Live Valid Assets:** 2 files in `BP-CNT-000001` perfectly match between Google Sheets and Google Drive.
- **Synthetic Contamination:** 3 video records and 3 media asset records contain `fixed_drive_file_id_12345` from automated test seeders.
- **Orphan Entities:** 1 video entity has no Drive file attached.
