# Page Data Display Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 08 of 30  
**Document:** 06 of 30  

---

## 1. Data Display Architecture

Every page renders data sourced from Google Sheets, local storage caches, or simulated backend APIs. This audit documents every major data field displayed on each page, its display format, source entity, and fallback behavior.

---

## 2. Page-by-Page Data Display Catalog

### 1. `DashboardPage.tsx`
- **Pipeline Stage Counts**: Total questions, scripts ready, filming in progress, editing bay, QC queue, published videos.
- **Velocity Metrics**: Average turnaround time per stage (in hours), weekly throughput.
- **Recent Activity Log**: User action, timestamp, entity ID link, human-readable summary.
- **Fallback**: Zero counters (`0`) displayed when stats fetch fails.

### 2. `QuestionLibraryPage.tsx`
- **Question Table Fields**:
  - `Question ID` (e.g. `BP-Q-104`)
  - `Topic / Subtopic` badges with color coding
  - `Question Statement` (truncated to 2 lines, bilingual English/Telugu)
  - `Difficulty Badge` (Easy = Emerald, Medium = Amber, Hard = Rose)
  - `Status Pill` (`DRAFT`, `VERIFIED`, `IN_PRODUCTION`, `PUBLISHED`, `REJECTED`)
  - `Created Date` & `Author Name`
- **Fallback**: Empty table with "No questions found matching active filters".

### 3. `QuestionDetailPage.tsx`
- **Core Entity Data**: Full question text (English & Telugu), 4 option cards with visual indicator on correct answer.
- **Academic Proof & Misconceptions**: Complete mathematical or conceptual proof, common student misconceptions list.
- **Lifecycle Metadata**: Author ID, Approver ID, verification timestamp, linked Video ID, linked ContentMaster ID.
- **Audit History**: Log of editorial comments and rejection notes.

### 4. `QuestionStudioPage.tsx`
- **Curriculum Context**: Active Topic name, Subtopic syllabus hierarchy, Class grade level.
- **Candidate AI Panel**: Generated question statement variations, difficulty scores, similarity percentage radar.
- **Interactive Form State**: Live bilingual preview card reflecting input fields in real time.

### 5. `ProductionTrackerPage.tsx`
- **Kanban Columns**: `SCRIPT_READY`, `RECORDING`, `EDITING`, `FINAL_REVIEW`, `READY_TO_UPLOAD`, `PUBLISHED`.
- **Video Card Data**: Video ID, title, presenter avatar, assigned editor avatar, target publish date, urgency flag.
- **Stage Stepper Pill**: Mini 15-stage progress indicator on each video card.

### 6. `VideoDetailPage.tsx` (Master Workspace)
- **Sticky Header**: Video ID, canonical title, active workflow status badge, stage number, assigned team avatars.
- **Active Tab Surface**:
  - `overview`: Summary of all linked assets (Question ID, Drive raw video URL, rough cut URL, thumbnail URL).
  - `script`: Telugu/English spoken script with teleprompter timing estimates and tone markers.
  - `recording`: Embedded Drive video player, take selector, recording notes.
  - `editing`: Edit checklist (audio leveled, cuts tightened, B-roll inserted, captions burned).
  - `final-review`: 12-point QC checklist with pass/fail toggle switches.
  - `thumbnail`: 9:16 high-resolution thumbnail preview, contrast scoring, click-through hook text.
  - `social`: YouTube Shorts & Instagram Reels visual simulation mockups.
  - `publishing`: Scheduled publish datetime, target platforms, live URLs.

### 7. `PlanningPage.tsx`
- **Taxonomy Tree**: Subject > Chapter > Topic > Subtopic hierarchy.
- **Sprint Batch Cards**: Batch code, target release count, completed questions count, progress percentage bar.
- **Raw Fetch Warning**: Displays 17 separate un-memoized raw fetches on mount.

### 8. `SettingsPage.tsx`
- **Google Sheets Connection Status**: Real-time ping latency, spreadsheet ID, active tab names, read/write permissions.
- **Taxonomy Manager**: Table of active subjects, topics, and difficulty weightings.
- **System Health Logs**: Memory consumption, API error rates, backend response time percentiles.

### 9. `RecoveryAdminPage.tsx`
- **Snapshot Inventory**: Table of available backup snapshots (timestamp, snapshot ID, file size, SHA256 checksum).
- **Preflight Inspection**: Record count diffs between current database and selected backup archive.
