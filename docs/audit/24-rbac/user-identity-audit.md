# User Identity Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 05 of 41  

---

## 1. Verified Identifiers Across Layers

| Identifier | Source | Storage | Usage Layer | Authority |
| :--- | :--- | :--- | :--- | :---: |
| **User ID (`USR-###`)** | `USERS` Sheet | Tabular Column `id` | Auth, Assignments, Audit | **AUTHORITATIVE** |
| **Email** | User Input / SSO | Tabular Column `email` | Login lookup, Notifications | Secondary Unique |
| **Name** | User Profile | Tabular Column `name` | Display, Legacy Host Assignment | Cosmetic / Join |
| **Session ID** | UUIDv4 | Token Payload | Session Revocation Registry | Ephemeral |
| **Google Subject ID** | OAuth Token | Google Drive Tokens | Google Drive binary operations | External Provider |
