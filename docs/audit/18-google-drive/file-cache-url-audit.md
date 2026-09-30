# File Cache & URL Lifetimes Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 35 of 40  

---

## 1. Caching Mechanisms in File Tier

| Cache Tier | Implementation | Key Structure | TTL / Invalidation |
| :--- | :--- | :--- | :---: |
| **Folder ID Cache** | `GoogleDriveService.folderCache` | `${parentFolderId}/${folderName}` | Process Lifetime (Cleared on restart or `clearFolderCache()`) |
| **Browser HTTP Cache**| Express streaming headers | `Cache-Control: private, max-age=3600` | 1 hour |
| **Signed / Expiring URLs**| **NONE.** Drive webViewLinks are permanent static links | Static string format | Never expires (valid until file deleted or permissions changed) |

---

## 2. Stale Folder Cache Hazard
If an administrator renames or deletes a folder directly in Google Drive, `folderCache` continues returning the obsolete folder ID until the Node.js process is restarted, causing subsequent file uploads to fail with HTTP 404 `Parent folder not found`.
