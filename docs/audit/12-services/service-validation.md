# Service Validation Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 08 of 30  

---

## 1. Validation Implementation in Services

Validation inside services operates through two primary mechanisms:
1. **Zod Schema Parsing**: 17 domain services invoke `schema.parse()` or `schema.safeParse()` (using schemas from `src/lib/schemas/google-sheets-schema.ts` and `src/lib/ai/schemas/`).
2. **Imperative Invariant Assertions**: Throwing custom domain errors (`throw new Error(...)`) when parameters or business conditions are violated.

---

## 2. Service Validation Audit by Domain

| Service File | Validation Mode | Target Parameters / Rules | Error Behavior |
| :--- | :--- | :--- | :--- |
| `question.service.ts` | Zod `QuestionFilterSchema` & imperative | Question length, language enum, topic ID format | Throws `Error("Validation failed: ...")` |
| `script.service.ts` | Zod `SaveScriptInputSchema` | Hook length, duration bounds (30-180s), CTA | Throws `Error("Invalid script parameters")` |
| `video.service.ts` | Zod `QueueVideoInputSchema` & imperative | Drive URL validity, current status eligibility | Throws `Error("Invalid video transition")` |
| `publishing.service.ts` | Zod `UpdatePublishingInputSchema` | ISO timestamp, platform array non-empty | Throws `Error("Invalid publishing schedule")` |
| `taxonomy.service.ts` | Zod `BulkImportTaxonomyInputSchema` | Category uniqueness, parent topic foreign keys | Throws `Error("Duplicate taxonomy key")` |
| `assignment.service.ts`| Zod `CreateAssignmentInputSchema` | Assignee existence, entity type enum | Throws `Error("Assignee not found")` |
