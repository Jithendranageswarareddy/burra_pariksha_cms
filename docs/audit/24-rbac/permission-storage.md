# Permission Storage Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 23 of 41  

---

## 1. Authority Breakdown

1. **User Role Definitions:** Authoritative source is the `USERS` worksheet in Google Sheets.
2. **Session Role Claims:** Copied into signed HMAC-SHA256 session token at login.
3. **Role-to-Capability Rules:** Hardcoded in TypeScript code constants (`routes.ts`, `object-auth.service.ts`, `question.service.ts`).
4. **Dynamic Assignments:** Stored in `ASSIGNMENTS` worksheet in Google Sheets.
