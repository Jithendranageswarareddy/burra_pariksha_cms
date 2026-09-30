# Orphan Entity Forensic Analysis

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 29 of 51  

---

## 1. Confirmed Orphan Entity Scenarios

Static code inspection and historical data audit scripts (`comprehensive-audit.ts`) identified **5 categories of orphan records**:

1. **Orphaned Videos (Missing Question):** Videos created with synthetic IDs during tests where `questionId` does not exist in `QUESTIONS`.
2. **Orphaned Scripts (Missing Video):** Scripts created during scriptwriting tests where `videoId` was deleted or modified.
3. **Orphaned Content Masters (Missing Primary Question):** Content Masters created in draft mode where primary question generation timed out.
4. **Orphaned Media Assets in Drive:** Files uploaded to Drive folders whose file IDs are not recorded in `MEDIA_ASSETS` or `VIDEOS` sheet tabs.
5. **Orphaned Assignments:** Assignments assigned to users who have been deactivated in `USERS` sheet.
