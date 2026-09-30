# Duplicate Table Conceptual Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 28 of 39  

---

## 1. Conceptual Overlap Analysis

A domain-level audit of table responsibilities was performed to detect tables representing duplicate or overlapping concepts:

### 1. `VIDEOS` vs `QUESTION_VIDEOS`
- `VIDEOS` represents the full video production entity (32 columns, status, drive URLs, teleprompter text).
- `QUESTION_VIDEOS` represents the relational association between questions and videos (5 columns).
- **Finding:** Not duplicate entities, but the relational join table is largely made redundant by `QUESTIONS.video_ids` array.

### 2. `CONTENT_MASTERS` vs `CONTENT_PLANS` vs `CONTENT_BATCHES`
- `CONTENT_PLANS` (18 columns): High-level monthly/quarterly editorial strategy.
- `CONTENT_BATCHES` (11 columns): Operational grouping of questions within a plan.
- `CONTENT_MASTERS` (12 columns): Content umbrella grouping a finalized question, script, video, and social package.
- **Finding:** Distinct operational tiers across the lifecycle: Planning -> Batching -> Production Execution.

### 3. `SCRIPT` vs `SCRIPT_VERSIONS`
- `SCRIPT` (13 columns): Represents current active production script.
- `SCRIPT_VERSIONS` (7 columns): Append-only audit history of past revisions.
- **Finding:** Proper normalization of active vs historical data.
