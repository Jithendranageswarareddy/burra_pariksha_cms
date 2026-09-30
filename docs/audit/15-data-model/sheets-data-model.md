# Google Sheets Data Model Forensic Reconciliation

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 38 of 51  

---

## 1. Authoritative Worksheet Architecture

Google Sheets serves as the authoritative tabular database for BP-CMS. The system expects a single master spreadsheet containing **25 authoritative worksheet tabs**:

- Core Domain: `USERS`, `CATEGORIES`, `TOPICS`, `SUBTOPICS`, `QUESTIONS`, `CONTENT_MASTERS`, `QUESTION_VIDEOS`, `VIDEOS`, `SCRIPT`, `SCRIPT_VERSIONS`, `THUMBNAILS`, `THUMBNAIL_VERSIONS`, `PINNED_COMMENTS`, `PINNED_COMMENT_VERSIONS`, `ASSIGNMENTS`, `PUBLISHING`, `SOCIAL_REVIEWS`, `QUESTION_VALIDATIONS`, `QUESTION_CONFIG`, `MEDIA_ASSETS`.
- Planning: `CONTENT_PLANS`, `CONTENT_BATCHES`.
- System Infrastructure: `WORKFLOW`, `AUDIT_LOG`, `SEQUENCES`.

---

## 2. Structural Sheet Weaknesses
- **No Type Enforcement:** Google Sheets treats cells as loose variants. A number can be stored as a string, breaking `zod` parsers.
- **Header Fragility:** If a user renames or reorders a column header in the sheet, the header-to-property mapping in `base.repository.ts` silently maps values to `undefined`.
