# Draft Question Entity Forensic Dossier

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 11 of 51  

---

## 1. Nature of the Draft Entity

Forensic analysis of `src/lib/repositories/question-drafts.repository.ts` and `src/types/index.ts:1680–1720` reveals that **Draft Question is a distinct pre-canonical entity, NOT merely a status on the canonical Question entity**:

- **Identifier:** `BP-DFT-XXXXXX` (or ephemeral client UUID)
- **Classification:** Draft / Temporary Entity
- **Physical Storage:** Ephemeral application memory cache (`Map<string, DraftQuestion>`), browser `localStorage`, and optional scratchpad rows.
- **Source of Truth:** Application memory / active client session.

---

## 2. Canonicalization Lifecycle

```
[PROMPT / SYLLABUS] -> [AI GENERATION] -> [DRAFT ENTITY: BP-DFT-001]
                                                    |
                                            (Editor Refines)
                                                    |
                                            [PROMOTION GATE]
                                                    |
                                         (Validates 4 options)
                                                    |
                                    [CANONICAL ENTITY: BP-Q-000042]
                                                    |
                                      (Draft Entity is PURGED)
```

---

## 3. Disconnects & Leaks
When an editor clicks "Approve Draft" (`POST /api/questions/draft/:id/approve`), the server invokes `sequenceSafetyService.getNextId('QUESTION')`, allocates a permanent `BP-Q-` ID, writes the record to the `QUESTIONS` sheet, and deletes the draft. If the promotion fails halfway through the write, the draft is deleted while the question row is missing, causing unrecoverable content loss.
