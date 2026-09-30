# Lock Files Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 04 — Dependency & Package Forensic Audit  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Analysis  

---

## 1. Lock File Inventory

| Lock File Candidate | Presence | File Size | Description |
| :--- | :---: | :---: | :--- |
| `bun.lock` | **PRESENT** | 86,858 bytes | Bun modern text lockfile |
| `package-lock.json` | **ABSENT** | - | Standard NPM v2/v3 lockfile |
| `yarn.lock` | **ABSENT** | - | Yarn lockfile |
| `pnpm-lock.yaml` | **ABSENT** | - | PNPM lockfile |
| `npm-shrinkwrap.json` | **ABSENT** | - | NPM shrinkwrap |

---

## 2. Package Manager Divergence Analysis

1. **Local Development Tooling:** The presence of `bun.lock` indicates that dependency resolution and locking were executed using **Bun**.
2. **Production Container Specification:** `/Dockerfile` specifies:
   ```dockerfile
   RUN npm ci
   ```
   and
   ```dockerfile
   RUN npm ci --omit=dev
   ```
3. **Operational Consequence:** `npm ci` strictly requires `package-lock.json` or `npm-shrinkwrap.json` to exist. In an environment without `package-lock.json`, running `npm ci` directly will fail with `npm error code ENOENT: package-lock.json not found`.
4. **Conclusion:** There is a tooling divergence between the Bun-resolved development lockfile and the npm-targeted container build script.
