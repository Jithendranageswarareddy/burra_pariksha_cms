# Form Failure Matrix (Comprehensive Failure Scenario Register)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 10 of 30  
**Document:** 25 of 30  

---

## 1. Master Form Failure Scenario Register

| Form ID | Form Name | Failure Scenario | Trigger | Backend HTTP Response | Frontend Handling | User Data Preserved? | Retry Allowed? | Rollback Triggered? | Partial Save Occurs? | UI Refresh Triggered? | Risk Level |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **FORM-01** | User Login | Invalid email/password | User enters incorrect credentials | 401 Unauthorized | Inline red text below password | NO (Password wiped) | YES | N/A | NO | NO | LOW |
| **FORM-02** | Question Studio | Category foreign key deleted | Admin deletes Category in parallel | 400 Bad Request | Top-level red alert banner | YES | YES | NO | NO | NO | HIGH |
| **FORM-03** | Question Verify | Rejection with empty reason | Reviewer clicks reject without note | 400 Bad Request | Red border around rejection note | YES | YES | NO | NO | NO | MEDIUM |
| **FORM-04** | Question Polish | Concurrent draft edit | Author and reviewer edit simultaneously | 200 OK (Overwrites) | Overwrites silent | NO | N/A | NO | NO | YES | HIGH |
| **FORM-07** | Script Editor | Google Sheets quota exceeded | 60 requests/min hit on sheets | 500 / 429 Quota Exceeded | Raw quota error string exposed | YES | YES | NO | NO | NO | HIGH |
| **FORM-09** | Video Recording | Invalid Drive URL entered | Non-Google Drive link submitted | 400 Bad Request | Alert: "Must be drive.google.com" | YES | YES | NO | NO | NO | LOW |
| **FORM-11** | Video Editing | Video status not READY_FOR_EDIT | Previous stage not approved | 400 Bad Request | Red banner: "Invalid video status" | YES | NO | NO | NO | YES | MEDIUM |
| **FORM-13** | Final Review QC | 1 item left unchecked | QA clicks signoff with 11/12 checks | Button disabled (Client blocked)| Client blocks | YES | N/A | N/A | NO | NO | LOW |
| **FORM-15** | Thumbnail Select | Image URL 404 broken link | Thumbnail generation service fails | 500 Internal Error | Gray fallback box displayed | YES | YES | NO | NO | NO | MEDIUM |
| **FORM-20** | Publishing Sched | Expired YouTube OAuth token | Platform token invalidated | 500 / 401 Token Error | Generic error: "Schedule failed" | NO (Resets) | YES | NO | PARTIAL | NO | CRITICAL |
| **FORM-25** | Task Assignment | Assignee user deactivated | User marked inactive in USERS | 400 Bad Request | Modal banner: "User not active" | YES | YES | NO | NO | NO | MEDIUM |
| **FORM-27** | Planning Batch | Google Sheets append collision | Concurrent batch creation | 500 Append Error | Page permanently hangs in loading | NO (Lost) | NO | NO | PARTIAL | NO | CRITICAL |
| **FORM-30** | Settings Config | Invalid Spreadsheet ID syntax | User enters malformed ID | 400 Bad Request | Toast: "Invalid spreadsheet ID" | NO (Reverts)| YES | YES | NO | YES | MEDIUM |
| **FORM-32** | Recovery Restore | Partial tab clear on timeout | Network drop during restore | 500 Timeout | Red warning: "Restore interrupted"| N/A | NO | NO | YES | NO | CRITICAL |
