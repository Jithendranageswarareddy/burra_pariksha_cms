# React Contexts Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 05 — Frontend Architecture Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. React Context Population

The repository contains exactly **2 global React contexts** in `src/contexts/`:

### 1. `AuthContext.tsx` (79 lines)
- **Path:** `src/contexts/AuthContext.tsx`
- **State Provided:**
  - `user: User | null`
  - `isLoading: boolean`
- **Methods Provided:**
  - `login(userId, password)`
  - `logout()`
  - `refreshUser()`
- **Persistence:** Relies on `localStorage.getItem("bp_session_token")` managed inside `apiClient`.
- **Initialization:** Executes `apiClient.getMe()` on mount.
- **Consumers:** 18 frontend files (`App.tsx`, `Sidebar.tsx`, `UserProfileMenu.tsx`, `PlanningPage.tsx`, etc.).

### 2. `ProductionJourneyContext.tsx` (996 lines)
- **Path:** `src/contexts/ProductionJourneyContext.tsx`
- **State Provided:**
  - Canonical IDs: `contentMasterId`, `questionId`, `videoId`, `scriptId`, `thumbnailId`, `publishingId`
  - Entities: `question`, `video`, `script`, `thumbnail`, `publishing`, `contentMaster`
  - Journey state: `currentStage` (1 to 15), `stages: JourneyStage[]`, `nextAction: JourneyNextAction`
- **Methods Provided:**
  - `advanceToNextStage()`, `jumpToStage(stageNumber)`, `reloadJourneyData()`
  - `loadJourneyForQuestion(id)`, `loadJourneyForVideo(id)`, `loadJourneyForContentMaster(id)`
- **Consumers:** 24 frontend files (Workspaces, pages, `ProductionJourneyBar`).

---

## 2. Context Architecture Evaluation
- **God-Context Pattern:** `ProductionJourneyContext` is exceptionally large (996 lines) and couples data loading for 6 distinct backend entity types with 15-stage workflow state transition rules and React Router navigation triggers.
