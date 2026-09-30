# Master Endpoint to Storage Map

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 29 of 30  

---

## 1. Master Matrix: Route -> Service -> Repository -> Storage

| Endpoint ID | Route Path | Method | Entity | Service | Storage System | Target Worksheet / Asset | Confidence |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| **API-006** | `/api/questions` | `GET` | Question | `questionService` | Google Sheets | `QUESTIONS` | CONFIRMED |
| **API-007** | `/api/questions` | `POST` | Question | `questionService` | Google Sheets | `QUESTIONS`, `CONTENT_MASTERS`, `AUDIT_LOG` | CONFIRMED |
| **API-012** | `/api/videos` | `GET` | Video | `videoService` | Google Sheets | `VIDEOS` | CONFIRMED |
| **API-014** | `/api/videos/:id/record` | `POST` | Video Take | `videoService` | Google Sheets / Drive | `VIDEOS`, Google Drive MP4 | CONFIRMED |
| **API-015** | `/api/videos/:id/edit` | `POST` | Video Cut | `videoService` | Google Sheets / Drive | `VIDEOS`, Google Drive Cut | CONFIRMED |
| **API-016** | `/api/videos/:id/final-qc` | `POST` | Video QA | `videoService` | Google Sheets | `VIDEOS`, `WORKFLOW`, `ASSIGNMENTS` | CONFIRMED |
| **API-017** | `/api/videos/:id/script` | `POST` | Script | `scriptService` | Google Sheets | `SCRIPT`, `SCRIPT_VERSIONS` | CONFIRMED |
| **API-018** | `/api/videos/:id/thumbnail`| `POST` | Thumbnail | `thumbnailService`| Google Sheets / Drive | `THUMBNAILS`, Google Drive PNG | CONFIRMED |
| **API-019** | `/api/publishing/schedule` | `POST` | Publishing | `publishingService`| Google Sheets | `PUBLISHING`, `AUDIT_LOG` | CONFIRMED |
| **API-020** | `/api/recovery/restore` | `POST` | Snapshot | `recoveryService` | Google Sheets / Filesystem | All 18 Sheets Tabs, Local JSON | CONFIRMED |
