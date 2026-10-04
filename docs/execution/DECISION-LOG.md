# BP-CMS Architecture & Engineering Decision Log

| Decision ID | Date | Topic | Decision | Context / Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **ADR-001** | 2026-10-03 | Workflow Authority | Converge on single 15-stage state engine (`src/lib/workflow/transition-matrix.ts`) | Principle 3 invariant: exactly one authoritative workflow state engine. |
| **ADR-002** | 2026-10-03 | Anti-Self-Approval | Enforce GAR-02 server-side without admin bypass | Prevents academic errors and conflicts of interest. |
| **ADR-003** | 2026-10-03 | AI Human Gating | Prohibit AI autonomous approval via AP-009 | Generative AI is assistive; human sign-off is mandatory on critical quality gates. |
| **ADR-004** | 2026-10-04 | Environment Transition | Designate Google AI Studio as primary development environment | Unified development, build, test, and Cloud Run preview with zero environment drift. |
| **ADR-005** | 2026-10-04 | Source of Truth | GitHub `main` is authoritative upstream baseline | Git tracking ensures strict linear revision history. |
| **ADR-006** | 2026-10-04 | Environment Contract | Stabilize 44-variable environment contract & Secret topology | Audited live code references; established explicit mandatory vs optional defaults across AI Studio container and Cloud Run target. |
