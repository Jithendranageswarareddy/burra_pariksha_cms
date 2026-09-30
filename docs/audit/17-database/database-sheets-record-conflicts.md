# Database ↔ Sheets Record-Level Conflict Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 22 of 39  

---

## 1. Dual-Database Conflict Verification

Section 23 of the audit charter mandates:
*"If safe read-only access to both database and Sheets exists, compare actual records for overlapping entities."*

### Forensic Finding:
```
================================================================================
RECORD-LEVEL CONFLICT AUDIT:
STATUS: NO RECORD DESYNCHRONIZATION BETWEEN RELATIONAL DATABASE AND SHEETS.
REASON: A SEPARATE RELATIONAL SQL DATABASE DOES NOT EXIST IN THE RUNTIME.
GOOGLE SHEETS IS THE SOLE TABULAR PERSISTENCE ENGINE.
THERE IS NO SECONDARY SQL DATABASE CONTAINING COMPETING RECORDS.
================================================================================
```

---

## 2. Cross-Sheet Record Conflict Risks (Internal Desynchronization)

While there is no external SQL database to desynchronize with, the application suffers from **internal record conflicts across related sheets**:

1. **Question ↔ Video Array Desynchronization:**  
   - `QUESTIONS.video_ids`: JSON array stored directly in the `QUESTIONS` row (e.g. `["BP-V-000001", "BP-V-000002"]`).
   - `QUESTION_VIDEOS`: Dedicated join table linking `question_id` to `video_id`.
   - **Conflict:** When a video is deleted or detached, `VIDEOS` and `QUESTION_VIDEOS` are updated, but `QUESTIONS.video_ids` frequently retains the dangling reference.
2. **Video ↔ Content Master Conflict:**  
   - `VIDEOS.content_id` vs `VIDEOS.content_master_id`.
   - In older rows, `content_id` holds a legacy ID while `content_master_id` is populated with a new canonical ID, causing inconsistent joins.
3. **Thumbnail ↔ Video Linkage:**  
   - `THUMBNAILS.is_active` vs `VIDEOS.drive_thumb_url`.
   - Promoting a new thumbnail in `THUMBNAILS` can succeed while the subsequent write to update `VIDEOS.drive_thumb_url` fails, leaving the video displaying an obsolete thumbnail.
