# Commit-to-Deployment Trace

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 03 — GitHub ↔ Google AI Studio ↔ Cloud Run Provenance  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Analysis  

---

## 1. Commit-to-Deployment Forensic Trace

| Trace Step | Identified Evidence / Value | Status | Evidence Source |
| :--- | :--- | :---: | :--- |
| **Authoritative GitHub Repo** | `Jithendranageswarareddy/burra_pariksha_cms` | CONFIRMED | `10-production-readiness.md` |
| **Authoritative Remote Branch** | `main` | CONFIRMED | Multiple milestone ledgers |
| **Latest Documented GitHub Main SHA** | `64c70c324b4b6d3578a82802ba70ae89614382c1` | CONFIRMED | `09-production-hardening.md` |
| **Stage 9 Reconciliation SHA** | `d510ef516c7f30d439a597e02e0a133bd521233c` | CONFIRMED | `10-production-readiness.md` |
| **Local AI Studio Baseline SHA** | `d6bea6cd525c0ec50c9f785357cfd4953e6943f2` | CONFIRMED | `13-github-local-reconciliation-report.md` |
| **Local AI Studio Working Tree** | `MODIFIED` (Stage 7-10 convergence additions) | CONFIRMED | 636 files present in working tree |
| **Active Cloud Run Service** | `ais-dev-fjjdmukiysol435fsvlcau` | CONFIRMED | Container `K_SERVICE` |
| **Active Cloud Run Revision** | `ais-dev-fjjdmukiysol435fsvlcau-00001-s2w` | CONFIRMED | Container `K_REVISION` |
| **Image Reference in Sandbox** | AI Studio container runtime image | CONFIRMED | Node 22 runtime sandbox |
| **Live Serving Traffic** | 100% routed to `ais-dev-fjjdmukiysol435fsvlcau-00001-s2w` | CONFIRMED | Dev URL active and responsive |

---

## 2. Traceability Conclusion

The active code running in Google AI Studio is **ahead** of the remote GitHub baseline in terms of uncommitted Stage 7 Phase 6-9 convergence refactoring, data ownership governance, and pre-production test data purging. Because the AI Studio sandbox does not commit directly to GitHub, the commit-to-deployment link between GitHub and AI Studio represents an **asynchronous development branch divergence** that requires human reconciliation before final release.
