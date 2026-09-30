# NPM Scripts Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 04 — Dependency & Package Forensic Audit  
**Audit Date:** 2026-09-28  

The root `package.json` defines **34 scripts**, classified into lifecycle/build, development, and phase test runners:

| Script Name | Command Line | Category | Purpose | Mutating? |
| :--- | :--- | :--- | :--- | :---: |
| `npm run dev` | `tsx server.ts` | DEVELOPMENT | Starts Express + Vite full-stack server via tsx | NO |
| `npm run build` | `vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs` | BUILD | Compiles Vite SPA to dist/ and esbuilds server.ts to dist/server.cjs | NO (Filesystem build) |
| `npm run start` | `node dist/server.cjs` | PRODUCTION | Runs compiled production server via node | NO |
| `npm run preview` | `vite preview` | PREVIEW | Serves Vite preview build | NO |
| `npm run test:phase03` | `tsx src/tests/phase03-design-system-verification.ts` | TEST | Executes Phase 03 automated verification suite | NO |
| `npm run test:phase04` | `tsx src/tests/phase04-shell-navigation-verification.ts` | TEST | Executes Phase 04 automated verification suite | NO |
| `npm run test:phase05` | `tsx src/tests/phase05-dashboard-home-verification.ts` | TEST | Executes Phase 05 automated verification suite | NO |
| `npm run test:phase06` | `tsx src/tests/phase06-question-workflow-verification.ts` | TEST | Executes Phase 06 automated verification suite | NO |
| `npm run test:phase07` | `tsx src/tests/phase07-video-workflow-verification.ts` | TEST | Executes Phase 07 automated verification suite | NO |
| `npm run test:phase08` | `tsx src/tests/phase08-asset-review-verification.ts` | TEST | Executes Phase 08 automated verification suite | NO |
| `npm run test:phase09` | `tsx src/tests/phase09-publishing-workflow-verification.ts` | TEST | Executes Phase 09 automated verification suite | NO |
| `npm run test:phase10` | `tsx src/tests/phase10-analytics-experience-verification.ts` | TEST | Executes Phase 10 automated verification suite | NO |
| `npm run test:phase11` | `tsx src/tests/phase11-legacy-ui-simplification-verification.ts` | TEST | Executes Phase 11 automated verification suite | NO |
| `npm run test:phase12` | `tsx src/tests/phase12-final-ui-ux-acceptance-verification.ts` | TEST | Executes Phase 12 automated verification suite | NO |
| `npm run test:phase14` | `SKIP_SHEETS_SYNC=true tsx src/tests/run-phase14-only.ts` | TEST | Executes Phase 14 automated verification suite | NO |
| `npm run test:phase14-real` | `tsx src/tests/phase14-real-drive-e2e.ts` | TEST | Executes Phase 14-real automated verification suite | NO |
| `npm run test:phase15` | `SKIP_SHEETS_SYNC=true tsx src/tests/run-phase15-only.ts` | TEST | Executes Phase 15 automated verification suite | NO |
| `npm run test:phase16` | `SKIP_SHEETS_SYNC=true tsx src/tests/run-phase16-only.ts` | TEST | Executes Phase 16 automated verification suite | NO |
| `npm run test:phase17` | `SKIP_SHEETS_SYNC=true tsx src/tests/run-phase17-only.ts` | TEST | Executes Phase 17 automated verification suite | NO |
| `npm run test:phase18` | `SKIP_SHEETS_SYNC=true tsx src/tests/run-phase18-only.ts` | TEST | Executes Phase 18 automated verification suite | NO |
| `npm run test:phase19` | `SKIP_SHEETS_SYNC=true tsx src/tests/run-phase19-only.ts` | TEST | Executes Phase 19 automated verification suite | NO |
| `npm run test:phase20` | `SKIP_SHEETS_SYNC=true tsx src/tests/run-phase20-only.ts` | TEST | Executes Phase 20 automated verification suite | NO |
| `npm run test:phase21` | `SKIP_SHEETS_SYNC=true tsx src/tests/run-phase21-only.ts` | TEST | Executes Phase 21 automated verification suite | NO |
| `npm run test:phase22` | `SKIP_SHEETS_SYNC=true tsx src/tests/run-phase22-only.ts` | TEST | Executes Phase 22 automated verification suite | NO |
| `npm run test:phase23` | `SKIP_SHEETS_SYNC=true tsx src/tests/run-phase23-only.ts` | TEST | Executes Phase 23 automated verification suite | NO |
| `npm run test:phase24` | `SKIP_SHEETS_SYNC=true tsx src/tests/run-phase24-only.ts` | TEST | Executes Phase 24 automated verification suite | NO |
| `npm run test:phase25` | `SKIP_SHEETS_SYNC=true tsx src/tests/run-phase25-only.ts` | TEST | Executes Phase 25 automated verification suite | NO |
| `npm run test:phase26` | `SKIP_SHEETS_SYNC=true tsx src/tests/run-phase26-only.ts` | TEST | Executes Phase 26 automated verification suite | NO |
| `npm run test:phase27` | `SKIP_SHEETS_SYNC=true tsx src/tests/run-phase27-only.ts` | TEST | Executes Phase 27 automated verification suite | NO |
| `npm run test:phase28` | `SKIP_SHEETS_SYNC=true tsx src/tests/run-phase28-only.ts` | TEST | Executes Phase 28 automated verification suite | NO |
| `npm run test:phase29` | `SKIP_SHEETS_SYNC=true tsx src/tests/run-phase29.ts` | TEST | Executes Phase 29 automated verification suite | NO |
| `npm run test:phase30` | `SKIP_SHEETS_SYNC=true tsx src/tests/run-phase30-social-comments.ts` | TEST | Executes Phase 30 automated verification suite | NO |
| `npm run clean` | `rm -rf dist server.js` | MAINTENANCE | Removes dist/ and server.js build artifacts | YES (Deletes dist) |
| `npm run lint` | `tsc --noEmit` | LINT | Executes TypeScript typecheck via tsc --noEmit | NO |
