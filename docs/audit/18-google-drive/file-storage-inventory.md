# File Storage Technology Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 02 of 40  

---

## 1. Storage Technologies Overview

A forensic sweep of dependencies, services, and runtime configurations reveals the following file-storage technologies in BP-CMS:

| Storage Tier / Technology | Package / Driver | Protocol / Transport | Environment | Classification | Primary Domain Purpose |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Google Drive API v3** | `googleapis ^176.0.0` | HTTPS REST API | Production / Staging | **ACTIVE (AUTHORITATIVE)** | Persistent storage for all binary media (videos, thumbnails, media assets) |
| **In-Memory Buffer Store** | Built-in `Buffer` / `Map` | V8 Heap Memory | Local Dev / Fallback | **ACTIVE (FALLBACK)** | Ephemeral buffer store (`mockFiles`) when Drive credentials are missing |
| **Local Container Filesystem**| Node.js `fs` | POSIX Filesystem | Cloud Run Container | **EPHEMERAL / RUNTIME** | Application bundle, temporary multipart stream buffers; wiped on scale-down |
| **Google Cloud Storage (GCS)**| None | HTTPS | None | **UNUSED / NON-EXISTENT** | No `@google-cloud/storage` package installed; zero buckets configured |
| **AWS S3 / Azure Blob** | None | HTTPS | None | **UNUSED / NON-EXISTENT** | Zero AWS or Azure SDKs configured |
| **Content Delivery Network (CDN)**| None | HTTPS | None | **UNUSED / NON-EXISTENT** | Media streamed directly through backend proxy or Google Drive webViewLink |

---

## 2. Technology Role Analysis

1. **Google Drive API v3:**  
   Google Drive is the sole persistent object storage engine. It provides hierarchical folder organization, file metadata, MIME-type classification, and binary streaming over HTTPS.
2. **Local Container Filesystem:**  
   On Google Cloud Run, the container filesystem is ephemeral and read-only except for `/tmp`. BP-CMS does NOT write media files to disk; multipart uploads via `busboy` buffer chunks directly into Node.js `Buffer` memory and pipe them immediately to Google Drive.
3. **In-Memory Binary Mock Store (`mockFiles`):**  
   Implemented in `GoogleDriveService`:
   ```typescript
   private mockFiles = new Map<string, MockStoredFile>();
   ```
   Stores uploaded binary buffers in memory during test execution or when `SKIP_DRIVE_SYNC=true`.
