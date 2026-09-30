# Workflow Loop Analysis

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 30 of 41  

---

## 1. Architectural & Iterative Loops

The workflow supports 3 intentional feedback and revision loops:

1. **Pedagogical Revision Loop (Stage 02 -> Stage 01):**
   - Trigger: Reviewer clicks "Request Revision" on `QuestionVerifyApprovePage`.
   - Transition: Question or Draft status updated to `REJECTED`.
   - Effect: Content Creator re-opens item in `QuestionStudioPage` to adjust options or math explanation.

2. **Editing Bay QC Rejection Loop (Stage 07 -> Stage 06):**
   - Trigger: Master QC checklist fails in `FinalReviewWorkspace`.
   - Transition: Video status reverted from `FINAL_REVIEW` to `EDITING`.
   - Effect: Editor receives failure remarks to re-render subtitles or audio balance.

3. **Intelligence Flywheel Loop (Stage 15 -> Stage 01):**
   - Trigger: Executive Producer applies AI Strategy Recommendation in `AnalyticsExperiencePage`.
   - Transition: Topic, difficulty, and hook framing dispatched to `/studio`.
   - Effect: Initializes new generation cycle based on top-performing audience retention patterns.
