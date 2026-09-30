# Source-of-Truth Conflict Register

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 26 of 35  

---

## 1. Register of Discovered Source Conflicts

| Conflict ID | Entity / Scope | Source A | Source B | Conflict Nature | Current Operational Authority | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CONF-01** | Production State | `VIDEOS.status` | `QUESTIONS.video_status` | Asynchronous best-effort update can fail and swallow error | `VIDEOS.status` is used for production; `QUESTIONS.video_status` is used for lists | **CRITICAL** |
| **CONF-02** | Content Master Link| `Question.contentId` | `Question.contentMasterId` | Dual column aliases represent same entity; legacy rows have blanks | `contentMasterId` canonical; code falls back to `contentId` | **HIGH** |
| **CONF-03** | Question-Video Join| `Video.questionId` | `QUESTION_VIDEOS` tab | Redundant 1:1 foreign key vs join table | `Video.questionId` is read by services; join table is append-only | **MEDIUM** |
| **CONF-04** | Drive Hierarchies | Phase 7 Convention | Phase 14 Convention | Two competing folder layout conventions active in live Drive | Phase 7 active in production root; Phase 14 in tests | **HIGH** |
| **CONF-05** | Workflow Enums | 7-State Frontend Enum | 11-State Backend Enum | UI defines subset of valid backend state machine transitions | Backend enforces strict 11 states; UI simplifies | **MEDIUM** |
| **CONF-06** | User Session State | Google Sheets `USERS` | In-Memory `userSessionStates` | In-memory token versions lost on Cloud Run container reboot | In-Memory RAM is authoritative; Sheets is stale | **CRITICAL** |
