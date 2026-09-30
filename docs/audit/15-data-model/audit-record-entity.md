# Audit Event Entity Forensic Dossier

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 23 of 51  

---

## 1. Audit Event Identity & Schema

- **Canonical Name:** Audit Event
- **Classification:** Technical / Infrastructure Entity (Append-Only Journal)
- **Primary Identifier:** `LOG-timestamp-random` (e.g. `LOG-1727620800000-a1b2c3`)
- **Physical Storage:** Google Sheets tab `AUDIT_LOG` (8 columns)
- **TypeScript Model:** `interface AuditLog` (`src/types/index.ts:1150–1180`)
- **Repository:** `auditLogRepository` (`src/lib/repositories/audit-log.repository.ts`)

---

## 2. Immutability & Retention
- **Retention Policy:** Append-only. No UI or API endpoint supports editing or deleting rows in `AUDIT_LOG`.
- **Performance Hazard:** `AUDIT_LOG` sheet grows unboundedly with every user click and service event. With over 25,000 rows, full sheet reads during startup (`auditLogRepository.findAll()`) trigger memory spikes and slow boot times.
