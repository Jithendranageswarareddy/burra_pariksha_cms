# SPRINT 10 — HUMAN TESTING CHECKLIST & ACCEPTANCE PLAYBOOK

**Repository:** `Jithendranageswarareddy/burra_pariksha_cms`
**Sprint:** Sprint 10
**Theme:** Topic Introduction (`TOPIC_INTRODUCTION`, Mode 2) & Explained Questions Video (`EXPLAINED_QUESTIONS_VIDEO`, Mode 3) with Preserved Question Challenge Short (`QUESTION_CHALLENGE_SHORT`, Mode 1)
**Document Path:** `docs/sprints/sprint-10/S10-HUMAN-TESTING-CHECKLIST.md`
**Target Audience:** Human QA Testers, Product Leads, and Project Owner

---

## 1. Overview & Objectives

This playbook provides a structured, step-by-step human testing guide for validating the Burra Pariksha CMS across all three canonical content production modes:
1. **Mode 1: Question Challenge Short** (Sprint 9 baseline — 9:16 vertical short, speed math trick, 1 MCQ).
2. **Mode 2: Topic Introduction** (Sprint 10 — 0 practice questions, 9:16 / 16:9 aspect ratios, concept demystification, 5-point concept checklist).
3. **Mode 3: Explained Questions Video** (Sprint 10 — 16:9 landscape masterclass, horizontal tab navigation `[Intro] [Q1]...[QN]`, batch counts {5, 10, 15, 20}, sequential breakdowns).

The automated unit, integration, architecture, isolation, and live browser E2E suites have verified the technical foundation. This manual checklist focuses on user-visible behavior, workflow transitions, editorial usability, and human visual inspection.

---

## 2. Environment Setup & Launch Instructions

### 2.1 Prerequisites
- Node.js (v20+ recommended)
- Git repository checked out on `main`
- Modern web browser (Google Chrome, Edge, Firefox, or Safari)

### 2.2 Starting the Local Application
Execute the dev server command from the repository root:
```bash
npm run dev
```
*Note: This command starts the unified Express server and Vite development middleware on `http://localhost:3000`.*

### 2.3 Local Environment Verification
1. Open your browser and navigate to `http://localhost:3000/api/health`.
2. Confirm the JSON response indicates `status: "healthy"` or `"ok"`.
3. In the terminal logs, verify:
   - `[EnvContract] Runtime: DEVELOPMENT`
   - Server running on `http://0.0.0.0:3000` (or `http://localhost:3000`).

### 2.4 Signing In
1. Open `http://localhost:3000` in your browser.
2. If prompted for login (or navigating to `/login`), enter:
   - **Email / Identifier:** `jithendrareddy629@gmail.com`
   - **Password:** The configured password for the owner account.
3. Upon successful login, verify that you are redirected to the Dashboard (`/dashboard`) or Studio (`/studio`) and that your user role is identified as `ADMIN`.

---

## 3. How to Access the Content Modes

In the navigation bar or from the Production Workbench (`/studio`):
1. **Mode 1 (Question Challenge Short):** Click **Studio** -> Click **Change Mode** -> Select **Mode 1: Question Challenge Short**.
2. **Mode 2 (Topic Introduction):** Click **Change Mode** -> Select **Mode 2: Topic Introduction**.
3. **Mode 3 (Explained Questions Video):** Click **Change Mode** -> Select **Mode 3: Explained Questions Video**.

---

## 4. Manual Test Scenarios

### Scenario 1: Mode 1 — Question Challenge Short (Sprint 9 Baseline)
**Objective:** Verify that the existing Question Challenge Short workflow remains fully operational without regressions.

| Step | Action | Expected Result | Pass / Fail / Blocked |
| :---: | :--- | :--- | :---: |
| 1.1 | In Studio, select Mode 1. Select a Topic and Subtopic. | Workspace loads `CandidateCanvas` with 9:16 aspect ratio badge. | [ ] |
| 1.2 | Click **Manual Draft** or enter problem statement, 4 distinct options (A, B, C, D), correct answer key, and speed trick explanation. | Form fields update smoothly. Dirty state indicator turns active ("Unsaved changes"). | [ ] |
| 1.3 | Click **Preview** toggle in the canvas header. | 9:16 vertical card renders problem statement and 4 options. Internal answer key and reviewer notes are strictly hidden. | [ ] |
| 1.4 | Click **Save Working Draft**. | Toast confirms draft saved. Dirty indicator clears. `Submit for Verification` button becomes enabled. | [ ] |
| 1.5 | Refresh the browser page (`F5` or `Ctrl+R`). | Draft reloads with all fields, Telugu/English text, options, and speed trick intact. | [ ] |
| 1.6 | Click **Submit for Verification**. | Draft submits to Stage 02 (`SUBMITTED_FOR_REVIEW`). Toast confirms submission. | [ ] |

