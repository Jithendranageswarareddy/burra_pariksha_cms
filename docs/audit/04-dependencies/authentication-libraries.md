# Authentication & Security Libraries Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 04 — Dependency & Package Forensic Audit  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Analysis  

---

## 1. Authentication Package Inventory

| Package Name | Declared Version | Resolved Version | Role in Security Hierarchy |
| :--- | :--- | :--- | :--- |
| **`helmet`** | `^8.0.0` | `8.3.0` | Security headers middleware mounted in Express (`src/server/routes.ts`) |
| **`express-rate-limit`** | `^7.5.0` | `8.7.0` | Endpoint rate limiter preventing brute-force and request flooding |
| **`crypto` / `node:crypto`** | Built-in Node.js | Native Node v22 | Cryptographic hashing (SHA-256 password salting, session token generation) |

---

## 2. In-House Authentication Architecture

Rather than relying on heavyweight external auth platforms (Passport, NextAuth, Firebase Auth), the system implements an internal, database-backed auth service:
- **Service:** `src/lib/services/auth.service.ts`
- **User Datastore:** `USERS` worksheet in Google Sheets
- **Password Security:** Salted SHA-256 hash digests via `crypto.createHmac()`
- **Session Tokens:** Signed bearer session tokens verified against `sessionVersion` on every request for real-time revocation.
- **RBAC Matrix:** Strict role verification (`ADMIN`, `MANAGER`, `CONTENT_CREATOR`, `REVIEWER`, `SPECIALIST`) enforced by `src/lib/ownership/data-ownership.ts` and `src/server/middleware/auth.middleware.ts`.
