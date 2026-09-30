# Google Sheets Endpoints Forensic Audit (214 Endpoints)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 12 of 30  

---

## 1. Executive Summary

Google Sheets functions as the authoritative database of BP-CMS. A comprehensive trace reveals that **214 of the 271 endpoints** interact directly with one or more Google Sheets tabs via domain services.

---

## 2. Endpoint Distribution by Worksheet Tab

| Worksheet Tab | Endpoints Interacting | Read Endpoints | Mutation (Write) Endpoints | Primary Operations |
| :--- | :---: | :---: | :---: | :--- |
| `QUESTIONS` | 21 | 8 | 13 | List, get by ID, create, verify, polish |
| `VIDEOS` | 32 | 12 | 20 | List, get by ID, record take, submit cut, QC signoff |
| `SCRIPT` & `SCRIPT_VERSIONS` | 12 | 4 | 8 | Fetch script, save spoken teleprompter, versions |
| `THUMBNAILS` | 7 | 3 | 4 | List variants, save selected thumbnail |
| `PINNED_COMMENTS` | 4 | 2 | 2 | Fetch pinned comment, update text |
| `PUBLISHING` | 18 | 6 | 12 | Schedule post, record live URL, status check |
| `ASSIGNMENTS` | 11 | 4 | 7 | List assignments, create, complete, reassign |
| `CONTENT_BATCHES` | 18 | 8 | 10 | List batches, generate AI batch plan |
| `CATEGORIES` & `TOPICS` | 13 | 7 | 6 | List syllabus, create subject, update topic |
| `USERS` | 6 | 3 | 3 | List team members, update role, get profile |
| `AUDIT_LOG` | 42 (Side effect) | 1 | 41 | Read audit history, append action records |
| **All 18 Tabs (Recovery)** | 14 | 4 | 10 | Snapshot backup, preflight check, restore all |
