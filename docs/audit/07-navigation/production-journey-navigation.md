# 15-Stage Production Stepper Navigation Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 07 of 30  
**Document:** 07 of 27  

---

## 1. Stepper Architecture & Context Integration

The conveyor belt stepper navigation is driven by `src/contexts/ProductionJourneyContext.tsx` and rendered visually via `src/components/production/ProductionJourneyBar.tsx`. It maps directly to the 15 canonical production stages established in `01-product-truth.md`.

```typescript
// src/components/production/ProductionJourneyBar.tsx
export const ProductionJourneyBar: React.FC<ProductionJourneyBarProps> = ({
  className = "",
  onNavigateTab,
  showDetails = false,
  activeStage,
}) => {
  const { currentStage, stages, nextAction, advanceToNextStage, jumpToStage } = useProductionJourney();
  ...
};
```

---

## 2. Complete 15-Stage Stepper Navigation Matrix

| Stage # | Canonical Stage Code | Stage Display Label | Target Route / Workspace Tab | Prerequisite Lock Condition | Next Action Label |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | `QUESTION_GENERATION` | Question Authoring | `/studio` | None (Always Unlocked) | Continue to Verification |
| **02** | `QUESTION_VERIFICATION` | Academic Verification | `/questions/:id/verify` | Requires Draft Question ID | Approve & Start Script |
| **03** | `AUDIENCE_SCRIPT` | Scriptwriting | `/videos/:id?tab=script` | Question Verified Status | Complete & Review Script |
| **04** | `TELEPROMPTER` | Spoken Prep / Prompter | `/videos/:id?tab=recording` | Script Status = `READY` | Advance to Studio Filming |
| **05** | `RAW_VIDEO` | Studio Recording | `/videos/:id?tab=recording` | Prompter Run Completed | Intake Raw Footage & Edit |
| **06** | `EDITING` | Video Editing | `/videos/:id?tab=editing` | Raw Footage Ingested | Submit Rough Cut for QC |
| **07** | `FINAL_QC` | Final QC Review | `/videos/:id?tab=final-review`| Edit Status = `SUBMITTED` | Approve Cut & Design Thumb |
| **08** | `THUMBNAIL` | Thumbnail Studio | `/videos/:id?tab=thumbnail` | Video Passed Final QC | Approve Thumbnail & Social |
| **09** | `SOCIAL_REVIEW` | Social Gatekeeper | `/social-review/:reviewId` | Thumbnail & Telugu Ready | Approve Social & Schedule |
| **10** | `PUBLISHING_SETUP` | Publishing Dispatcher | `/videos/:id?tab=publishing` | Social Review Signoff | Dispatch & Schedule Release |
| **11** | `PUBLISHED` | Live Verification | `/publishing` | Scheduled Time Arrived | Verify Multi-Platform Sync |
| **12** | `PLATFORM_SYNC` | Platform Sync Check | `/platform-packages` | Live URLs Recorded | View Social Analytics |
| **13** | `ANALYTICS` | Social Analytics | `/social-analytics/:contentId` | Video Live > 24 Hours | Conduct Performance Review |
| **14** | `PERFORMANCE_REVIEW` | Retention & Drop-off | `/analytics/engagement` | Audience Samples Gathered | Explore Pedagogical Insights|
| **15** | `INSIGHTS` | Pedagogical Intelligence| `/analytics/intelligence` | Metric Significance Reached | Create Next Question (Loop) |

---

## 3. Transition Handlers & Interaction Mechanics

1. **Direct Stage Jumping (`handleStageClick`)**:
   - If `stage.isBlocked === true`, navigation is intercepted and a tooltip popup is displayed explaining the missing prerequisite.
   - If unlocked and `onNavigateTab` is supplied, it invokes `onNavigateTab(stage.tab)` for instant tab switching without URL unmounting.
   - Otherwise, it invokes `jumpToStage(stage.stageNumber)` via `ProductionJourneyContext`.
2. **Next Action Acceleration (`handleNextActionClick`)**:
   - Computes intelligent next progression step from state context (`nextAction`).
   - Forwards to the target route/tab and updates the active stage cursor.
3. **Closed Feedback Loop**:
   - At Stage 15 (`INSIGHTS`), the `nextAction` points back to Stage 01 (`/studio`), reinforcing continuous pedagogical improvement and content compounding.
