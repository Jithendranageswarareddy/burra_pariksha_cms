# API Data Model Reconciliation

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 41 of 51  

---

## 1. Discrepancies between API Contracts & Storage Entities

Comparing `src/server/routes.ts` payloads against Google Sheets schemas:

| Field / Entity | Location in API Payload | Location in Google Sheets | Discrepancy / Severity |
| :--- | :--- | :--- | :--- |
| **Question Options** | `options: Array<{ id, text, isCorrect }>` | Serialized JSON string | **MEDIUM**: API exposes typed array; storage serializes to raw JSON string in single cell. |
| **Video Assignments**| `POST /api/videos/:id/assignments` | Handled in `ASSIGNMENTS` sheet | **LOW**: Video payload embeds assignment IDs not persisted directly in `VIDEOS` sheet. |
| **Publishing Platforms**| Nested object (`youtube`, `instagram`) | Flattened columns (`youtube_status`, etc.) | **MEDIUM**: Object-relational mapping handled procedurally in repository serializer. |
| **User Role** | String literal (e.g. `"TOPIC_LEAD"`) | String column | **LOW**: Validated via TypeScript enum and Zod schema. |
