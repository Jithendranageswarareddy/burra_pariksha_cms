# Burra Pariksha CMS — Chat Handover

**Updated:** 2026-10-24<br/>
**Verified baseline HEAD:** `d236820600cdf9037ae33b3f4084db75f11e299c` (branch `main`, synchronized with `origin/main`).

## Resume here

Read in this order:
1. `docs/project-control/MASTER_CONTEXT.md`
2. `docs/project-control/CURRENT_STATE.md`
3. `AGENTS.md`
4. `docs/README.md` or `docs/ENGINEERING-INDEX.md`, then only the specific current architecture/feature contract relevant to the task.

## Project mission

Build Burra Pariksha as a Telugu platform that helps people think faster, calculate faster, understand better, solve everyday problems, and make smarter decisions. Optimize for useful real-life content, trust, sustainable audience growth, and revenue—not raw question volume or unnecessary CMS complexity.

## Canonical content model

Modes: `TOPIC_INTRODUCTION`, `WORKED_EXAMPLES`, `QUESTION_CHALLENGE_SHORT`.  
Presentation formats: text, video, audio, image, animation.  
Mode = educational purpose; format = presentation. Keep Topic → Subtopic taxonomy.

## Current known repository/documentation state

- GitHub `main` and local workspace verified at baseline `d236820600cdf9037ae33b3f4084db75f11e299c`.
- Active governance structure: `AGENTS.md`, `docs/README.md`, `docs/ENGINEERING-INDEX.md`, `docs/project-control/`, `docs/architecture/` (ADR-001 through ADR-013), `docs/operations/`, `docs/TESTING-GUIDE.md`, and `docs/burrapariksha-content-planning/`.
- The `docs/project-control/` continuity layer is tracked in Git and indexed in `docs/README.md` and `docs/ENGINEERING-INDEX.md`.
- Sprint 10 documentation records Modes 2 and 3 as accepted with evidence and ready for manual deployment; these claims represent historical sprint reports and have not been independently tested against live production or rerun in this review.
- Historical sprint records (such as `docs/sprints/sprint-04/CURRENT-SPRINT.md`) remain preserved for provenance only.

## Critical unresolved compatibility question

Current implementation/history uses `EXPLAINED_QUESTIONS_VIDEO` for the legacy Mode 3 masterclass, while the approved product terminology uses `WORKED_EXAMPLES`. Do not rename IDs, change accepted batch sizes, migrate data, or alter tests until the compatibility approach and single-problem behavior are explicitly decided.

## Safety constraints

No production data mutation/cleanup, no production testing, no deploy, no publishing, no Git push/force-push, no external service changes, and no destructive Git operations without explicit action-specific authorization. Prefer code inspection, mocks, and verified isolated tests. Never claim tests passed unless executed with evidence.

## Next action

The continuity pack is established. The primary open architecture/product item is resolving the canonical content-mode compatibility design (`WORKED_EXAMPLES` versus `EXPLAINED_QUESTIONS_VIDEO`), and declaring the next active sprint or operational phase. Keep implementation changes, migrations, and deployments strictly paused until authorized by the owner.
