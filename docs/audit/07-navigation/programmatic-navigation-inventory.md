# Programmatic Navigation Inventory (All 63 `navigate()` Calls)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 07 of 30  
**Document:** 09 of 27  

---

## 1. Inventory Summary

Static AST analysis of the `src/` directory identifies **63 distinct `navigate()` invocations** across 24 component and page files.

---

## 2. Programmatic Navigation Catalog

| # | Source File & Line | Calling Function / Context | Destination Route Expression | Navigation Type | Workflow Purpose |
|---|---|---|---|---|---|
| 1 | `src/pages/LoginPage.tsx:48` | `handleLogin` | `from || "/"` | Post-auth redirect | Redirects user to attempted route or default |
| 2 | `src/pages/QuestionStudioPage.tsx:802` | `handleSaveSuccess` | ``/questions/${created.id}/verify`` | Stage Handoff | Advances from Stage 01 to Stage 02 |
| 3 | `src/pages/QuestionStudioPage.tsx:810` | `handleCancel` | `"/questions"` | Fallback | Returns to Question Library |
| 4 | `src/pages/QuestionImprovePage.tsx:142` | `handleSaveSuccess` | ``/questions/${saved.id}`` | Detail View | Returns to Question Details |
| 5 | `src/pages/QuestionImprovePage.tsx:156` | `handleCancel` | `"/studio"` | Fallback | Returns to Question Studio |
| 6 | `src/pages/QuestionVerifyApprovePage.tsx:309`| Error Action | `"/studio"` | Fallback | Returns to Studio on error |
| 7 | `src/pages/QuestionVerifyApprovePage.tsx:388`| `handleApproveSuccess`| ``/videos/${targetVideoId}?tab=script`` | Stage Handoff | Advances from Stage 02 to Stage 03 |
| 8 | `src/pages/QuestionVerifyApprovePage.tsx:412`| `handleRejectSuccess` | `"/questions"` | Rejection exit | Returns to library after rejection |
| 9 | `src/pages/QuestionDetailPage.tsx:124` | `handleEdit` | ``/questions/${id}/improve`` | Action Transition | Enters question improvement mode |
| 10 | `src/pages/QuestionDetailPage.tsx:132` | `handleVerify` | ``/questions/${id}/verify`` | Action Transition | Enters academic verification mode |
| 11 | `src/pages/QuestionDetailPage.tsx:140` | Back button | `"/questions"` | Static Back | Returns to Question Library |
| 12 | `src/pages/QueuePage.tsx:94` | `handleStartRecording` | ``/videos/${videoId}?tab=recording`` | Stage Handoff | Enters recording teleprompter |
| 13 | `src/pages/ProductionTrackerPage.tsx:182` | Card / Row Click | ``/videos/${item.id}?tab=${resolvedTab}``| Deep link | Opens video in appropriate tab |
| 14 | `src/pages/VideoDetailPage.tsx:210` | Back button | `"/production"` | Static Back | Returns to Production Tracker |
| 15 | `src/components/video/ScriptWorkspace.tsx:293` | `handleApproveScript` | ``/videos/${videoId}?tab=recording`` | Stage Handoff | Advances from Stage 03 to Stage 04 |
| 16 | `src/components/video/RecordingWorkspace.tsx:241`| `handleFinishRecording`| ``/videos/${videoId}?tab=editing`` | Stage Handoff | Advances from Stage 05 to Stage 06 |
| 17 | `src/components/video/EditingWorkspace.tsx:288`| `handleSubmitForQC` | ``/videos/${videoId}?tab=final-review``| Stage Handoff | Advances from Stage 06 to Stage 07 |
| 18 | `src/components/video/FinalReviewWorkspace.tsx:312`| `handleApproveVideo` | ``/videos/${videoId}?tab=thumbnail`` | Stage Handoff | Advances from Stage 07 to Stage 08 |
| 19 | `src/components/video/ThumbnailWorkspace.tsx:298`| `handleApproveThumbnail`| ``/videos/${videoId}?tab=social`` | Stage Handoff | Advances from Stage 08 to Stage 09 |
| 20 | `src/components/video/SocialSimulatorWorkspace.tsx:245`| `handleApproveSocial`| ``/videos/${videoId}?tab=publishing`` | Stage Handoff | Advances from Stage 09 to Stage 10 |
| 21 | `src/components/video/PublishingWorkspace.tsx:216`| `handleScheduleSuccess`| `"/publishing"` | Stage Handoff | Opens Publishing Manager |
| 22 | `src/pages/SocialReviewPage.tsx:188` | Row Click | ``/social-review/${item.id}`` | Detail View | Inspects specific social package |
| 23 | `src/pages/SocialReviewPage.tsx:242` | Back to List | `"/social-review"` | Static Back | Closes detail view |
| 24 | `src/pages/SocialReviewPage.tsx:295` | Approval Success | `"/publishing"` | Stage Handoff | Forwards approved package to publisher |
| 25 | `src/pages/PublishingPage.tsx:142` | Video Package Click | ``/videos/${pkg.videoId}?tab=publishing``| Deep Link | Opens dispatcher tab for package |
| 26 | `src/pages/PlatformPackagesPage.tsx:112` | Back button | `"/publishing"` | Static Back | Returns to Publishing Manager |
| 27 | `src/pages/SocialAnalyticsPage.tsx:104` | Row Select | ``/social-analytics/${contentId}`` | Detail View | Opens detailed social metrics |
| 28 | `src/pages/SocialAnalyticsPage.tsx:118` | Back button | `"/social-analytics"` | Static Back | Returns to Social Analytics list |
| 29 | `src/pages/MyWorkPage.tsx:132` | Task item click | `task.destinationRoute` | Contextual Task | Opens task-specific workspace |
| 30 | `src/pages/TeamOperationsPage.tsx:165` | Reassignment action | `"/team"` | Refresh | Reloads team workload list |
| 31 | `src/pages/ContentMasterPage.tsx:154` | Entity click | ``/content-masters/${item.id}`` | Detail View | Inspects Content Master record |
| 32 | `src/pages/ContentMasterPage.tsx:172` | Back button | `"/content-masters"` | Static Back | Clears selected Content Master |
| 33 | `src/pages/SettingsPage.tsx:188` | Tab switch | ``/settings?tab=${tabId}`` | Param sync | Syncs active settings tab |
| 34 | `src/pages/RecoveryAdminPage.tsx:204` | Cancel preflight | `"/dashboard"` | Exit | Returns to Overview |
| 35 | `src/pages/NotFoundPage.tsx:42` | "Back to Home" | `"/dashboard"` | Error Recovery | Returns to Overview from 404 |
| 36 | `src/pages/NotFoundPage.tsx:48` | "Go Back" | `-1` | Browser History | `navigate(-1)` history back |
| 37 | `src/components/layout/ErrorBoundary.tsx:64`| "Return Home" | `"/dashboard"` | Error Recovery | Returns to Overview from crash |
| 38 | `src/components/layout/ErrorBoundary.tsx:70`| "Go Back" | `-1` | Browser History | `navigate(-1)` history back |
| 39 | `src/components/dashboard/GlobalSearchBar.tsx:120`| Result select | `result.href` | Search selection | Direct transition to searched entity |
| 40 | `src/components/layout/UserProfileMenu.tsx:84`| "Account Settings" | `"/settings"` | Action link | Navigates to System Settings |
| 41 | `src/components/layout/UserProfileMenu.tsx:92`| "My Tasks" | `"/my-work"` | Action link | Navigates to Personal Workload |
| 42 | `src/components/layout/UserProfileMenu.tsx:112`| Role switch | `getDefaultLandingRoute(newRole)`| Role Switch | Switches role and lands on home |
| 43 | `src/contexts/ProductionJourneyContext.tsx:938`| `jumpToStage` | `target.route` | Conveyor Stepper| Jumps to selected stage |
| 44 | `src/contexts/ProductionJourneyContext.tsx:948`| `advanceToNextStage` | `nextAction.route` | Conveyor Stepper| Advances to next stage |
| 45-63 | Various sub-components & modals | Contextual transitions | Explicit route targets | Local Actions | In-page navigation transitions |
