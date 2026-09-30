# Script & Document Storage Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 09 of 40  

---

## 1. Script Storage Architecture: Sheets vs Drive

A critical forensic finding: **SCRIPTS ARE NOT STORED IN GOOGLE DRIVE.**

- **Folder Existence in Drive:**  
  `GoogleDriveService.ensureContentHierarchy()` creates a `Scripts` folder under each content ID (e.g. `1ht1OQOenHbNK_K2HvinN-OTwFESsT_5d` under `BP-CNT-000001`).
- **File Content in Drive:**  
  Live inspection confirms **0 files exist inside the `Scripts` folder**.
- **Authoritative Storage Location:**  
  Full script text, teleprompter markers, hooks, and call-to-actions are stored exclusively as plain text in the **Google Sheets `SCRIPT` and `SCRIPT_VERSIONS` worksheets**.

---

## 2. Analysis of the Dormant `Scripts` Folder

| Dimension | Google Sheets (`SCRIPT` tab) | Google Drive (`Scripts` folder) |
| :--- | :--- | :--- |
| **Storage Role** | **AUTHORITATIVE SOURCE OF TRUTH** | **UNUSED / EMPTY SHELL** |
| **Data Format** | Tabular cells with multi-line text | Intended for exported `.txt` or `.docx` |
| **Versioning** | Managed via `SCRIPT_VERSIONS` sheet | None |
| **API Endpoints** | `GET /api/scripts/:videoId` | None |

**Finding:** The `Scripts` folder in Google Drive is an orphaned folder convention created by `ensureContentHierarchy()` but never populated by `ScriptService`.
