# Page User & Role Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 08 of 30  
**Document:** 04 of 30  

---

## 1. Role Hierarchy & Target Users

The BP-CMS architecture defines 9 canonical operational roles in `src/config/roles.ts`:
1. `ADMIN`: Full administrative and disaster recovery oversight.
2. `PRODUCER`: Executive production oversight, scheduling, and velocity tracking.
3. `LEAD_EDITOR`: Video pipeline management and rough cut quality signoff.
4. `ACADEMIC_SOLVER`: Academic question generation, syllabus verification, and mathematical correctness.
5. `PRESENTER`: Studio talent, teleprompter operator, and raw filming.
6. `SCRIPTWRITER`: Conversational script authoring and pedagogical storytelling.
7. `VIDEO_EDITOR`: Footage cutting, audio sync, B-roll insertion, and rough cut submission.
8. `QA_REVIEWER`: Academic signoff, social metadata inspection, and Telugu grammar audit.
9. `SOCIAL_MEDIA`: Community engagement, publishing dispatch, and social comments.

---

## 2. Page-by-Page User & Role Matrix

| Page ID | Page Name | Primary User Persona | Authorized Roles | In-Component Role Checks | Client-Side Security Finding |
|---|---|---|---|---|---|
| `PAGE-LOGIN` | LoginPage | Public / Team | ALL | Dev role switcher dropdown | Intended demo utility |
| `PAGE-DASH` | DashboardPage | Executive / Lead | ALL | None (Role-tailored stats) | Accessible to all authenticated users |
| `PAGE-MYWORK` | MyWorkPage | Individual Contributor | ALL | Filters by `user.id` | Scoped to active user session |
| `PAGE-PLAN` | PlanningPage | Content Lead / Producer| ADMIN, PRODUCER, LEAD | Missing route-level guard | Any user can access via URL bar |
| `PAGE-QLIB` | QuestionLibraryPage | Academic Solver | ALL (Excl. Presenter/Editor)| Hidden in sidebar for non-academic | Unrestricted route in `App.tsx` |
| `PAGE-QDET` | QuestionDetailPage | Academic / Editor | ALL | Edit/verify buttons conditionally rendered | Safe in-component button guards |
| `PAGE-QSTUDIO` | QuestionStudioPage | Academic Author | ACADEMIC_SOLVER, SCRIPTWRITER, ADMIN | Hidden in sidebar for Video Editor | Unrestricted route in `App.tsx` |
| `PAGE-QIMP` | QuestionImprovePage | Academic Editor | ACADEMIC_SOLVER, ADMIN | Save action restricted | Unrestricted route in `App.tsx` |
| `PAGE-QVERIFY`| QuestionVerifyApprovePage| QA Reviewer | QA_REVIEWER, ADMIN | Approve button enables video trigger | Unrestricted route in `App.tsx` |
| `PAGE-QUEUE` | QueuePage | Presenter | PRESENTER, PRODUCER, ADMIN | "Start Recording" launches prompter | Unrestricted route in `App.tsx` |
| `PAGE-PRODTRK`| ProductionTrackerPage | Video Lead | VIDEO_LEAD, PRODUCER, ADMIN | Status column drag-and-drop actions | Unrestricted route in `App.tsx` |
| `PAGE-VCSCRIPT`| VideoCreateScriptPage | Scriptwriter | SCRIPTWRITER, ADMIN | Script generation API trigger | Unrestricted route in `App.tsx` |
| `PAGE-VDET` | VideoDetailPage | Video Team | ALL VIDEO ROLES | Tabs visible to all, actions role-restricted | Consolidated tabs share URL |
| `PAGE-SOCREV` | SocialReviewPage | QA Reviewer | QA_REVIEWER, SOCIAL_MEDIA, ADMIN | Signoff button restricted | Unrestricted route in `App.tsx` |
| `PAGE-PLTPKG` | PlatformPackagesPage | Publishing Lead | SOCIAL_MEDIA, ADMIN | Package generation trigger | Unrestricted route in `App.tsx` |
| `PAGE-PUB` | PublishingPage | Publishing Lead | SOCIAL_MEDIA, ADMIN | Dispatch release trigger | Unrestricted route in `App.tsx` |
| `PAGE-ANL-EXP`| AnalyticsExperiencePage | Analyst / Producer | ALL | Read-only analysis views | Unrestricted route in `App.tsx` |
| `PAGE-SOCANL` | SocialAnalyticsPage | Social Lead | SOCIAL_MEDIA, ANALYST | Read-only feedback aggregation | Unrestricted route in `App.tsx` |
| `PAGE-TEAM` | TeamOperationsPage | Content Lead / Producer| ADMIN, PRODUCER | Reassignment modal restricted | Unrestricted route in `App.tsx` |
| `PAGE-CMASTER` | ContentMasterPage | Content Lead | ALL | Read-only graph explorer | Unrestricted route in `App.tsx` |
| `PAGE-SETT` | SettingsPage | System Administrator | ADMIN ONLY | Hidden in sidebar for non-admins | **CRITICAL: Unprotected route** |
| `PAGE-RECOV` | RecoveryAdminPage | System Administrator | ADMIN ONLY | Hidden in sidebar for non-admins | **CRITICAL: Unprotected route** |
| `PAGE-404` | NotFoundPage | Stranded User | ALL | None | Public error fallback |
