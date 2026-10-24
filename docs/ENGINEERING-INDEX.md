# Engineering Documentation Index

Use this page as the first stop. Read the smallest authoritative source that
answers the task; do not treat this index as a replacement for those documents.

| Concern | Start here | Status and use |
| --- | --- | --- |
| Execution policy | [`AGENTS.md`](../AGENTS.md) | Current; production safety, code-level testing, scope, verification, and closure rules |
| Project continuity & onboarding | [`project-control/CHAT_HANDOVER.md`](project-control/CHAT_HANDOVER.md), [`project-control/MASTER_CONTEXT.md`](project-control/MASTER_CONTEXT.md) | Current; durable project briefing, current state, and onboarding sequence |
| Architecture decisions | [`architecture/DECISION-LOG.md`](architecture/DECISION-LOG.md) | Current; approved decisions and invariants |
| Master architecture reconciliation | [`architecture/CORE-ARCHITECTURE-RECONCILIATION.md`](architecture/CORE-ARCHITECTURE-RECONCILIATION.md) | Current; evidence-backed brownfield audit, target architecture, and status reconciliation |
| Historical core proposal | [`architecture/CORE-ARCHITECTURE-PROPOSAL.md`](architecture/CORE-ARCHITECTURE-PROPOSAL.md) | Preserved prior proposal; do not use it to override the reconciliation document |
| Architecture principles and boundaries | [`architecture/04-ARCHITECTURE-PRINCIPLES.md`](architecture/04-ARCHITECTURE-PRINCIPLES.md), [`05-TARGET-SYSTEM-BOUNDARY.md`](architecture/05-TARGET-SYSTEM-BOUNDARY.md) | Current; consult when crossing boundaries |
| Workflow and state | [`architecture/07-CANONICAL-15-STEP-WORKFLOW.md`](architecture/07-CANONICAL-15-STEP-WORKFLOW.md), [`08-STATE-MODEL.md`](architecture/08-STATE-MODEL.md) | Current; backend workflow authority |
| Persistence and data model | [`architecture/12-DATABASE-ARCHITECTURE.md`](architecture/12-DATABASE-ARCHITECTURE.md), [`13-DATA-MODEL-DATA-CONTRACT.md`](architecture/13-DATA-MODEL-DATA-CONTRACT.md) | Current; Firestore and entity contracts |
| API and routes | [`architecture/15-API-CONTRACT.md`](architecture/15-API-CONTRACT.md), [`page-contracts/`](page-contracts/) | Current; API/page behavior |
| Feature contracts | [`features/FEATURE-CONTRACT-INDEX.md`](features/FEATURE-CONTRACT-INDEX.md) | Historical planning inventory; use a linked current contract or ADR when it conflicts |
| Testing and commands | [`TESTING-GUIDE.md`](TESTING-GUIDE.md), [`architecture/24-TEST-ARCHITECTURE.md`](architecture/24-TEST-ARCHITECTURE.md) | Testing guide is current command map; Stage 24 is historical target architecture |
| Environment and Git | [`operations/ENVIRONMENT-CONTRACT.md`](operations/ENVIRONMENT-CONTRACT.md), [`operations/GIT-SYNC-PROTOCOL.md`](operations/GIT-SYNC-PROTOCOL.md) | Current operational policy |
| Active sprint requirements | [`sprints/sprint-09/`](sprints/sprint-09/) | Current only for the task or gate explicitly in scope |
| Core requirements roadmap | [`sprints/CORE-REQUIREMENTS-ROADMAP.md`](sprints/CORE-REQUIREMENTS-ROADMAP.md) | Current dependency-ordered roadmap for remaining core-requirements work |
| Historical evidence | [`sprints/`](sprints/) | Historical; do not use to override current code, ADRs, or contracts |

No `.github/workflows/` CI workflow was found during this audit. Local scripts
are the available verification surface; adding CI is intentionally deferred
until its trigger, credentials, and cost/coverage requirements are approved.
