# Authentication Architecture Forensic Specification

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 02 of 41  

---

## 1. Core Authentication Mechanisms

| Dimension | Implementation Detail | Source File & Location |
| :--- | :--- | :--- |
| **Authentication Scheme** | Stateless Cryptographic HMAC-SHA256 Token | `src/lib/services/auth.service.ts` |
| **Token Format** | `base64url(payload).base64url(signature)` | `auth.service.ts:165` |
| **Secret Authority** | `SESSION_SECRET` env var (with dev fallback) | `auth.service.ts:38` |
| **Transport Medium** | `bp_session` HTTP-only cookie OR `Authorization: Bearer <token>` | `src/server/middleware/auth.middleware.ts:16` |
| **Session Lifetime** | 24 Hours default TTL (`issuedAt` to `expiresAt`) | `auth.service.ts:161` |
| **Credential Storage** | Native Node.js `crypto.scrypt` salted password hash (`scrypt$v1$...`) | `auth.service.ts:51` |
| **Identity Provider** | Authoritative `USERS` worksheet in Google Sheets | `src/lib/repositories/users.repository.ts` |
| **Session Invalidation** | Server-side `sessionVersion` counter & in-memory revocation cache | `auth.service.ts:101`, `users.repository.ts:74` |
