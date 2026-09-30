# Service Dependency Mapping Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 05 of 30  

---

## 1. Dependency Inversion & Architectural Layers

Services in BP-CMS exhibit a layered dependency hierarchy:
```
Presentation / Routes (routes.ts)
  ↓ imports
Domain & Workflow Services (video.service, question.service, publishing.service)
  ↓ imports
Support & Safety Services (audit.service, sequence-safety.service, id.service)
  ↓ imports
Infrastructure Storage Adapters (google-sheets.service, google-drive.service)
  ↓ calls
External Cloud APIs (Google Sheets API v4, Google Drive API v3, Google Gen AI SDK)
```

---

## 2. Dependency Fan-Out Analysis (Dependencies per Service)

| Service Name | Direct Service Dependencies | External SDK Dependencies | Storage Dependencies | Coupling Verdict |
| :--- | :---: | :---: | :---: | :--- |
| `publishingService` | 8 (`audit`, `video`, `auth`, `sheets`, `platform`, etc.) | YouTube API, Gen AI | Google Sheets | **VERY HIGH COUPLING** |
| `dataIntegrityService` | 6 (`sheets`, `video`, `question`, `taxonomy`, etc.) | None | All 18 Sheets Tabs | **HIGH COUPLING** |
| `videoService` | 5 (`sheets`, `audit`, `drive`, `workflow`, `sequence`) | Google Drive API | Google Sheets, Drive | **HIGH COUPLING** |
| `questionService` | 4 (`sheets`, `audit`, `sequence`, `taxonomy`) | None | Google Sheets | **MODERATE COUPLING** |
| `scriptService` | 3 (`sheets`, `audit`, `gemini`) | Gen AI SDK | Google Sheets | **MODERATE COUPLING** |
| `taxonomyService` | 2 (`sheets`, `audit`) | None | Google Sheets | **LOW COUPLING (Clean)** |
