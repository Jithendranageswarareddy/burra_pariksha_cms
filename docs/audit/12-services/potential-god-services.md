# Potential God Services Forensic Analysis (4 Services)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 32 of 30  

---

## 1. Definition & Audit Criteria

A service is classified as a **POTENTIAL GOD SERVICE** when objective code evidence demonstrates:
- Disproportionate size (> 900 lines of code)
- Coordination of multiple unrelated entity domains
- Direct involvement across 4 or more workflow conveyor stages
- Heavy fan-out dependencies to unrelated domain services

---

## 2. In-Depth Analysis of the 4 Potential God Services

### 1. `PublishingService` (`src/lib/services/publishing.service.ts`)
- **Metrics**: 2,168 lines, 46 methods, 8 dependencies.
- **Responsibilities Observed**:
  1. Multi-platform video scheduling (YouTube, Instagram, Facebook)
  2. Formatting and text truncation per platform character limits
  3. Hashtag extraction and normalization
  4. YouTube API upload execution
  5. Live publication status polling and synchronization
  6. Audit log event writing
  7. Video status updates in `VIDEOS` sheet
- **Cohesion**: LOW. Combines external platform dispatch, social text formatting, database synchronization, and workflow state transitions into a single monolithic class.

### 2. `DataIntegrityService` (`src/lib/services/data-integrity.service.ts`)
- **Metrics**: 1,835 lines, 38 methods, 6 dependencies.
- **Responsibilities Observed**: Scans, validates, and performs raw repairs across all 18 Google Sheets tabs, bypassing domain service business rules.

### 3. `DashboardService` (`src/lib/services/dashboard.service.ts`)
- **Metrics**: 1,425 lines, 34 methods, 4 dependencies.
- **Responsibilities Observed**: Aggregates metrics from 8 sheets, computes velocities, formats UI chart time-series, and caches state.

### 4. `VideoService` (`src/lib/services/video.service.ts`)
- **Metrics**: 920 lines, 28 methods, 5 dependencies.
- **Responsibilities Observed**: Manages video take recording, Drive link verification, editor cut submissions, 12-point QC checklist validation, and publishing task creation.
