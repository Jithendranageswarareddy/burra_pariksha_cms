# Permission Bypass Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 09 of 30  
**Document:** 25 of 30  

---

## 1. Permission Bypass Architecture

An action is classified as **PERMISSION_BYPASS (ACT-004)** if an unauthorized role can execute it through alternate navigation paths, direct URL entry, or unguarded endpoints.

---

## 2. Permission Bypass Vulnerabilities Identified

| Action / Capability | Intended Role | Protected Path | Bypass Path | Severity |
| :--- | :--- | :--- | :--- | :---: |
| **Disaster Recovery Restore** (`VIEW_DISASTER_RECOVERY`)| `ADMIN` | Hidden in `Sidebar.tsx` | Direct browser navigation to `/recovery` or `/admin`. Component mounts without role check. | **CRITICAL (ACT-004)** |
| **Google Sheets Config** (`VIEW_SYSTEM_HEALTH`)| `ADMIN` | Hidden in `Sidebar.tsx` | Direct browser navigation to `/settings`. Can trigger Sheets ping and view sheet IDs. | **CRITICAL (ACT-004)** |
| **Curriculum Batch Creation** (`VIEW_PLANNING`)| `CONTENT_LEAD`, `PRODUCER`| Hidden in `Sidebar.tsx` for editors | Direct URL entry to `/planning`. Presenters can create and delete batches. | **HIGH (ACT-004)** |
| **Question Verification Approval** (`VIEW_QUESTIONS`)| `QA_REVIEWER`, `ADMIN` | Approve button disabled in UI | Direct `POST /api/questions/:id/verify` via API tool bypasses client disabled state. | **HIGH (ACT-004)** |
