# Multi-Action & Hidden Side-Effect Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 09 of 30  
**Document:** 20 of 30  

---

## 1. Multi-Action Architecture Overview

In several workflows, a single user click triggers a cascade of 3 or more operations across disparate services. This document records all high-consequence multi-action cascades.

---

## 2. Multi-Action Cascade Register

### Cascade 1: Question Approval (`QuestionVerifyApprovePage.tsx`)
- **Single User Click**: "Approve Question & Launch Production"
- **Side Effect 1**: Updates row in `Questions` sheet (`status = 'VERIFIED'`, `verified_by = userId`, `verified_at = timestamp`).
- **Side Effect 2**: Calls `sequenceSafetyService.allocate('VID')` allocating a sequential video ID (e.g. `BP-VID-104`).
- **Side Effect 3**: Calls `videosRepository.create()` inserting a new row in `Videos` sheet in `SCRIPT_READY` status.
- **Side Effect 4**: Calls `contentMasterService.linkOrCreate()` creating an authoritative Content Master record linking the question to the video.
- **Side Effect 5**: Calls `auditService.logEvent('QUESTION_VERIFIED')`.
- **Side Effect 6**: Navigates user to `/videos/:id?tab=script`.
- **Finding**: High complexity compound action. If Side Effect 3 fails after Side Effect 1, the question is marked verified without an associated video record!

### Cascade 2: Disaster Recovery Restore (`RecoveryAdminPage.tsx`)
- **Single User Click**: "Confirm Disaster Restore"
- **Side Effect 1**: Downloads and unzips backup snapshot tarball from GCS.
- **Side Effect 2**: Flushes in-memory cache repositories.
- **Side Effect 3**: Wipes existing rows in all 14 Google Sheets worksheets.
- **Side Effect 4**: Batch inserts all snapshot rows into Google Sheets.
- **Side Effect 5**: Writes high-priority audit log.
- **Finding**: Destructive full-system action.
