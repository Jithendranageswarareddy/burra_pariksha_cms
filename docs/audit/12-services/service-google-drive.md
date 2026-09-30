# Google Drive Services Forensic Audit (6 Services)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 17 of 30  

---

## 1. Google Drive Media Management

Six services coordinate binary media storage in Google Drive:
- `google-drive.service.ts` (Core Drive API adapter)
- `phase14-drive.service.ts` (Episode folder generator)
- `video.service.ts` (Take link verification)
- `thumbnail.service.ts` (Thumbnail PNG asset uploader)
- `snapshot-exporter.service.ts` (DR JSON backup uploader)
- `data-integrity.service.ts` (Dangling Drive URL scanner)

---

## 2. Drive Operational Characteristics
- **Authentication**: Google Service Account credentials via `GOOGLE_APPLICATION_CREDENTIALS`.
- **Folder Structure**: Automated hierarchical folder generation: `BurraPariksha_CMS / [Subject] / [Topic] / Video_[ID]`.
- **Permission Checking**: Services verify public or domain sharing permissions prior to accepting Drive links from presenters and editors.
