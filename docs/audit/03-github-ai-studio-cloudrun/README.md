# Step 03: GitHub ↔ Google AI Studio ↔ Cloud Run Code Provenance & Deployment Baseline Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 03 of 30  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Provenance Audit  
**Auditor:** Forensic Software Auditor (Evidence-First, Zero Mutation)  

---

## 1. Executive Summary

Step 03 establishes the code provenance, synchronization status, and deployment baseline across the three operational environments of the Burra Pariksha CMS project:
1. **GitHub Remote Repository:** The authoritative source control repository (`Jithendranageswarareddy/burra_pariksha_cms`).
2. **Google AI Studio Environment:** The active development applet workspace (`/app/applet`, Applet ID: `f592ca42-39af-4d83-aff2-6870ba939b0e`).
3. **Google Cloud Run Deployment:** The active container runtime hosting the development server and live application revision (`ais-dev-fjjdmukiysol435fsvlcau`, Revision: `ais-dev-fjjdmukiysol435fsvlcau-00001-s2w`).

### Absolute Read-Only Charter Statement
In strict adherence to the audit constitution:
- **Zero source code modifications** were made.
- **Zero git commands** modifying history, branches, or remotes were executed.
- **Zero Cloud Run deployments, revisions, or traffic adjustments** were triggered.
- **Zero secrets or credential tokens** were inspected or exposed.

---

## 2. High-Level Provenance Findings Summary

| Provenance Dimension | Finding / Status | Evidence Classification |
| :--- | :--- | :--- |
| **GitHub Remote Access** | `NOT_ACCESSIBLE FROM CURRENT ENVIRONMENT` | CONFIRMED (Sandbox lacks `.git` metadata & credentials) |
| **Authoritative GitHub Repo** | `Jithendranageswarareddy/burra_pariksha_cms` | CONFIRMED (Documented in `10-production-readiness.md`, `09-production-hardening.md`) |
| **Authoritative GitHub Branch** | `main` | CONFIRMED (Documented in historical milestone ledgers) |
| **Documented GitHub HEAD** | `d510ef516c7f30d439a597e02e0a133bd521233c` (Stage 9 Reconciliation) / `64c70c324b4b6d3578a82802ba70ae89614382c1` | CONFIRMED (Ledger evidence) |
| **Documented Local/AI Studio HEAD** | `d6bea6cd525c0ec50c9f785357cfd4953e6943f2` + uncommitted Stage 7-10 layers | CONFIRMED (`13-github-local-reconciliation-report.md`) |
| **AI Studio Working Tree** | `MODIFIED` / Contains local uncommitted convergence files & audit artifacts | CONFIRMED (636 files present, 42 untracked in git history) |
| **Active Cloud Run Service** | `ais-dev-fjjdmukiysol435fsvlcau` | CONFIRMED (Container `K_SERVICE` environment variable) |
| **Active Cloud Run Revision** | `ais-dev-fjjdmukiysol435fsvlcau-00001-s2w` | CONFIRMED (Container `K_REVISION` environment variable) |
| **Cloud Run Ingress Port** | Port 8080 (`PORT=8080`, `NGINX_PORT=8080`) | CONFIRMED (Container environment) |
| **Application Process Port** | Port 3000 (`DEFAULT_APP_PORT=3000`) | CONFIRMED (`server.ts` Express binding) |
| **Deployment Mechanism** | Google AI Studio containerized dev deployment + Production Dockerfile | CONFIRMED (Vite middleware in dev, esbuild in prod) |
| **Provenance Trustworthiness** | **MEDIUM CONFIDENCE** (Requires git sync before release) | CONFIRMED (Branch divergence documented between local and remote) |

---

## 3. Step 03 Documentation Index

This directory contains the 15 forensic provenance audit documents:
1. [`README.md`](./README.md) — Scope, summary, and verification ledger
2. [`github-baseline.md`](./github-baseline.md) — Remote repository identity, branch, commits, and access audit
3. [`ai-studio-baseline.md`](./ai-studio-baseline.md) — Local workspace structure, Applet ID, and working tree state
4. [`cloud-run-baseline.md`](./cloud-run-baseline.md) — Cloud Run service, active revision, container env, and ports
5. [`file-differences.md`](./file-differences.md) — File-by-file reconciliation matrix across GitHub and AI Studio
6. [`configuration-differences.md`](./configuration-differences.md) — Comparison of configs across environments
7. [`dependency-differences.md`](./dependency-differences.md) — Dependency versions across package.json, lockfile, and Docker
8. [`deployment-chain.md`](./deployment-chain.md) — End-to-end deployment pipeline analysis
9. [`commit-to-deployment-trace.md`](./commit-to-deployment-trace.md) — Trace from commit SHA to live Cloud Run revision
10. [`generated-files.md`](./generated-files.md) — Audit of generated artifacts, inventory dumps, and build outputs
11. [`manual-modification-analysis.md`](./manual-modification-analysis.md) — Forensic audit of manual edits vs automated pipelines
12. [`provenance-matrix.md`](./provenance-matrix.md) — Comprehensive environment consistency matrix
13. [`provenance-graph.md`](./provenance-graph.md) — Factual visual provenance and architecture flow diagrams
14. [`limitations.md`](./limitations.md) — Explicit boundaries, sandbox isolation, and inaccessible systems
15. [`final-comparison.md`](./final-comparison.md) — Definitive answers to the 12 primary provenance questions
