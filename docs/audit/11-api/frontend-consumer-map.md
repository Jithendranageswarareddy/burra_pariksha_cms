# Frontend Consumer to Endpoint Forensic Map

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 28 of 30  

---

## 1. Frontend Consumer Architecture

Frontend components consume endpoints through two paradigms:
1. **Centralized Service Clients** (`src/lib/services/api.ts` & frontend services)
2. **Direct `fetch()` Calls**: In components such as `PlanningPage.tsx` (17 direct fetch calls), `RecoveryAdminPage.tsx` (8 direct fetch calls), and `VideoDetailPage.tsx`.

---

## 2. Endpoint to UI Component Consumer Matrix (Sample)

| Endpoint Path | Method | Calling Frontend Component / Page | Invoking Action / Button |
| :--- | :---: | :--- | :--- |
| `/api/auth/login` | `POST` | `LoginPage.tsx` | "Sign In" button |
| `/api/questions` | `POST` | `QuestionStudioPage.tsx` | "Save & Proceed" / Step 4 Finish |
| `/api/questions/:id/verify` | `POST` | `QuestionVerifyApprovePage.tsx` | "Approve" / "Reject" buttons |
| `/api/videos/:id/record` | `POST` | `RecordingWorkspace.tsx` | "Submit Take" button |
| `/api/videos/:id/edit` | `POST` | `EditingWorkspace.tsx` | "Submit Edit Cut" button |
| `/api/videos/:id/final-qc` | `POST` | `FinalReviewWorkspace.tsx` | "Sign Off Video" button |
| `/api/publishing/schedule` | `POST` | `PublishingWorkspace.tsx` | "Confirm Schedule" button |
| `/api/planning/batches` | `POST` | `PlanningPage.tsx` | "Create Curriculum Batch" button |
| `/api/settings/config` | `POST` | `SettingsPage.tsx` | "Save Configuration" button |
| `/api/recovery/restore` | `POST` | `RecoveryAdminPage.tsx` | "Execute Snapshot Restore" button |
