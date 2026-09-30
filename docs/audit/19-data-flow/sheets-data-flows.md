# Sheets Data-Flow Architecture

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 11 of 35  

---

## 1. Google Sheets as Authoritative Tabular Store

Google Sheets API v4 serves as the authoritative tabular database for BP-CMS.

### 25 Active Schemas in `src/lib/schemas/google-sheets-schema.ts`:
- Core CMS Sheets: `QUESTIONS`, `QUESTION_DRAFTS`, `CONTENT_MASTERS`, `SCRIPTS`, `SCRIPT_VERSIONS`, `VIDEOS`, `QUESTION_VIDEOS`, `MEDIA_ASSETS`, `THUMBNAILS`, `THUMBNAIL_VERSIONS`, `PINNED_COMMENTS`, `SOCIAL_REVIEWS`, `PUBLISHING`, `PLATFORM_SYNC_LOGS`, `ANALYTICS`, `USERS`, `CATEGORIES`, `TOPICS`, `SUBTOPICS`, `QUESTION_CONFIG`, `AUDIT_LOGS`, `WORKFLOW_TRANSITIONS`, `SEQUENCES`, `ASSIGNMENTS`, `VALIDATIONS`.

### Data Flow Ingestion & Serialization:
```
TypeScript Object
  ↓ (objectToRow)
JSON stringification for complex objects/arrays (e.g. tags, options, layers)
Date formatting to ISO-8601 strings
  ↓
Google Sheets Row Array: [ "BP-Q-000001", "BP-CNT-000001", "CAT-001", ... ]
  ↓
Google Sheets Cells
```

### Retrieval & Deserialization:
```
Google Sheets Raw Row Array
  ↓ (rowToObject)
JSON.parse() on structured cells (wrapped in try/catch fallback)
Number/Boolean coercion
  ↓
Strongly Typed TypeScript Entity
```
