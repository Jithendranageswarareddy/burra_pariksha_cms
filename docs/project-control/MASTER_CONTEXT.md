# Burra Pariksha CMS — Master Context

**Purpose:** Durable project briefing for ChatGPT, Antigravity, and future contributors.  
**Status:** Initial draft based on a read-only review of GitHub `main` at `82a89eac65713278aa437119449c0533195eb52b` on 2026-10-24. Verify before relying on time-sensitive implementation details.

## 1. Product mission

Burra Pariksha should grow from an aptitude-and-reasoning question channel into a Telugu learning platform that helps people think faster, calculate faster, understand situations, solve everyday problems, and make smarter decisions. Content should deliver genuine real-life value and build audience trust. The business objective is sustainable views and revenue without sacrificing accuracy, clarity, accessibility, or trust.

BP-CMS is the operational system for planning, producing, reviewing, publishing, and learning from Burra Pariksha content. Features should improve content quality, production efficiency, audience value, or sustainable revenue—not add complexity without a demonstrated need.

## 2. Canonical content design

### Three content modes — what the learner is meant to do

1. `TOPIC_INTRODUCTION` — Topic Introduction Video: establish conceptual understanding.
2. `WORKED_EXAMPLES` — Worked Examples Video: teach a method through explicit, correct reasoning.
3. `QUESTION_CHALLENGE_SHORT` — Question Challenge Short: invite independent retrieval, problem-solving, and application.

### Five presentation formats — how the learning is presented

- Text
- Video
- Audio
- Image
- Animation

Content mode and presentation format are separate dimensions. Do not add five near-identical variants merely to fill categories. Start with the format that teaches the idea best and expand where audience evidence or educational value justifies it.

### Long-term editorial direction

Begin with aptitude and reasoning; expand carefully into numerical foundations, practical money and mathematics, logical thinking, language and understanding, data interpretation, everyday decision-making, and learning strategies. Keep Topic → Subtopic as the canonical taxonomy. Editorial pillars and audience contexts are planning dimensions, not automatic new taxonomy levels.

Prefer a verified learning unit (objective, prerequisites, correct method, common misconceptions, real-life application) as the reusable educational foundation. Multiple artifacts may link to one learning unit.

## 3. Architectural and workflow invariants

The repository's `AGENTS.md` and current architecture/contracts are authoritative for engineering rules. Key invariants include:

- Cloud Firestore is the sole authoritative transactional datastore; Google Sheets is not a competing runtime source of truth.
- Taxonomy is exactly Topic → Subtopic; do not reintroduce Category.
- Backend owns authorization, workflow transitions, validation gates, optimistic concurrency, and audit.
- The canonical business workflow has 15 stages.
- GAR-02 anti-self-approval remains enforced according to the current approved role/override policy.
- Save Draft and Submit for Verification are distinct operations.
- AI is assistive and cannot silently approve content.
- Internal notes must not leak into audience-facing previews.
- Preserve existing behavior and backward compatibility unless the owner explicitly approves a change.

## 4. Content quality principles

Every publication should address a real learner need or useful skill, state an understandable learning objective, use correct and sufficiently explained reasoning, fit its intended audience, and be reviewed before publication. Verify calculations and derivations, not just final answers. Check ambiguity, Telugu clarity, assumptions, common mistakes, duplicates, and consistency across question, answer, script, narration, and visuals. Audience comments are a primary qualitative starting point, not a representative census; distinguish evidence from AI inference.

## 5. Safety and authorization rules

- Do not inspect, mutate, clean, reset, seed, migrate, or delete production data unless the owner explicitly authorizes the exact operation and target.
- Do not run tests against production, perform exploratory production browsing, trigger live AI calls for testing, or repeatedly scan live services.
- Use static inspection, mocks, isolated synthetic fixtures, or a verified emulator. If a test target cannot be established safely, do not run it.
- Do not deploy, publish, push, force-push, change production configuration, or modify external services without explicit authorization for that action.
- Inspect before destructive Git operations; never use blind reset/clean commands.
- Never expose secrets or claim an action/test succeeded without evidence.
- Report `PASS`, `FAIL`, `BLOCKED`, `NOT TESTED`, or `NOT VERIFIED` accurately.

See `../../AGENTS.md`, `../operations/ENVIRONMENT-CONTRACT.md`, and `../operations/GIT-SYNC-PROTOCOL.md` for full policies.

## 6. Source-of-truth order

Follow the current hierarchy documented in `docs/README.md` and `AGENTS.md`:

1. Verified working code and automated tests for actual behavior.
2. Current architecture decisions and contracts for intended design.
3. Operational policies and active task/sprint requirements.
4. Historical sprint documents for provenance only.

Record discrepancies explicitly. Never treat a report as proof that its claimed tests or production behavior were independently verified.

## 7. How AI agents should work

- Read this file and `CURRENT_STATE.md` / `CHAT_HANDOVER.md` first.
- Inspect only the smallest authoritative sources relevant to the task.
- Separate confirmed facts, owner-approved decisions, hypotheses, and unresolved questions.
- Do not rediscover previously verified facts without a reason.
- Propose narrowly scoped tasks with explicit acceptance criteria.
- At meaningful milestones, update the current state and handover with evidence, files, tests actually run, commit identifiers, unresolved risks, and the next approved action.
- Do not create duplicate policy, architecture, roadmap, or decision documents without first checking the existing documentation index.