---

### Scenario 2: Mode 2 — Topic Introduction (Sprint 10)
**Objective:** Verify zero-question constraint, configurable aspect ratio, concept validation, and live preview.

| Step | Action | Expected Result | Pass / Fail / Blocked |
| :---: | :--- | :--- | :---: |
| 2.1 | In Studio, switch mode to **Mode 2: Topic Introduction**. | `TopicIntroWorkspace` renders with yellow/amber banner: "0 Questions (Enforced)". MCQ option fields are absent. | [ ] |
| 2.2 | Inspect Aspect Ratio selector. Toggle between **9:16** (Vertical Short ~60s Hook) and **16:9** (Landscape Video ~90s Overview). | Active selection highlights clearly; badge updates in the summary bar. | [ ] |
| 2.3 | Enter a Concept Headline (e.g., `"Introduction to Ratios & Proportions"`). | Title field reflects typed input. | [ ] |
| 2.4 | In the Introductory Concept Statement, enter fewer than 15 characters (e.g., `"Short text"`). | Validation warning indicates concept statement must be at least 15 characters. Save/Submit shows warning. | [ ] |
| 2.5 | Expand the statement to >= 15 characters (e.g., `"Ratios express the relative size of two or more values in standardized units."`). | Validation warning clears. | [ ] |
| 2.6 | Enter Syllabus Scope Notes and Real-World Context Hook (e.g., `"Used in cooking recipes, currency conversions, and exam speed problems."`). | Fields update cleanly without lag. | [ ] |
| 2.7 | Inspect the Live Preview card on the right side. | Card shows concept headline, statement, syllabus scope, and hook in selected aspect ratio (9:16 or 16:9). No question slots or answer keys appear. | [ ] |
| 2.8 | Click **Save Working Draft**. | Toast confirms draft saved. Status remains `DRAFT` in Stage 01. | [ ] |
| 2.9 | Refresh the browser. | Mode 2 draft reloads with all fields and selected aspect ratio restored. | [ ] |
| 2.10 | Click **Submit for Verification**. | Draft successfully transitions to Stage 02 (`SUBMITTED_FOR_REVIEW`). | [ ] |

---

### Scenario 3: Mode 3 — Explained Questions Video (Sprint 10)
**Objective:** Verify masterclass horizontal tab navigation, batch configurations, question editing, reordering, and preview.

| Step | Action | Expected Result | Pass / Fail / Blocked |
| :---: | :--- | :--- | :---: |
| 3.1 | In Studio, switch mode to **Mode 3: Explained Questions Video**. | `ExplainedQuestionsWorkspace` renders with horizontal segmented tabs: `[Intro Roadmap] [Q1] [Q2] ... [QN]`. Enforced aspect ratio displays `16:9`. | [ ] |
| 3.2 | Verify supported batch counts in configuration ({5, 10, 15, 20}). Select **5 Questions**. | Workspace configures exactly 5 question tabs (`Q1` to `Q5`) plus the Intro tab. | [ ] |
| 3.3 | Click on `[Intro Roadmap]` tab. Enter the Concept Title and Masterclass Overview roadmap. | Intro roadmap fields update. | [ ] |
| 3.4 | Click on `[Q1]` tab. Enter Question 1 Statement, Options A/B/C/D, Correct Key, and Step-by-Step Explanation. | Question 1 fields update. Tab `Q1` indicator displays green checkmark when complete. | [ ] |
| 3.5 | Navigate sequentially to `[Q2]`, `[Q3]`, `[Q4]`, and `[Q5]`, filling in practice questions. | Tab switching is immediate. Unsaved edits across tabs are preserved in state. | [ ] |
| 3.6 | Test validation: leave explanation blank on one question. | Validation alert highlights `ERR_MISSING_EXPLANATION` / explanation required. Providing >= 5 characters clears the alert. | [ ] |
| 3.7 | Test duplicate detection: enter identical statements in Q1 and Q2. | Validation flags duplicate question statement. Changing the statement clears the warning. | [ ] |
| 3.8 | Test question reordering (if reorder arrows are active). Move Q2 before Q1. | Tabs and contents reorder correctly to reflect new sequence. | [ ] |
| 3.9 | Inspect Live Preview while clicking between tabs. | Preview card projects Intro Roadmap when Intro tab is active, or Question card when a question tab is active. Answers are masked from audience view. | [ ] |
| 3.10 | Click **Save Working Draft**. | All questions (Q1–Q5) and Intro persist together. Toast confirms save. | [ ] |
| 3.11 | Refresh the browser. | Reopening the draft restores all 5 questions with options and explanations in correct order. | [ ] |
| 3.12 | Click **Submit for Verification**. | Package transitions to Stage 02 for 10-point checklist review. | [ ] |

