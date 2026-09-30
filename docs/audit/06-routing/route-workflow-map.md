# Route to 15-Stage Workflow Correlation

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 06 — Complete Route Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Mapping Routes to Canonical Production Stages

| Stage # | Canonical Stage Name | Canonical Route Path | Supporting Route Paths | Relationship Type |
| :-: | :--- | :--- | :--- | :---: |
| **01** | Question Generation | `/studio` | `/questions/new`, `/generate`, `/planning` | **DIRECT** |
| **02** | Question Verification | `/questions/:id/verify` | `/questions/verify`, `/questions/improve` | **DIRECT** |
| **03** | Audience Script | `/videos/create-script` | `/videos/:id?tab=script` | **DIRECT** |
| **04** | Teleprompter & Filming | `/videos/:id?tab=recording` | `/queue`, `/videos/:id/record` | **DIRECT** |
| **05** | Raw Video Ingestion | `/videos/:id?tab=recording` | Footage upload dialog | **DIRECT** |
| **06** | Editing Bay | `/videos/:id?tab=editing` | `/production?status=EDITING`, `/videos/:id/edit-video` | **DIRECT** |
| **07** | Final QC & Signoff | `/videos/:id?tab=final-review`| `/videos/:id/final-video` | **DIRECT** |
| **08** | Thumbnail Design | `/videos/:id?tab=thumbnail` | `/videos/:id/thumbnail` | **DIRECT** |
| **09** | Social Review & Comments | `/social-review` | `/videos/:id?tab=social`, `/videos/:id?tab=pinned-comment`| **DIRECT** |
| **10** | Publishing Setup | `/platform-packages` | `/videos/:id/platform-packages` | **DIRECT** |
| **11** | Published | `/publishing` | `/videos/:id?tab=publishing` | **DIRECT** |
| **12** | Platform Sync | `/publishing` | `/publishing` (Live platform sync polling) | **DIRECT** |
| **13** | Analytics Ingestion | `/social-analytics` | `/social-analytics/:contentId` | **DIRECT** |
| **14** | Performance Review | `/analytics/overview` | `/analytics/video`, `/platform`, `/topic`, etc. | **DIRECT** |
| **15** | Intelligence Loop | `/analytics/intelligence` | `/analytics/strategy`, `/planning` | **DIRECT** |
