# Script & Script Version Entity Forensic Dossier

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 13 of 51  

---

## 1. Script Identity & Physical Storage

- **Classification:** Business Entity (Verbal Teleprompter Artifact)
- **Primary Identifier:** `BP-S-XXXXXX` (6 digits)
- **Version Identifier:** `BP-SV-XXXXXX` (Stored in `SCRIPT_VERSIONS` tab)
- **Physical Representation:** Row in `SCRIPT` Google Sheets tab + historical rows in `SCRIPT_VERSIONS`
- **TypeScript Model:** `interface Script`, `interface ScriptVersion` (`src/types/index.ts:410–475`)
- **Repositories:** `scriptsRepository`, `scriptVersionsRepository`

---

## 2. Pacing & Teleprompter Fields

| Header | Type | Description |
| :--- | :---: | :--- |
| `id` | string | Primary Key (`BP-S-XXXXXX`) |
| `video_id` | string | FK to `VIDEOS.id` |
| `question_id` | string | FK to `QUESTIONS.id` |
| `script_body` | string | Spoken dialogue formatted for teleprompter |
| `target_duration_seconds` | number | Target duration (Strict limit <= 180s) |
| `estimated_duration_seconds`| number | Derived: `wordCount / WPM * 60` |
| `version_number` | number | Monotonic version counter (1, 2, 3...) |
| `status` | enum | `DRAFT`, `APPROVED`, `REVISION_REQUIRED` |
