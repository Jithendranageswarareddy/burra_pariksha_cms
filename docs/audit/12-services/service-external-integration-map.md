# Service External Integration Forensic Map

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 40 of 30  

---

## 1. External System SDK & Provider Map

| External Provider | Target Cloud Resource | Consuming Service | Authentication Mechanism | Rate Limits / Quotas |
| :--- | :--- | :--- | :--- | :--- |
| **Google Sheets API** | Spreadsheet (18 worksheet tabs) | `googleSheetsService` | Google Cloud Service Account JWT | 60 read & 60 write req/min per user |
| **Google Drive API** | Cloud storage folders & files | `googleDriveService` | Google Cloud Service Account JWT | 1,000 req/100s |
| **Google Gen AI SDK** | Gemini 2.5 Pro / Flash, Imagen | `geminiService`, `copilotService`| `GEMINI_API_KEY` / AI Studio | Model tokens per minute (TPM/RPM) |
| **YouTube Data API** | YouTube Channel Videos / Playlists | `publishingService` | OAuth 2.0 User Token (Bearer) | 10,000 units/day quota |
| **Meta Graph API** | Instagram Graph / Facebook Pages | `socialReviewService` | Page Access Token | Platform rate limit headers |
