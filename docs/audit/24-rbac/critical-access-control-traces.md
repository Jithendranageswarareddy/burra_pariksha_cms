# Critical Access Control Traces

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 38 of 41  

---

## Trace 1: Successful Authorized Question Verification
```
1. User USR-002 (Role: REVIEWER) submits POST /api/questions/create-from-draft
2. requireAuth verifies HMAC signature and sessionVersion -> PASS
3. requireRole([REVIEWER, ADMIN]) matches req.user.role -> PASS
4. objectAuthService.canModifyQuestion verifies assignment -> PASS
5. Canonical sequence minted, row appended to QUESTIONS -> 200 OK
```

## Trace 2: Unauthorized Video Status Mutation Rejected
```
1. User USR-005 (Role: STUDIO_PRESENTER) submits PATCH /api/videos/BP-V-000001/status { status: 'EDITED' }
2. requireAuth verifies token -> PASS
3. requireRole([VIDEO_EDITOR, ADMIN]) fails to match STUDIO_PRESENTER -> 403 Forbidden
4. Mutation aborted, zero database write occurs.
```
