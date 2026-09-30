# SDLC Pre-Gate: 03 — Rename Impact Analysis

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Pre-SDLC Normalization Impact Analysis  
**Status:** **AUTHORITATIVE ANALYSIS**  
**Date:** 2026-09-29  

---

## 1. Impact Assessment Across System Boundaries

To guarantee 100% functional equivalence and zero regressions during normalization, the impact of normalizing legacy phase names has been evaluated across all system layers:

### 1.1 Application Routes & URLs
- **Status:** **100% UNTOUCHED**.
- No URLs (e.g. `/questions`, `/studio`, `/record/:id`, `/publishing`) contain `phase` in their routes. All client route paths are strictly preserved.

### 1.2 REST API Contracts
- **Status:** **100% UNTOUCHED**.
- All REST endpoints (`/api/questions`, `/api/videos`, `/api/publishing`, etc.) remain identical. No endpoint path is altered.

### 1.3 Database & Google Sheets
- **Status:** **100% UNTOUCHED**.
- Worksheet names (`QUESTIONS`, `VIDEOS`, `SCRIPTS`, `USERS`, `AUDIT_LOG`, etc.) and column headers remain 100% identical.

### 1.4 Google Drive Storage
- **Status:** **100% UNTOUCHED**.
- Storage folders and file naming conventions remain 100% identical.

### 1.5 Package Scripts & CI/CD
- **Strategy:** Retain existing `test:phaseXX` scripts as backward-compatible aliases while adding canonical domain test commands (e.g. `test:unit`, `test:workflow`, `test:all`).