---

### Scenario 4: Verification, Reviewer Workflow & GAR-02 Segregation of Duties
**Objective:** Verify Stage 02 verification gate, mode-specific review checklists, and strict anti-self-approval enforcement.

| Step | Action | Expected Result | Pass / Fail / Blocked |
| :---: | :--- | :--- | :---: |
| 4.1 | As author of a draft submitted in Scenario 1, 2, or 3, navigate to the verification view (`/verify` or Stage 02). | Verification page loads with the submitted candidate details. | [ ] |
| 4.2 | Inspect the verification checklist: <br>• For Mode 2: Verify 5-Point Concept Checklist is displayed.<br>• For Mode 1 & 3: Verify 10-Point Proof Checklist is displayed. | Mode-specific checklist matches the active production mode. | [ ] |
| 4.3 | Check all checklist items and attempt to click **Approve** using the *same* user account that authored the draft. | **GAR-02 Anti-Self-Approval Enforced:** System displays error or disables button: author cannot approve their own candidate ($authorId \neq approverId$). | [ ] |
| 4.4 | Click **Request Changes** (or reject) with reviewer feedback (e.g., `"Please refine explanation for clarity"`). | Reviewer feedback persists. Draft transitions back to author revision state. | [ ] |
| 4.5 | Switch back to author view / reload draft in Studio. | Author sees reviewer feedback notes. Candidate is editable. | [ ] |
| 4.6 | Author edits text and clicks **Save Working Draft** then **Submit for Verification**. | Draft re-submits with incremented revision number. | [ ] |

---

### Scenario 5: Concurrency, Navigation & Safety Controls
**Objective:** Verify data protection against lost edits and conflicting revisions.

| Step | Action | Expected Result | Pass / Fail / Blocked |
| :---: | :--- | :--- | :---: |
| 5.1 | In Studio, make an edit to any candidate draft so that `isDirty` is active. Attempt to close or reload the browser tab. | Browser triggers native `beforeunload` dialog: "You have unsaved changes. Are you sure you want to leave?". | [ ] |
| 5.2 | Open the same saved draft in two separate browser tabs (Tab A and Tab B). In Tab A, make an edit and save. Then in Tab B, attempt to save without reloading. | Tab B receives Concurrency Conflict warning (HTTP 409 OCC): another user or session updated this record. Stale overwrite prevented. | [ ] |
| 5.3 | Inspect browser DevTools Network tab during all operations. | All requests target `/api/*` Express endpoints. Zero direct browser-to-Firestore calls. Zero API keys exposed in headers or URLs. | [ ] |

---

## 5. Human Testing Result Matrix

| Scenario | Scope | Tester Name | Date Tested | Status (PASS / FAIL / BLOCKED) | Notes |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Scenario 1** | Mode 1: Question Challenge Short | | | | |
| **Scenario 2** | Mode 2: Topic Introduction | | | | |
| **Scenario 3** | Mode 3: Explained Questions Video | | | | |
| **Scenario 4** | Verification & GAR-02 Rule | | | | |
| **Scenario 5** | Concurrency & Safety Controls | | | | |

---

## 6. Defect Register (For Human Testers)

If any unexpected behavior, layout anomaly, or failure occurs, log it here:

| Defect # | Scenario | Severity (Low / Med / High / Crit) | Description of Issue | Steps to Reproduce | Expected vs Actual | Resolution Status |
| :---: | :---: | :---: | :--- | :--- | :--- | :---: |
| DEF-01 | | | | | | Open |
| DEF-02 | | | | | | Open |

---

## 7. Known Limitations & Operating Notes

1. **Advisory AI Key Requirement:**
   - AI generation buttons require a valid `GEMINI_API_KEY` configured in the server environment.
   - If no key is configured or provider connectivity is disabled, **Manual Drafting** is 100% functional across all three modes.
2. **Intentional Clean Database State:**
   - The database has been cleared per project owner request, leaving the single admin user `jithendrareddy629@gmail.com`.
   - When launching Studio, select an available topic/subtopic or create an initial syllabus topic to begin authoring new content.
3. **Production Deployment Authority:**
   - Automated cloud production deployments are disabled by policy. Deployment to production remains the manual prerogative of the project owner.

---

## 8. Sign-off Recommendation

When all 5 scenarios pass human testing, mark the release recommendation below:

- [ ] **ACCEPTED FOR PRODUCTION USE**
- [ ] **ACCEPTED WITH MINOR DOCUMENTED DEFECTS**
- [ ] **REJECTED — BLOCKING DEFECTS FOUND**

**Lead QA Tester Signature / Date:** ___________________________
