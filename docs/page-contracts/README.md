# BP-CMS Feature Page Contracts

These contracts document the 15 canonical workflow stages using the repository's
current code and authoritative architecture as evidence. `IMPLEMENTED` describes
observed behavior; `ARCHITECTURE GAP`, `IMPLEMENTATION GAP`, `DOCUMENTATION GAP`,
and `UNVERIFIED` describe findings, not silently approved requirements.

| Stage | Contract | Status |
|---:|---|---|
| 01 | [Question Generation](STAGE-01-QUESTION-GENERATION.md) | Reviewed |
| 02 | [Question Verification](STAGE-02-QUESTION-VERIFICATION.md) | Reviewed |
| 03 | [Audience Script](STAGE-03-AUDIENCE-SCRIPT.md) | Reviewed |
| 04 | [Teleprompter & Filming](STAGE-04-TELEPROMPTER-FILMING.md) | Reviewed |
| 05 | [Raw Video](STAGE-05-RAW-VIDEO.md) | Reviewed |
| 06 | [Editing Bay](STAGE-06-EDITING-BAY.md) | Reviewed |
| 07 | [Final QC](STAGE-07-FINAL-QC.md) | Reviewed |
| 08 | [Thumbnail](STAGE-08-THUMBNAIL.md) | Reviewed |
| 09 | [Social Review](STAGE-09-SOCIAL-REVIEW.md) | Reviewed |
| 10 | [Publishing Setup](STAGE-10-PUBLISHING-SETUP.md) | Reviewed |
| 11 | [Published](STAGE-11-PUBLISHED.md) | Reviewed |
| 12 | [Platform Sync](STAGE-12-PLATFORM-SYNC.md) | Reviewed |
| 13 | [Analytics](STAGE-13-ANALYTICS.md) | Reviewed |
| 14 | [Performance Review](STAGE-14-PERFORMANCE-REVIEW.md) | Reviewed |
| 15 | [Intelligence Loop](STAGE-15-INTELLIGENCE-LOOP.md) | Reviewed |

Common evidence sources are [AGENTS.md](../../AGENTS.md), the
[canonical workflow](../architecture/07-CANONICAL-15-STEP-WORKFLOW.md),
[page and route contract](../architecture/11-PAGE-ROUTE-CONTRACT.md), the
feature contracts in `docs/features/`, and the route/service implementations.
These documents do not change runtime behavior.
