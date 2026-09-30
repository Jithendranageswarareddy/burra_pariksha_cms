# User Security & Identity Entity Forensic Dossier

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 20 of 51  

---

## 1. User Identity & Schema

- **Canonical Name:** User
- **Classification:** Security / Access Entity
- **Primary Identifier:** `id` (Pattern: `USR-XXX`, 3 digits, e.g. `USR-001`)
- **Physical Representation:** Row in Google Sheets tab `USERS` (10 columns)
- **TypeScript Model:** `interface User` (`src/types/index.ts:950–990`)
- **Repository:** `usersRepository` (`src/lib/repositories/users.repository.ts`)

---

## 2. Schema Reconciliation (`USERS` Tab)

| Col | Header | Type | Description |
| :-: | :--- | :---: | :--- |
| **A** | `id` | string | Primary Key (`USR-XXX`) |
| **B** | `email` | string | Unique corporate email address |
| **C** | `name` | string | Display full name |
| **D** | `role` | enum | `UserRole` (e.g. `ADMIN`, `TOPIC_LEAD`, `VIDEO_EDITOR`) |
| **E** | `status` | enum | `ACTIVE`, `INACTIVE` |
| **F** | `google_id` | string | Google OAuth subject identifier |
| **G** | `avatar_url` | string | Profile photo link |
| **H** | `last_login_at` | ISO date | Last authentication timestamp |
| **I** | `created_at` | ISO date | Creation timestamp |
| **J** | `updated_at` | ISO date | Modification timestamp |
