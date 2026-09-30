# Lifecycle Stage 13: Analytics Ingestion

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 23 of 35  
**Document:** 16 of 35  

---

## 1. Transition Details

| Attribute | Forensic Value |
| :--- | :--- |
| **Origin Entity** | Published Content (`BP-CNT-000001`) & Platform Performance Data |
| **Action** | Ingest 24h / 7d Audience Metric Snapshots |
| **Resulting Entity** | `SocialAnalyticsRecord` (`ANL-######`) |
| **State** | Active Snapshot Row |
| **Page / Component** | `SocialAnalyticsPage.tsx` |
| **Active Route** | `/social-analytics/:contentId` |
| **REST API** | `POST /api/analytics` |
| **Service Layer** | `analytics.service.ts:recordMetricSnapshot()` |
| **Repository Layer** | `analyticsRepository.appendRecord()` |
| **Authoritative Storage**| Google Sheets `ANALYTICS` worksheet (Isolated workbook) |
| **Next Entity / State** | Performance Review & Retention Diagnostics |

---

## 2. Ingestion Forensic Audit

1. **Auto-Baseline Creation:** At Stage 11, publishing automatically mints a baseline snapshot row with `views: 0, likes: 0, comments: 0`.
2. **Absence of Polling Daemons:** There are no background cron workers or webhooks polling YouTube Analytics. All subsequent snapshots (24h, 7d) require human data entry into `SocialAnalyticsPage.tsx`.
3. **Workbook Isolation:** The repository strictly targets `ANALYTICS_SPREADSHEET_ID` ensuring zero write contamination to production CMS sheets.
