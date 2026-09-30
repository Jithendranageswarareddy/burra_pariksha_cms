# File Upload Validation Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 32 of 40  

---

## 1. Multi-Tier File Validation Matrix

| Validation Check | Frontend UI Validation | Express Middleware | Service Layer Validation | Storage Tier Enforcement |
| :--- | :---: | :---: | :---: | :---: |
| **File Extension Check** | `accept="video/mp4,video/*"` | None | `validateMediaAsset` (Strict) | None |
| **MIME Type Allowlist** | Browser file selection filter | None | Verified against category allowlist | None (Google accepts any MIME) |
| **Extension vs MIME Match**| None | None | Rejects mismatched `.png` with `image/jpeg`| None |
| **Maximum File Size** | None | `busboy` file size limit | 100MB (Videos) / 5MB (Thumbnails) | None (Google Drive allows 5TB) |
| **Path Traversal Sanitization**| None | None | Strips `/`, `\\`, and `..` from filenames | Google Drive accepts any name |
| **Zero-Byte File Rejection** | None | None | `buffer.length === 0` throws error | Google Drive accepts empty files |
| **Magic Byte Inspection** | None | None | ❌ None (Relies on client-sent MIME) | None |

---

## 2. Security Gap: Client-Reported MIME Types
Validation relies on the client-supplied `info.mimeType` from the multipart header. The system does not inspect magic bytes (`file-type` package). A malicious executable renamed to `video.mp4` and sent with `Content-Type: video/mp4` passes validation and uploads to Google Drive.
