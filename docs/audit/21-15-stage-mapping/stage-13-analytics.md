# Stage 13: Social Analytics Ingestion

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 21 of 30  
**Document:** 15 of 31  

---

## 1. Stage Identification

- **Canonical Stage:** 13 Analytics
- **Canonical Purpose:** Collection and recording of 24h and 7d audience engagement metrics (views, retention %, likes, comments).
- **Current Implementation:** `SocialAnalyticsPage.tsx`, `analytics.service.ts`, `analyticsRepository`.
- **Active Route:** `/social-analytics/:contentId`

---

## 2. Operational Flow Reconstructed

### INPUT
- Published content ID (`BP-CNT-######`) and platform post URLs.
- Audience metrics: Views, Watch Time (s), Retention Rate (%), Likes, Comments, Shares, Subscribers Gained, CTR (%).

### WORK
- Displays metric entry form with baseline auto-populated from Stage 11.
- Ingests manual audience performance data.
- **API Limitation:** Zero automated background polling against YouTube Analytics API or Instagram Insights. Metrics rely on manual human data entry.
- Appends snapshot to `ANALYTICS` worksheet with timestamp.

### OUTPUT
- `SocialAnalyticsRecord` (`ANL-######`) appended to `ANALYTICS` sheet.

### STATE
- **Entity:** `SocialAnalyticsRecord`
- **Field:** `snapshotTimestamp`
- **Current State:** Active metric row
- **State Machine:** Immutable append log
- **Authoritative Storage:** Google Sheets (`ANALYTICS` tab).

### NEXT STAGE
- **Expected Canonical Next Stage:** 14 Performance Review
- **Actual Implementation Next Stage:** Dispatches to `/analytics/engagement`.
- **Status Finding:** Partially implemented due to absence of automated API pollers.

---

## 3. Evidence & Status

- **Evidence:** `src/pages/SocialAnalyticsPage.tsx`, `src/lib/services/analytics.service.ts:72-150`.
- **Implementation Status:** **PARTIALLY IMPLEMENTED**
