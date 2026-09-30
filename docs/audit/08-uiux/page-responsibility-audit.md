# Page Responsibility & Single Responsibility Principle (SRP) Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 08 of 30  
**Document:** 23 of 30  

---

## 1. Responsibility Audit Taxonomy

Pages are classified as:
- **SINGLE_RESPONSIBILITY**: Dedicated entirely to one focused operational activity.
- **MULTI_RESPONSIBILITY**: Combines several disparate functional duties into one monolithic file.
- **CONSOLIDATED_WORKSPACE**: Intentionally aggregates sequential stage workspaces behind a clean tabbed contract.

---

## 2. Page Responsibility Register

| Page Component | Classification | Encapsulated Responsibilities | Evidence & Findings |
| :--- | :--- | :--- | :--- |
| `PlanningPage.tsx` | **MULTI_RESPONSIBILITY** | 1) Curriculum taxonomy editor<br>2) Sprint batch generator<br>3) Topic distribution charts | 132KB file containing 17 raw fetches. High complexity. |
| `SettingsPage.tsx` | **MULTI_RESPONSIBILITY** | 1) Google Sheets connectivity diagnostics<br>2) Taxonomy database manager<br>3) System operational log inspector | 130KB file combining admin settings with data curation. |
| `RecoveryAdminPage.tsx`| **MULTI_RESPONSIBILITY** | 1) GCS snapshot backup generator<br>2) Checksum inspection engine<br>3) High-risk disaster recovery restore | 115KB file combining audit logging with destructive rollback. |
| `VideoDetailPage.tsx` | **CONSOLIDATED_WORKSPACE**| 1) Shell container for 8 production workspaces<br>2) URL parameter synchronization<br>3) Journey stepper synchronization | 28KB orchestrator. Correctly delegates tabs to sub-components! |
| `QuestionStudioPage.tsx`| **CONSOLIDATED_WORKSPACE**| 1) Curriculum selector<br>2) Bilingual editor<br>3) Gemini candidate AI generator | 70KB 4-step wizard. High density but focused on Question Creation. |
| `QuestionLibraryPage.tsx`| **SINGLE_RESPONSIBILITY**| Tabular browsing, filtering, and searching of question records | 17KB clean list view. |
| `QueuePage.tsx` | **SINGLE_RESPONSIBILITY**| Presenter recording schedule and prompter staging | 17KB focused queue. |
| `SocialReviewPage.tsx`| **SINGLE_RESPONSIBILITY**| Quality signoff for social media packaging | 23KB clean review view. |
