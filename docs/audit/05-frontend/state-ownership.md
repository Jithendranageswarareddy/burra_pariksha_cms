# State Ownership & Single-Source-of-Truth Analysis

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 05 — Frontend Architecture Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Core Entity State Ownership Mapping

| Entity / State Variable | Intended Source of Truth | Actual Frontend State Owners | Conflict Severity |
| :--- | :--- | :--- | :---: |
| **Current User & Role** | Backend Session / Cookie | `AuthContext` (Stores `User` object) | LOW (Synchronized via `getMe()`) |
| **Question Data** | Google Sheets (`Questions` tab) | `QuestionDetailPage` (`useState`), `ProductionJourneyContext` (`useState`), `QuestionTable` (`useState`) | **HIGH** (Multiple competing local states) |
| **Video Production Data** | Google Sheets (`Videos` tab) | `VideoDetailPage` (`useState`), `ProductionJourneyContext` (`useState`), Workspace components (`useState`) | **HIGH** (Workspaces often mutate local copy before sync) |
| **Workflow Stage / Tab** | Google Sheets (`Workflows` tab) | URL search param (`?tab=`), `ProductionJourneyContext.currentStage`, and local page tab state | **CRITICAL** (Tri-state divergence risk) |
| **Sidebar Collapse State** | Browser Local Storage | `Layout.tsx` (`useState` initialized from `localStorage`) | LOW |
| **Entity Assignments** | Google Sheets (`Assignments` tab)| `AssignmentModal` (`useState`), parent table/page (`useState`) | **MEDIUM** (Requires parent callback to refresh) |

---

## 2. Conflicting Ownership Patterns
- **Tri-State Divergence:** In `VideoDetailPage.tsx`, the displayed workspace depends on `activeTab`. However, `ProductionJourneyContext` maintains `currentStage` independently. If a user advances a stage via the journey bar, the URL search param must be manually updated to prevent visual mismatch.
