# Operational Action Inventory (184 Distinct Actions)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 09 of 30  
**Document:** 03 of 30  

---

## 1. Action Inventory Taxonomy

We catalog **184 distinct operational user actions** classified across 6 primary action categories:
1. **Creation & Authoring Actions (28)**: Adding questions, options, scripts, topics, and batches.
2. **Quality & Verification Actions (24)**: Academic verification, reject, QC checklist, social signoff.
3. **Media Production Actions (32)**: Teleprompter scroll, take logging, rough cut submission, thumbnail generation.
4. **Publishing & Distribution Actions (22)**: Scheduling, dispatching, platform packaging, live sync check.
5. **System & Administration Actions (22)**: Google Sheets connectivity test, taxonomy editing, snapshot restoration.
6. **Navigation & Browsing Actions (56)**: Filtering, sorting, tab switching, search, and page ascent.

---

## 2. Key Action Inventory Table (Sample of Major Actions)

| Action ID | Action Label | Host File | Category | Triggers API? | Mutates Data? | Advances Workflow? |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| `ACT-AUTH-01` | "Sign In" | `LoginPage.tsx` | Auth | YES (`/api/auth/login`) | Session Token | NO |
| `ACT-QSTU-01` | "Generate AI Batch" | `QuestionStudioPage.tsx`| Creation | YES (`/api/ai/generate-question`)| In-Memory Form | NO |
| `ACT-QSTU-02` | "Save & Continue" | `QuestionStudioPage.tsx`| Creation | YES (`/api/questions`) | Google Sheets | YES (01->02) |
| `ACT-QVER-01` | "Approve Question" | `QuestionVerifyApprovePage`| Quality | YES (`/api/questions/:id/verify`)| Sheets + Videos | YES (02->03) |
| `ACT-QVER-02` | "Reject Question" | `QuestionVerifyApprovePage`| Quality | YES (`/api/questions/:id/reject`)| Google Sheets | REJECT |
| `ACT-SCPT-01` | "Approve Script" | `ScriptWorkspace.tsx` | Production | YES (`/api/scripts/:id/approve`)| Sheets + Drive | YES (03->04) |
| `ACT-REC-01` | "Save Best Take" | `RecordingWorkspace.tsx` | Production | YES (`/api/videos/:id/record`)| Google Sheets | YES (05->06) |
| `ACT-EDIT-01` | "Submit for QC" | `EditingWorkspace.tsx` | Production | YES (`/api/videos/:id/submit-edit`)| Google Sheets | YES (06->07) |
| `ACT-QC-01` | "Approve Cut" | `FinalReviewWorkspace.tsx` | Quality | YES (`/api/videos/:id/approve-qc`)| Google Sheets | YES (07->08) |
| `ACT-THUM-01` | "Approve Thumbnail" | `ThumbnailWorkspace.tsx` | Production | YES (`/api/videos/:id/thumbnail`)| Sheets + Drive | YES (08->09) |
| `ACT-SOC-01` | "Signoff Social" | `SocialReviewPage.tsx` | Quality | YES (`/api/social-reviews/:id/approve`)| Sheets | YES (09->10) |
| `ACT-PUB-01` | "Schedule Release" | `PublishingWorkspace.tsx` | Publishing | YES (`/api/publishing/schedule`)| Google Sheets | YES (10->11) |
| `ACT-REST-01` | "Initiate Restore" | `RecoveryAdminPage.tsx` | Admin | YES (`/api/recovery/restore`)| Database Rollback| RECOVERY |
