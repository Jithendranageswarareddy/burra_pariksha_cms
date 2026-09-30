# File Metadata Storage Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 12 of 40  

---

## 1. Metadata Field Distribution Matrix

Metadata describing stored files is distributed across Google Drive and Google Sheets:

| Metadata Field | Stored in Google Drive | Stored in Google Sheets | Authoritative Source | Synchronization Risk |
| :--- | :---: | :---: | :---: | :--- |
| **File ID** | ✅ Native (`id`) | ✅ Tabular Cell (`drive_file_id`) | Google Drive | High: Sheets cell can hold invalid/stale ID |
| **File Name** | ✅ Native (`name`) | ✅ Tabular Cell (`file_name`) | Google Sheets | Low: Drive name matches uploaded name |
| **MIME Type** | ✅ Native (`mimeType`)| ✅ Tabular Cell (`mime_type`) | Google Drive | Low: Validated on upload |
| **File Size (Bytes)**| ✅ Native (`size`) | ✅ Tabular Cell (`file_size`) | Google Drive | Low: Numeric byte count |
| **Creation Timestamp**| ✅ Native (`createdTime`)| ✅ Tabular Cell (`created_at`) | Google Drive | Medium: Drive createdTime vs client clock |
| **Drive Folder ID** | ✅ Native (`parents`)| ✅ Tabular Cell (`drive_folder_id`)| Google Drive | High: If file moved in Drive UI, Sheet is desynced |
| **Web View URL** | ✅ Computed | ✅ Tabular Cell (`drive_folder_url`)| Google Drive | Low: Deterministic format |
| **Media Stage** | ❌ None | ✅ Tabular Cell (`media_stage`) | Google Sheets | Sole source: Drive has no stage metadata |
| **Take / Version** | ❌ None | ✅ Tabular Cell (`version`) | Google Sheets | Sole source: Monotonic integer |
| **Associated Content ID**| ❌ (Only folder name) | ✅ Tabular Cell (`content_id`) | Google Sheets | Sole source: Tabular foreign key |

---

## 2. Forensic Finding on Metadata Divergence
Google Drive does NOT use custom file properties (`appProperties` or `properties`) to store BP-CMS business metadata. All business context (Content ID, Take Version, Stage, Approval Status) exists **exclusively in Google Sheets**. If a file is orphaned in Drive, its business context is completely lost.
