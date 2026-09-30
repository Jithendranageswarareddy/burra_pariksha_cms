# Final Data-Flow & Source-of-Truth Baseline

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 35 of 35  

---

## 1. Executive Forensic Synthesis

### Foundational Architectural Verdict:
**"Does every major business entity currently have ONE clearly identifiable authoritative source of truth?"**

### **FORENSIC ANSWER: NO / PARTIALLY**

While tabular business entities nominally map to specific worksheets in **Google Sheets API v4**, the architecture suffers from four fundamental source-of-truth failures:
1. **State Bipolarity:** Production workflow status is duplicated across `Video.status` and `Question.videoStatus`, with asynchronous, non-atomic updates that swallow synchronization errors.
2. **Storage Asymmetry:** High-value binary assets reside in Google Drive while their metadata resides in Google Sheets without transactional coupling (2PC), leading to permanent orphan files upon partial failure.
3. **Volatile In-Memory Authority:** Critical system governance states—specifically User Session Token validity and Sequence Counter allocation locks—are held authoritatively in Node.js volatile process memory rather than persistent or distributed stores, exposing the system to race conditions and token invalidation failures on Cloud Run.
4. **Relational Database Void:** Zero relational SQL databases exist; 100% of complex queries execute as un-indexed full-table downloads over HTTPS, creating scalability and consistency bottlenecks.

---

## 2. Core Architectural Baseline Specification

- **Tabular System of Record:** Google Sheets API v4 (25 Worksheets)
- **Binary System of Record:** Google Drive API v3 (Hierarchical Folders)
- **Session Authority:** Ephemeral In-Memory Map (High Risk)
- **Transaction Coordination:** Application-Level Sequential Cascades (Zero ACID)
- **Consistency Guarantee:** Best-Effort / Eventual (Bounded by 2.5s cache)
- **Next Audit Milestone:** Step 20 — Target Architecture & Governance Steps
