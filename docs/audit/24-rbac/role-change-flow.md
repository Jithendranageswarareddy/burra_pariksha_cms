# Role Change Propagation & Stale Session Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 25 of 41  

---

## 1. The Session Invalidation Architecture

When an administrator updates a user's role:
1. `usersRepository.updateRecord(userId, { role: newRole })` updates `USERS` sheet.
2. `AuthService.invalidateUserSessions(userId)` increments `sessionVersion` on the user record.
3. On the next incoming request, `requireAuth` compares `payload.sessionVersion` against current authoritative `userState.sessionVersion`.
4. If `tokenVersion < userState.sessionVersion`, the session is **immediately rejected with 401 Unauthorized**.
5. **Verdict:** Stale role claims cannot persist beyond the user's next API request.
