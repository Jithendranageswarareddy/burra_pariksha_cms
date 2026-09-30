# Authorization Bypass Analysis

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 27 of 41  

---

## 1. Potential Bypass Scenarios Investigated

| Scenario | Attack Path | Defense Present? | Outcome |
| :--- | :--- | :--- | :--- |
| **Direct API Mutation** | Attacker calls `PATCH /api/videos/:id/status` with curl | Yes: `requireAuth` + `objectAuthService` | **BLOCKED (401/403)** |
| **Draft Sequence Forge** | Non-reviewer calls `POST /api/questions/create-from-draft` | Yes: `requireRole([REVIEWER, ADMIN])` | **BLOCKED (403)** |
| **Admin Panel Direct URL**| Non-admin types `/recovery` into browser | Yes: Client `!isAdmin` + API `requireRole([ADMIN])` | **BLOCKED (UI & API)** |
| **Direct DB Sheet Access**| Attacker accesses Google Sheets directly | Yes: Service account credentials kept server-side | **BLOCKED** |
