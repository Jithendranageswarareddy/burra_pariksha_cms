# Workflow Transition Entity Forensic Dossier

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 25 of 51  

---

## 1. Workflow Transition Identity & Schema

- **Canonical Name:** Workflow Transition Record
- **Classification:** Technical / Lifecycle History Entity
- **Primary Identifier:** `WF-timestamp-seq-entityId`
- **Physical Storage:** Google Sheets tab `WORKFLOW` (9 columns)
- **TypeScript Model:** `interface Workflow` (`src/types/index.ts:1110–1145`)
- **Repository:** `workflowRepository` (`src/lib/repositories/workflow.repository.ts`)

---

## 2. Schema Columns (`WORKFLOW` Tab)

| Col | Header | Type | Description |
| :-: | :--- | :---: | :--- |
| **A** | `id` | string | Transition ID (`WF-...`) |
| **B** | `entity_type` | string | Target entity class (`QUESTION`, `VIDEO`, etc.) |
| **C** | `entity_id` | string | Primary key of modified entity |
| **D** | `from_status` | string | Pre-transition status enum |
| **E** | `to_status` | string | Post-transition status enum |
| **F** | `triggered_by` | string | User ID of actor |
| **G** | `actor_name` | string | Display name of actor |
| **H** | `remarks` | string | Optional transition notes / rejection reasons |
| **I** | `timestamp` | ISO date | Timestamp of transition |
