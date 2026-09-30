# File Type & MIME Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 05 of 40  

---

## 1. Supported File Types & MIME Specifications

File types and validation rules are declared in `src/lib/services/phase14-drive.service.ts` and `src/lib/services/video.service.ts`:

| Media Stage | Allowed Extensions | Allowed MIME Types | Max File Size | Strict Constraints |
| :--- | :--- | :--- | :---: | :--- |
| **RAW VIDEO** | `.mp4`, `.mov`, `.mkv`, `.webm` | `video/mp4`, `video/quicktime`, `video/x-matroska`, `video/webm` | 100 MB | Filename must not contain path traversal characters (`/`, `..`) |
| **EDITED VIDEO**| `.mp4`, `.mov`, `.mkv`, `.webm` | `video/mp4`, `video/quicktime`, `video/x-matroska`, `video/webm` | 100 MB | Must match allowed video extensions |
| **FINAL VIDEO** | `.mp4` | `video/mp4` (Strict) | 100 MB | **STRICT ENFORCEMENT:** Non-MP4 formats strictly rejected for FINAL publishing |
| **THUMBNAIL** | `.jpg`, `.jpeg`, `.png` | `image/jpeg`, `image/png`, `image/jpg` | 5 MB | Extension must match MIME type exactly (e.g. `image/png` requires `.png`) |
| **SCRIPTS** | None (Drive) | N/A | N/A | Stored as text strings in Google Sheets `SCRIPT` tab; zero Drive files |
| **DOCUMENTS** | None (Drive) | N/A | N/A | No PDF or Word documents stored in Drive |

---

## 2. MIME Validation Logic (`validateMediaAsset`)
- Rejects extension-MIME mismatches (e.g. `image/png` with `.jpg` extension throws `ValidationError`).
- Rejects zero-byte empty uploads (`fileSize === 0`).
- Enforces configurable limits via `MAX_VIDEO_SIZE_BYTES` (default: 100MB) and `MAX_THUMBNAIL_SIZE_BYTES` (default: 5MB).
