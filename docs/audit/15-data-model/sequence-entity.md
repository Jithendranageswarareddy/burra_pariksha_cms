# Sequence Technical Entity Forensic Dossier

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 24 of 51  

---

## 1. Sequence Entity Identity & Architecture

- **Canonical Name:** Sequence Counter
- **Classification:** Technical / Infrastructure Entity (Atomic Generator)
- **Primary Identifier:** Entity Name string (e.g. `"QUESTION"`, `"VIDEO"`, `"CONTENT_MASTER"`)
- **Physical Storage:** Google Sheets tab `SEQUENCES` (4 columns)
- **TypeScript Model:** `interface SequenceRecord` (`src/types/index.ts:1200–1230`)
- **Repository:** `sequencesRepository` (`src/lib/repositories/sequences.repository.ts`)
- **Governing Service:** `sequenceSafetyService` (`src/lib/services/sequence-safety.service.ts`)

---

## 2. Storage Representation (`SEQUENCES` Sheet Tab)

| Col | Header | Type | Description |
| :-: | :--- | :---: | :--- |
| **A** | `entity_type` | string | Primary Key (`QUESTION`, `VIDEO`, etc.) |
| **B** | `current_val` | number | Monotonically increasing integer counter |
| **C** | `prefix` | string | Canonical prefix string (`BP-Q-`, `BP-V-`) |
| **D** | `pad_length` | number | Zero-padding length (e.g. 6) |

---

## 3. High-Concurrency Mutex Vulnerability
To prevent duplicate IDs, `sequenceSafetyService` uses an in-memory Promise mutex queue. This correctly serializes requests within a single Node.js process. However, if deployed on Cloud Run with multi-instance autoscaling, **separate container instances will allocate identical IDs simultaneously**, leading to primary key collisions in Google Sheets.
