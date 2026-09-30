# External URLs & 3rd-Party Navigation Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 07 of 30  
**Document:** 20 of 27  

---

## 1. External Integration Boundaries

BP-CMS interfaces with external cloud ecosystems for asset storage, live publishing, and disaster recovery. All outbound navigation transitions must conform to strict security policies (`rel="noopener noreferrer"`, `target="_blank"`).

---

## 2. Outbound Links Inventory

| Integration Ecosystem | Target URL Pattern | Launch Context / Component | Security Attributes | Risk Classification |
| :--- | :--- | :--- | :--- | :--- |
| **Google Drive Assets** | `https://drive.google.com/file/d/:id/view` | Video player raw footage link (`RecordingWorkspace`) | `target="_blank" rel="noopener noreferrer"` | SECURE |
| **Google Drive Thumbnails**| `https://drive.google.com/file/d/:id/view`| Thumbnail inspector (`ThumbnailWorkspace`) | `target="_blank" rel="noopener noreferrer"` | SECURE |
| **Google Sheets Database** | `https://docs.google.com/spreadsheets/d/:id`| System Health Sheets link (`SettingsPage`) | `target="_blank" rel="noopener noreferrer"` | SECURE |
| **Google Cloud Storage (GCS)**| Backup archive URI (`gs://...`) | Recovery archive details (`RecoveryAdminPage`) | Rendered as text / non-clickable | SECURE |
| **YouTube Video Live URL** | `https://youtube.com/watch?v=:id` or `/shorts/:id`| Live verification link (`PlatformPackagesPage`) | `target="_blank" rel="noopener noreferrer"` | SECURE |
| **Instagram Reel Live URL**| `https://instagram.com/reel/:id/` | Platform sync verification (`PlatformPackagesPage`) | `target="_blank" rel="noopener noreferrer"` | SECURE |
| **Telegram Channel Post** | `https://t.me/burra_pariksha/:id` | Community broadcast link (`PlatformPackagesPage`) | `target="_blank" rel="noopener noreferrer"` | SECURE |

---

## 3. Protocol & Isolation Compliance

- **No window.open without noopener**: Verified that all anchor links targeting external URLs include `rel="noopener noreferrer"`.
- **Sandbox Compliance**: Outbound external links do not interfere with container sandbox boundaries.
