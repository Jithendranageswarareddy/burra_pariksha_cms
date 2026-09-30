# SDLC Pre-Gate: 01 — Repository Naming Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Pre-SDLC Normalization Inventory  
**Status:** **AUTHORITATIVE ANALYSIS**  
**Date:** 2026-09-29  

---

## 1. Repository Structure & Naming Baseline

This inventory maps all active directories, source code modules, scripts, and tests across the BP-CMS codebase to establish the baseline for professional repository normalization.

```
/
├── app/                          # Mobile / Capacitor wrapper assets
├── docs/
│   ├── architecture/29-target/   # Step 29 Target Architecture Specifications
│   ├── audit/                    # Step 01 to 30 Forensic Audit Dossiers & Meta-Audits
│   ├── engineering/30-master-plan/ # Step 30 SDLC Master Implementation Blueprint
│   └── sdlc/repository-normalization/ # Pre-SDLC Repository Normalization Control
├── scripts/                      # 21 Operational & audit scripts
├── src/
│   ├── components/               # 80 React UI components
│   ├── config/                   # Configuration constants & route maps
│   ├── contexts/                 # React Contexts (Auth, Journey)
│   ├── design-system/            # Common UI tokens & atomic components
│   ├── lib/
│   │   ├── ai/                   # Gemini & multi-provider AI adapters
│   │   ├── google-sheets/        # Sheets API client & error handlers
│   │   ├── mock-data/            # Development mock fixtures
│   │   ├── ownership/            # Data ownership utilities
│   │   ├── repositories/         # 34 Google Sheets data repositories
│   │   ├── schemas/              # Zod validation & Sheets schemas
│   │   ├── services/             # 72 domain & workflow services
│   │   └── validation/           # Question validation engines
│   ├── pages/                    # 31 React pages and workspaces
│   ├── server/                   # Express routes & middleware
│   ├── tests/                    # 225 unit, regression & verification tests
│   ├── types/                    # Core TypeScript definitions & enums
│   └── utils/                    # Formatters & helper functions
├── Dockerfile                    # Multi-stage production container build
├── package.json                  # NPM manifest, dependencies & scripts
└── tsconfig.json                 # TypeScript compiler configuration
```

---

## 2. Directory Classification Matrix

| Directory | Layer / Purpose | Current Convention | Target Engineering Convention | Classification |
| :--- | :--- | :--- | :--- | :--- |
| `docs/audit/` | Historical Audit Dossiers | `01-baseline/` to `30-completion-verification/` | Preserved as `Audit Step XX` for traceability | **PRESERVE** |
| `docs/architecture/` | Target Architecture Design | `29-target/` | Preserved as Target System Architecture | **PRESERVE** |
| `docs/engineering/` | Master SDLC Blueprint | `30-master-plan/` | Preserved as Work Package Plan | **PRESERVE** |
| `docs/sdlc/` | SDLC Control Area | `repository-normalization/` | Canonical SDLC Control Directory | **ACTIVE SDLC** |
| `src/lib/services/` | Domain Services | Contains legacy `phaseXX-*.service.ts` | Normalized to domain-specific services | **NORMALIZE** |
| `src/lib/repositories/`| Persistence Repositories | Contains legacy `phaseXX-*.repository.ts` | Normalized to domain-specific repos | **NORMALIZE** |
| `src/types/` | TypeScript Definitions | Contains legacy `phaseXX-*.ts` | Normalized to domain types | **NORMALIZE** |
| `package.json` | Package Scripts | Contains `test:phase03` to `test:phase30` | Add professional task aliases | **NORMALIZE** |
