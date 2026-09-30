# Database ↔ Sheets Schema Conflict Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 23 of 39  

---

## 1. TypeScript Interface vs Sheet Header Drift

A line-by-line comparison between TypeScript domain interfaces (`src/types/index.ts`) and Google Sheets Schema Contracts (`src/lib/schemas/google-sheets-schema.ts`) reveals several significant schema drift discrepancies:

| Domain Entity | TypeScript Interface Property (`src/types/`) | Sheet Contract Column Name (`google-sheets-schema.ts`) | Conflict Classification | Forensic Evidence & Impact |
| :--- | :--- | :--- | :---: | :--- |
| **Question** | `explanationHtml` | `explanation_html` | **NAMING DRIFT** | Mapping layer successfully maps propertyKey to name |
| **Question** | `tags: string[]` | `tags` (comma-delimited string) | **TYPE MISMATCH** | Deserializer splits by comma; commas in tags break parsing |
| **Video** | `contentMasterId` | `content_master_id` & `content_id` | **DUPLICATE COLUMNS**| Both exist in sheet; service writes both for compatibility |
| **Video** | `productionStage` | `status` | **SEMANTIC DRIFT** | TS interface uses `productionStage` while sheet uses `status` |
| **User** | `permissions: string[]` | `permissions` (JSON string) | **TYPE MISMATCH** | Stored as stringified JSON array in plain text cell |
| **ContentPlan** | `targetDates: Record<string, string>`| `target_dates` (JSON string) | **COMPLEX NESTING** | Sheet cell contains serialized JSON object |
| **SocialReview**| `checklist: QualityChecklist` | `checklist` (JSON string) | **COMPLEX NESTING** | Sheet cell contains serialized 12-boolean checklist |

---

## 2. Nullability & Optional Field Drift
- In TypeScript interfaces, fields like `updated_by`, `notes`, and `review_notes` are marked optional (`?:`).
- In Google Sheets, blank cells return as empty strings (`""`).
- If deserialization logic does not explicitly convert `""` to `undefined` or `null`, Zod string validations (`.min(1)`) fail unexpectedly on blank cells.
