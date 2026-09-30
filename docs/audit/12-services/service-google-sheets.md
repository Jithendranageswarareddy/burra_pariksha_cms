# Google Sheets Domain Services Forensic Audit (58 Services)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 15 of 30  

---

## 1. Google Sheets as Relational Engine

Because Google Sheets is the sole relational database of BP-CMS, **58 domain services** depend on it. Each service maps business operations to one or more of the 18 authoritative worksheet tabs.

---

## 2. Worksheet Access Heatmap across Services

| Worksheet Tab Name | Services Reading Tab | Services Writing Tab | Transaction / Locking Mechanism | Primary Operational Entities |
| :--- | :---: | :---: | :--- | :--- |
| `QUESTIONS` | 18 | 6 | In-memory mutex on sequence allocation | Academic questions, options, explanations |
| `VIDEOS` | 24 | 14 | None (Last-Write-Wins) | Video production entities, takes, edit links |
| `SCRIPT` & `SCRIPT_VERSIONS`| 8 | 4 | Monotonic version increment | Spoken scripts, teleprompter speed, cues |
| `THUMBNAILS` | 6 | 4 | None (Last-Write-Wins) | Image URLs, variant tags, designer signoffs |
| `PUBLISHING` | 12 | 8 | None (Last-Write-Wins) | Multi-platform scheduling, post IDs |
| `ASSIGNMENTS` | 14 | 6 | Workload count check before write | Task allocations, deadlines, assignees |
| `AUDIT_LOG` | 4 | 32 (Append) | Append-only (Unchecked row append) | Compliance audit trail of all mutations |
| `CATEGORIES` & `TOPICS` | 16 | 4 | In-memory cache with manual refresh | Syllabus taxonomy hierarchy |
| `USERS` | 12 | 4 | None | User profiles, roles, active statuses |
