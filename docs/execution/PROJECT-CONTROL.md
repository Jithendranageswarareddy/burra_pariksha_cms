# BP-CMS Project Control & Execution State

**Current Sprint:** Sprint 2  
**Current Task:** S2-T04 Architecture / Route Cleanup Map (CLOSED)  
**Sprint Objective:** System Stabilization & Question Golden Path Proof  
**Last Completed Task:** S2-T04 Architecture / Route Cleanup Map  
**Current Blocker:** None  
**Current Git Commit:** `103ce43c795ed12bdb931b06d216fea6afd4f090` (Sprint 2 S2-T04 closed & operating model established)  
**Last Successful Deployment:** N/A (Preparing initial Cloud Run deployment verification)  
**Live Environment:** `https://ais-dev-fjjdmukiysol435fsvlcau-618687518096.asia-east1.run.app`  
**Known Risks:** Live Google Sheets network latency; dual state mutation paths (domain status vs FC-005 universal state engine).  
**Next Action:** Await user directive to begin Task S2-T05 Question Golden Path browser verification.

---

## Authoritative Project Operating Model

1. **Source of Truth**:
   - GitHub `main` (`Jithendranageswarareddy/burra_pariksha_cms`) is the sole authoritative source of truth for all source code, commit history, documentation, architecture artifacts, execution state, and release candidates.
   - All environments synchronize strictly with GitHub `main`. No local workspace is authoritative over GitHub.

2. **Google AI Studio (Primary Implementation & Release Authority)**:
   - Primary implementation environment: pulls code, develops features, runs full verification (typecheck, tests, build, runtime probes), commits changes, syncs to GitHub, and triggers official deployment/publishing to Cloud Run.

3. **Antigravity (Local Development Workspace)**:
   - Local development, inspection, and debugging workspace.
   - Antigravity pulls/pushes to GitHub; it is not the final deployment authority. All work must synchronize through GitHub `main`.

4. **ChatGPT (Independent GitHub Verification Surface)**:
   - Independently inspects GitHub `main` to audit commit existence, branch state, file contents, architecture fidelity, and task completion claims. Local claims require remote verification on GitHub `main`.

5. **Cloud Run (Live Production Target)**:
   - The authoritative live production environment where authenticated users and team members operate the real 15-step BP-CMS workflow.

6. **Task Closure Contract (Definition of Done)**:
   - An implementation task is marked CLOSED only when:
     1. Implementation is functionally complete.
     2. Verification suite passes (`npm run lint`, `npm test`, `npm run build`, runtime health probes).
     3. Local commit exists with conventional commit message.
     4. Commit is pushed and verified on GitHub `main` (`HEAD == origin/main`).
     5. Local working tree is clean.
     6. Execution-control documentation accurately reflects reality.

7. **Conflict Resolution Policy**:
   - If local and remote branches diverge, never run `git reset --hard origin/main` blindly.
   - Inspect divergence, identify authoritative work, preserve legitimate commits, reconcile intentionally, test, push, and verify.
