# Production Database Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 30 of 39  

---

## 1. Production Google Spreadsheet Architecture

The production database is hosted on Google Cloud infrastructure:
- **Primary Spreadsheet ID:** Configured via `SPREADSHEET_ID`.
- **Secondary Analytics Spreadsheet ID:** Configured via `ANALYTICS_SPREADSHEET_ID`.
- **Total Worksheets:** 25 tabs in Primary + 5 tabs in Analytics.
- **Physical Cell Capacity:** 10,000,000 cells max per spreadsheet.

---

## 2. Production API Quotas & Service Limits

| Google Cloud Service | Quota Metric | Quota Limit | Production Impact |
| :--- | :--- | :--- | :--- |
| **Google Sheets API v4** | Read Requests | 300 requests/minute/project | Peak read traffic exhausts quota, returning HTTP 429 |
| **Google Sheets API v4** | Write Requests | 300 requests/minute/project | Batch imports and rapid status toggles trigger throttling |
| **Google Sheets API v4** | Per-User Limit | 60 requests/minute/user | Service Account represents a single user; strictly capped |
| **Google Drive API v3** | File Uploads | 1,000 uploads/minute/user | Sufficient for video/thumbnail uploads |

---

## 3. High Availability & SLA Evaluation
- Google Sheets guarantees a 99.9% uptime SLA as part of Google Workspace.
- However, Google Sheets is architected for collaborative human productivity, NOT high-frequency machine transaction processing. Unscheduled rate-limiting and latency spikes of 1-3 seconds occur during high Google Cloud load.
