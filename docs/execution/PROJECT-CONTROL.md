# BP-CMS Project Control & Execution State

**Current Sprint:** Sprint 2 (COMPLETE)  
**Current Task:** Sprint 2 Handoff & Human UAT Review (CLOSED)  
**Sprint Objective:** System Stabilization & Question Golden Path Proof (ACHIEVED)  
**Last Completed Task:** S2-T08 Cloud Run Publish & Live Human Test  
**Current Blocker:** None  
**Current Git Commit:** `origin/main` (verified at task closure)  
**Last Successful Deployment:** Cloud Run `asia-east1` (Revision verified active)  
**Live Environment:** `https://ais-dev-fjjdmukiysol435fsvlcau-618687518096.asia-east1.run.app`  
**Known Risks:** Live Google Sheets network latency; dual state mutation paths (domain status vs FC-005 universal state engine).  
**Next Action:** Await Human UAT review prior to Sprint 3 kickoff.

---

## Authoritative Project Operating Model

1. **Source of Truth**:
   - GitHub `main` (`Jithendranageswarareddy/burra_pariksha_cms`) is the sole authoritative source of truth for all source code, commit history, documentation, architecture artifacts, execution state, and release candidates.
   - All environments synchronize strictly with GitHub `main`. No local workspace is authoritative over GitHub.

2. **Google AI Studio (Primary Implementation & Release Authority)**:
   - Primary daily implementation environment: pulls code, develops features, runs full verification (typecheck, tests, build, runtime probes), commits changes, syncs to GitHub, and triggers official deployment/publishing to Cloud Run.

3. **Antigravity (Local Development Workspace)**:
   - Local development, inspection, and debugging workspace used primarily when Google AI Studio credits are exhausted.
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

---

## Development Environment Handoff

### Normal Operation:
Google AI Studio  
→ Pull latest GitHub `main`  
→ Develop  
→ Test  
→ Build  
→ Commit  
→ Push/Sync to GitHub  
→ Verify GitHub  
→ Publish to Cloud Run  

### When Google AI Studio Credits are Exhausted:
Antigravity  
→ Pull latest GitHub `main`  
→ Develop locally  
→ Test  
→ Commit  
→ Push to GitHub `main`  

### When Google AI Studio Credits are Restored:
Google AI Studio  
→ Pull latest GitHub `main`  
→ Verify workspace contains latest remote changes  
→ Continue development  
→ Test  
→ Push/Sync to GitHub  
→ Publish to Cloud Run  

*Critical Invariant*: Never continue development in a stale Google AI Studio workspace after Antigravity has pushed newer changes. The authoritative sequence is always:
GitHub `main` → current workspace → development → GitHub `main`.
