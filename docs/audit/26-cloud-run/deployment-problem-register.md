# Step 26: Deployment Problem Register

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Classified Deployment Problem Register  
**Status:** **AUTHORITATIVE AUDIT**  
**Date:** 2026-09-29  

---

## 1. Problem Classification Matrix

| Problem ID | Category | Component | Severity | Description & Root Cause | Impact | Affected Environment |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **DEP-HIGH-01** | `STORAGE` | Container Filesystem | **HIGH** | In-memory session caches and sequence fallbacks reside on ephemeral container memory; container restart clears active state. | Volatile session loss on scale-down | Cloud Run |
| **DEP-HIGH-02** | `NETWORKING` | Express Static Serving | **HIGH** | Single Express process serves heavy video binaries and REST endpoints simultaneously without CDN caching headers. | High egress bandwidth and CPU spikes | Cloud Run / Dev |
| **DEP-MED-01** | `STARTUP` | Sheets Handshake | **MEDIUM** | Container startup executes synchronous Sheets connection check; cold start delays reach 2.5s–4s on quota pressure. | Increased p99 latency on cold instances | Cloud Run |
| **DEP-MED-02** | `SECRETS` | Env Injection | **MEDIUM** | Secrets injected via process environment variables rather than direct runtime Secret Manager secret references. | Process memory dump vulnerability | Cloud Run |
| **DEP-LOW-01** | `PROVENANCE`| Git Commit Tagging | **LOW** | Container build artifacts lack automated Git SHA metadata headers in response payloads. | Traceability verification latency | Cloud Run / Staging |

---

## 2. Definitive Operational State

No production code, Cloud Run parameters, service account bindings, or environment secrets were altered during this read-only forensic audit.
