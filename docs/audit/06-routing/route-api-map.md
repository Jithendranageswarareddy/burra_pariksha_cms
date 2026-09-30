# Route to Backend API Endpoint Mapping

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 06 — Complete Route Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. API Operations Triggered by Frontend Routes

| Frontend Route Path | Primary API Endpoint | HTTP Method | Purpose | Data Entity Mutated |
| :--- | :--- | :---: | :--- | :--- |
| `/dashboard` | `/api/dashboard/stats` | GET | Fetch high-level KPIs and operational status | None (Read-only) |
| `/planning` | `/api/planning/*` (17 endpoints) | GET / POST | Fetch syllabi, gaps, batches; create batch | Google Sheets (`Batches`) |
| `/questions` | `/api/questions` | GET | List, search, and paginate questions | None (Read-only) |
| `/studio` | `/api/ai/generate-question` | POST | Generate AI question candidates | In-memory draft |
| `/studio` | `/api/questions` | POST | Save draft question | Google Sheets (`Questions`) |
| `/questions/improve` | `/api/questions/improve` | POST | Trigger AI quality improvement pass | Google Sheets (`Questions`) |
| `/questions/:id/verify`| `/api/questions/verify` | POST | Approve or reject question candidate | Google Sheets (`Questions`, `Workflows`) |
| `/queue` | `/api/queue` | GET | Retrieve videos ready for teleprompter filming | None (Read-only) |
| `/videos/create-script` | `/api/scripts/generate` | POST | Generate Telugu script via AI | Google Sheets (`Scripts`) |
| `/videos/:videoId` (Tab 04)| `/api/videos/upload` | POST | Stream raw video binary to Google Drive | Google Drive + Google Sheets (`Videos`) |
| `/videos/:videoId` (Tab 08)| `/api/thumbnails/generate`| POST | Trigger AI thumbnail candidate generation | In-memory candidates |
| `/publishing` | `/api/publishing/schedule` | POST | Schedule post across YouTube/Instagram | Google Sheets (`Publishing`) |
| `/publishing` | `/api/publishing/sync` | POST | Fetch live platform publish status | Google Sheets (`Publishing`) |
| `/recovery` | `/api/recovery/restore` | POST | Execute full/granular disaster recovery | Google Sheets (All operational sheets) |
