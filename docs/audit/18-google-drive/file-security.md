# File Storage Security Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 31 of 40  

---

## 1. Storage Security Architecture

Security across Google Drive and file handling is evaluated along five critical axes:

| Security Domain | Implemented Mechanism | Security Evaluation |
| :--- | :--- | :---: |
| **API Transport Security** | 100% TLS/HTTPS encryption for Drive API REST operations | **STRONG** |
| **Credential Protection** | OAuth 2.0 refresh token in environment; redacted in backup snapshots | **STRONG** |
| **Streaming Access Control** | Express routes require session authentication & object RBAC verification | **STRONG** |
| **Drive Folder Isolation** | All assets scoped under single shared root folder | **MEDIUM (Shared Root)** |
| **Direct Web Link Exposure** | `driveFolderUrl` and `webViewLink` stored as plain text in Google Sheets | **WEAK (Bypasses RBAC)** |

---

## 2. Vulnerability: Bypassing Application RBAC via Direct Drive Links
When Google Sheets rows are viewed directly by team members in the Google Sheets UI, clicking the `drive_folder_url` or `raw_footage_path` opens the asset directly in Google Drive. If the Drive folder is shared with the domain or public, access control checks implemented in Express routes (`objectAuthService.canAccessVideo`) are completely bypassed.
