# Permission Trace Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 09 of 30  
**Document:** 05 of 30  

---

## 1. Permission Architecture

BP-CMS evaluates permissions across two layers:
1. **Frontend UI Permission Checks**: `hasNavigationCapability(role, capability)` in `src/config/roles.ts` hides navigation items and disables buttons.
2. **Backend API Middleware**: `requireRole([...])` in `src/server/middleware/auth.middleware.ts` validates the session token and user role.

---

## 2. End-to-End Action Permission Trace

| Action ID | Button Label | Required Role | Frontend Gated? | Backend Gated? | Bypass Vulnerability? |
| :--- | :--- | :--- | :---: | :---: | :---: |
| `ACT-QSTU-02` | "Save & Continue" | `ACADEMIC_SOLVER`, `ADMIN` | YES (Disabled for editor) | YES (`requireRole`) | NO (Fully gated) |
| `ACT-QVER-01` | "Approve Question" | `QA_REVIEWER`, `ADMIN` | YES (Button disabled) | YES (`requireRole`) | NO (Fully gated) |
| `ACT-REC-01` | "Save Best Take" | `PRESENTER`, `ADMIN` | NO (Visible to anyone in tab)| YES (`requireRole`) | UI Role Leakage |
| `ACT-EDIT-01` | "Submit for QC" | `VIDEO_EDITOR`, `ADMIN` | NO (Visible to anyone in tab)| YES (`requireRole`) | UI Role Leakage |
| `ACT-REST-01` | "Initiate Restore" | `ADMIN` | YES (Hidden in sidebar) | **PARTIAL** | **CRITICAL: URL direct access** |
| `ACT-SETT-01` | "Save Taxonomy" | `ADMIN` | YES (Hidden in sidebar) | **PARTIAL** | **CRITICAL: URL direct access** |

---

## 3. High-Risk Findings

1. **Client-Only Menu Hiding Without Route Guard**:
   - `RecoveryAdminPage` and `SettingsPage` are hidden in `Sidebar.tsx` for non-admins, but entering `/recovery` or `/settings` directly in the browser address bar mounts the page.
2. **Missing Route-Level Role Wrappers**:
   - In `src/App.tsx`, all child routes under `Layout` lack authorization guards.
