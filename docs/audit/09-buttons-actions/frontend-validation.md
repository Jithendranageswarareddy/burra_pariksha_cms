# Frontend Validation Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 09 of 30  
**Document:** 06 of 30  

---

## 1. Frontend Validation Patterns

Frontend validation across BP-CMS uses three patterns:
1. **Zod Schema Validation**: Form inputs parsed against formal Zod schemas before API calls.
2. **Manual Field Checks**: `if (!statement.trim()) { setError(...) }` inline checks.
3. **Form State Disablement**: Disabling the submit button until required checklist criteria or inputs are satisfied.

---

## 2. Frontend Validation Audit Register

| Action ID | Button Label | Validation Mechanism | Validation Rules Enforced | Failure UI Feedback | API Blocked? |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `ACT-QSTU-02` | "Save & Continue" | Zod Schema | Statement EN/TE >= 10 chars, 4 options non-empty, 1 correct option | Red inline error text below field | YES |
| `ACT-QVER-01` | "Approve Question" | State Checklist | 5 of 5 verification checkboxes must be checked | Button remains disabled | YES |
| `ACT-QVER-02` | "Reject Question" | Manual Check | Rejection reason string >= 10 chars | Modal alert message | YES |
| `ACT-SCPT-01` | "Approve Script" | Length & Regex | Telugu script text >= 50 words; duration between 30-90s | Warning badge & alert | YES |
| `ACT-REC-01` | "Save Best Take" | URI Regex | Drive URI matches `drive.google.com` | Inline error: "Invalid Drive URL" | YES |
| `ACT-QC-01` | "Approve Cut" | State Checklist | 12 of 12 QC review checkboxes must be checked | Button remains disabled | YES |
| `ACT-PUB-01` | "Schedule Release" | Datetime Check | Release datetime > `Date.now() + 15 mins`; >= 1 platform | Toast error: "Invalid schedule" | YES |
| `ACT-REST-01` | "Initiate Restore" | String Confirmation | User must type exact phrase "CONFIRM RESTORE" | Button remains disabled | YES |
