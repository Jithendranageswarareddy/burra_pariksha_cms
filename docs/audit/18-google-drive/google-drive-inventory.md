# Google Drive Integration Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 03 of 40  

---

## 1. Core Integration Module

- **Implementation File:** `src/lib/services/google-drive.service.ts`
- **Singleton Instance:** `googleDriveService = GoogleDriveService.getInstance()`
- **API Version:** Google Drive REST API `v3` via `googleapis`

---

## 2. Authentication Provider Modes

`GoogleDriveService.getAuthProviderMode()` dynamically resolves authentication based on environment variables:

| Mode | Trigger Conditions | Active in Current Runtime | Security Assessment |
| :--- | :--- | :---: | :--- |
| **`OAUTH2`** | `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` + `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN` present | **YES (CONFIRMED)** | Production-grade OAuth 2.0 user credentials; auto-refreshes 1-hour access tokens |
| **`SERVICE_ACCOUNT`** | `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY` present AND `NODE_ENV !== 'production'` | **NO (FALLBACK ONLY)**| Restricted to non-production to avoid service account Drive quota limitations |
| **`NONE`** | Credentials missing OR `SKIP_DRIVE_SYNC === 'true'` | **NO** | Routes operations to in-memory `mockFiles` |

---

## 3. Operations Supported by `GoogleDriveService`

1. `ensureFolder(folderName, parentFolderId)`: Resolves or creates folder by name with in-memory caching (`folderCache`).
2. `ensureContentHierarchy(contentId)`: Resolves Phase 7 folder tree (`Root -> Content -> BP-CNT-###### -> { Videos, Scripts, Thumbnails }`).
3. `ensureProductionHierarchy(contentId)`: Resolves Phase 14 folder tree (`Root -> BP-CNT-###### -> { Raw, Edited, Final, Thumbnail }`).
4. `uploadFile(params)`: Uploads `Readable` stream or `Buffer` to target folder with MIME and description.
5. `getFileMetadata(fileId)`: Fetches `id, name, mimeType, size, webViewLink, createdTime, parents`.
6. `downloadFile(fileId, rangeHeader)`: Streams file with full HTTP Range (206 Partial Content) support.
7. `deleteFile(fileId)`: Permanently deletes file by ID (used for rollback/cleanup).
8. `listContentFoldersAndFiles(contentId)`: Recursively lists hierarchy contents.
