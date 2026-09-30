# Google Drive Endpoints Forensic Audit (18 Endpoints)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 14 of 30  

---

## 1. Google Drive Integration Architecture

Google Drive serves as the binary asset store for large media files (video takes, edited MP4s, thumbnail PNGs) via the Google Drive API v3:
- Service Implementation: `src/lib/services/google-drive.service.ts` and `src/lib/services/phase14-drive.service.ts`

---

## 2. Google Drive Endpoint Register (18 Endpoints)

| Endpoint Path | Method | Operation on Drive | Asset Type | Permission Required |
| :--- | :--- | :--- | :--- | :---: |
| `/api/videos/:id/record` | `POST` | Verifies & links raw take Drive URL | MP4 Take | `PRESENTER` |
| `/api/videos/:id/edit` | `POST` | Verifies & links edited cut Drive URL | MP4 Cut | `EDITOR` |
| `/api/videos/:id/drive-assets` | `GET` | Lists all Drive files in video project folder | Folder Contents | Authenticated |
| `/api/thumbnails/:id/upload` | `POST` | Uploads thumbnail image directly to Drive | PNG / JPG | `DESIGNER` |
| `/api/media/upload` | `POST` | Multi-part direct asset upload to Drive | Media Asset | Authenticated |
| `/api/phase14/drive/verify` | `POST` | Verifies folder sharing permissions | Drive Folder | `ADMIN` |
| `/api/phase14/drive/create-folder`| `POST` | Creates dedicated episode folder hierarchy | Drive Folders | `MANAGER` |
