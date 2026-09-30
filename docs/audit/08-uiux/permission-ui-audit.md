# Permission UI & Client-Side RBAC Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 08 of 30  
**Document:** 19 of 30  

---

## 1. Client-Side Authorization Architecture

BP-CMS relies on `hasNavigationCapability(role, capability)` from `src/config/roles.ts` to filter menu visibility in `Sidebar.tsx`.
Crucially, **child routes in `src/App.tsx` do NOT enforce route-level authorization guards**.

---

## 2. In-Component UI Permission Gating Audit

| Page Component | Intended Capability | In-Component Check Present? | Unprivileged Role Behavior | Severity Finding |
| :--- | :--- | :---: | :--- | :---: |
| `RecoveryAdminPage` | `VIEW_DISASTER_RECOVERY` | NO | User sees snapshot list and can execute preflight | **CRITICAL (UI-021)** |
| `SettingsPage` | `VIEW_SYSTEM_HEALTH` | NO | User sees Google Sheets credentials and API configs| **CRITICAL (UI-021)** |
| `PlanningPage` | `VIEW_PLANNING` | NO | Non-lead users can add and delete sprint batches | **HIGH (UI-021)** |
| `QuestionStudioPage`| `VIEW_QUESTION_STUDIO`| NO | Presenter or Editor can submit draft questions | MEDIUM |
| `QuestionVerifyApprove`| `VIEW_QUESTIONS` | Partial | Approve button disables if not QA Reviewer | LOW |
| `TeamOperationsPage`| `VIEW_TEAM` | Partial | Reassignment modal hides for non-lead roles | LOW |
