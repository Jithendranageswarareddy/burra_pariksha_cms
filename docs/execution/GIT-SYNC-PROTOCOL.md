# BP-CMS — Git Synchronization Protocol (AI Studio ↔ GitHub)

## 1. Prime Principles
1. **GitHub `main` is Authoritative**: The remote repository on GitHub is the single authoritative source of truth.
2. **Git CLI is Authoritative**: Terminal Git CLI operations determine true repository state; web UI "Pull" and "Push" buttons are convenience triggers and must not silently dictate merge or conflict resolution strategies.
3. **Always Fetch Before Deciding**: Inspect remote state with `git fetch origin main --prune` and inspect `git rev-list --left-right --count origin/main...HEAD` before any pull or push action.
4. **Never Blindly Resolve Conflicts**: Never choose automatic `--ours` / `--theirs` or run mass conflict resolution scripts. Every conflict must be explicitly inspected.
5. **Never Force-Push**: Never execute `git push --force`, `git push -f`, or `git push --force-with-lease` unless explicitly authorized by the user after manual history review.
6. **Task Baseline Invariance**: Synchronize local `main` to `origin/main` before beginning a new task.
7. **Pre-Push Divergence Check**: Commit locally and verify that local is ahead of the exact same `origin/main` baseline before pushing.
8. **Post-Push Verification Mandatory**: Verify `HEAD == origin/main` and `working tree clean` after every push.
9. **UI Buttons Are Secondary**: When UI buttons report sync issues, stop and verify via CLI.
10. **Authentication Failures Must Be Resolved**: A task is never complete until the commit is pushed and verified on GitHub `origin/main`.

---

## 2. Standard Workflow for Every Implementation Task

### Phase A: Before Starting Implementation
```bash
git fetch origin main --prune
git checkout main
git status
git rev-parse HEAD
git rev-parse origin/main
```
- If `HEAD == origin/main` and the working tree is clean: Proceed with task implementation.
- If not synchronized: Reconcile or report divergence before writing any code.

### Phase B: After Implementation & Verification
```bash
git diff --check
git status
git add <task-files>
git commit -m "<conventional commit message>"
git fetch origin main --prune
git rev-parse HEAD
git rev-parse origin/main
git rev-list --left-right --count origin/main...HEAD
```
- Expected divergence check output: `0 N` (Local is N commits ahead of GitHub, 0 commits behind).

### Phase C: Push to GitHub & Final Verification
```bash
git push origin main
git fetch origin main --prune
git rev-parse HEAD
git rev-parse origin/main
git status
```
- Mandatory completion invariant:
  - `git rev-parse HEAD == git rev-parse origin/main`
  - `working tree clean`

---

## 3. Divergence Resolution Protocol

When `git rev-list --left-right --count origin/main...HEAD` returns `N M` (both sides diverged):
1. **Do NOT merge automatically.**
2. Inspect the divergence:
   ```bash
   git log --oneline origin/main..HEAD
   git log --oneline HEAD..origin/main
   git merge-base HEAD origin/main
   git status --short
   ```
3. Create a safety backup branch:
   ```bash
   git branch backup-<task-id> HEAD
   ```
4. Attempt rebase only if changes are orthogonal:
   ```bash
   git rebase origin/main
   ```
5. If conflicts occur: **STOP immediately**. Abort if not trivially mechanical:
   ```bash
   git rebase --abort
   ```
6. Report the exact conflicted files and commit hashes to the user.

---

## 4. GitHub CLI Authentication Recovery

When push fails with `fatal: could not read Username for 'https://github.com'`:
1. Check credentials and CLI:
   ```bash
   git config --get remote.origin.url
   git config --get user.name
   git config --get user.email
   gh --version
   gh auth status
   ```
2. Initiate device web authentication:
   ```bash
   gh auth login -h github.com -p https -w
   ```
3. Copy the one-time code and complete authentication in the browser at:
   `https://github.com/login/device`
4. Configure Git credentials via GitHub CLI:
   ```bash
   gh auth setup-git
   ```
5. Verify remote access:
   ```bash
   git ls-remote origin main
   ```
