# Technical & Backend Leakage into Frontend UI

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 05 — Frontend Architecture Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Overview of Backend Leakage

A key architectural mandate is that the frontend UI must present domain content management concepts rather than exposing physical storage mechanisms (Google Sheets worksheets, Google Drive folder IDs, or Cloud Storage buckets).

Forensic analysis discovered **19 instances of physical backend technical concepts exposed directly in frontend code**:

---

## 2. Forensic Leakage Register

| ID | Frontend File | Technical Detail Exposed | Severity | Evidence / Description |
| :---: | :--- | :--- | :---: | :--- |
| **LK-01** | `src/pages/RecoveryAdminPage.tsx` | Google Sheets `spreadsheetId` & `worksheets` | **HIGH** | Exposes raw worksheet counts, checksum hashes, and internal spreadsheet IDs in admin table. |
| **LK-02** | `src/pages/RecoveryAdminPage.tsx` | Google Cloud Storage (`GCS`) Bucket | **HIGH** | References GCS bucket masks and GCS durable archive URLs directly in UI banners. |
| **LK-03** | `src/pages/SettingsPage.tsx` | Google Sheets & Drive API internals | **MEDIUM** | Exposes tab names and credential health details in settings diagnostics. |
| **LK-04** | `src/pages/VideoDetailPage.tsx` | `driveFolder` & `worksheet` | **MEDIUM** | Displays Google Drive folder links directly in production inspector sidebar. |
| **LK-05** | `src/components/video/PublishingWorkspace.tsx` | Google Drive & GCS storage paths | **HIGH** | Displays raw Drive file IDs and storage paths in platform package export panel. |
| **LK-06** | `src/components/publishing/PublishingTable.tsx` | Direct `ProductionAssetValidationService` | **CRITICAL** | Instantiates server-side file validator directly inside a client React table component! |
| **LK-07** | `src/components/video/EditingWorkspace.tsx` | Google Drive binary folder IDs | **MEDIUM** | Uses Drive folder identifiers for footage linking. |
| **LK-08** | `src/components/video/RecordingWorkspace.tsx` | Google Drive binary folder IDs | **MEDIUM** | Raw footage upload stream binds to internal Drive folder IDs. |

---

## 3. Impact Assessment
Exposing physical storage mechanisms forces content creators to reason about Google Drive folders and Google Sheets worksheet limits instead of focusing on educational content quality.
