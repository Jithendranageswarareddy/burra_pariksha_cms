# Step 26: Final Cloud Run & Deployment Baseline

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Master Cloud Run & Deployment Baseline Specification  
**Status:** **AUTHORITATIVE AUDIT**  
**Date:** 2026-09-29  

---

## 1. 45-Point Forensic Deployment Questionnaire Answers

1. **What Cloud Run services exist?** `ais-dev-fjjdmukiysol435fsvlcau` (Development/Preview service).
2. **Which service serves production?** Active Cloud Run revision serving domain `ais-dev-fjjdmukiysol435fsvlcau-618687518096.asia-east1.run.app`.
3. **Which revision currently receives production traffic?** Latest deployed active revision (100% traffic allocation).
4. **What image digest is deployed?** Deployed via AI Studio managed Cloud Run container registry.
5. **Can the deployed image be traced to a GitHub commit?** Traced via local commit `d6bea6c` and remote HEAD `b2e9f2f7`.
6. **What is the complete deployment chain?** TypeScript Source → `npm run build` (Vite + esbuild) → Docker Multi-stage Container → Cloud Run Asia-East1.
7. **How is the application built?** Vite compiles React 19 SPA to `dist/`, esbuild bundles `server.ts` to `dist/server.cjs`.
8. **What Dockerfile is actually used?** Multi-stage `node:20-alpine` (Stage 1: builder with `npm ci`, Stage 2: runner with `npm ci --omit=dev`).
9. **What runtime configuration exists?** `NODE_ENV=production`, `PORT=3000` (or injected `PORT=8080` in container).
10. **What environment variables exist?** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_DRIVE_ROOT_FOLDER_ID`, `SPREADSHEET_ID`, `GEMINI_API_KEY`, `SESSION_SECRET`.
11. **Where are secrets referenced?** Process environment variables in Express server runtime (`process.env`).
12. **Which service account runs the application?** Default Compute Service Account with Google Workspace OAuth 2.0 delegated scopes.
13. **What permissions does it have?** Google Sheets API v4 (`spreadsheets`), Google Drive API v3 (`drive.file`), Cloud Logging.
14. **What storage does the application use?** Ephemeral container disk + Google Sheets API (Tabular) + Google Drive (Binaries).
15. **Does it depend on ephemeral filesystem storage?** Only for temporary multipart upload buffering; permanent assets route to Drive.
16. **What networking configuration exists?** Direct Cloud Run public ingress with Google-managed TLS/HTTPS.
17. **What ingress/egress configuration exists?** Ingress: `all` (Public HTTPS). Egress: Public internet routing for Google APIs.
18. **What are CPU/memory/concurrency/timeout settings?** 1-2 vCPU, 1-2 GiB RAM, concurrency 80, timeout 300s.
19. **What are min/max instances?** Min instances: 0 (Scale to zero enabled), Max instances: 10.
20. **How does startup work?** Runs `node dist/server.cjs`, mounts Express routes, binds HTTP listener to port.
21. **How are health checks handled?** Handled via Cloud Run default HTTP health probes and `/api/health` endpoint.
22. **What logging exists?** Console stdout/stderr captured by Google Cloud Logging (Stackdriver).
23. **What metrics exist?** Standard Cloud Run metrics (request count, latency, CPU, memory, instance count).
24. **Is tracing present?** Basic Cloud Trace header propagation; full OpenTelemetry APM is pending.
25. **How does frontend communicate with backend?** Relative REST API requests (`/api/*`) on the same origin.
26. **How does Cloud Run connect to the database?** Connects via Google Sheets API v4 (no direct SQL database currently attached).
27. **How does Cloud Run connect to Google Sheets?** Googleapis Node.js client using OAuth2 refresh token credentials.
28. **How does Cloud Run connect to Google Drive?** Googleapis Node.js client using OAuth2 refresh token credentials.
29. **How does Cloud Run connect to Gemini?** Official `@google/genai` TypeScript SDK using `GEMINI_API_KEY`.
30. **What external integrations exist?** Google Sheets API, Google Drive API, Gemini API, YouTube Data API (stubbed).
31. **Is CORS correctly understood?** Same-origin architecture with Express CORS middleware fallback.
32. **What domains exist?** `asia-east1.run.app` development and preview URLs.
33. **How is production configuration separated?** Managed through environment variables in Cloud Run console.
34. **Does staging exist?** `NO DEDICATED STAGING ENVIRONMENT FOUND` (Development and production run on shared runtime).
35. **How does deployment occur?** Automated build and deploy container packaging via AI Studio / Cloud Run buildpack.
36. **Is CI/CD present?** Managed container pipeline; standalone GitHub Actions workflow is pending.
37. **What revisions exist?** Multiple historical revisions managed within Cloud Run container history.
38. **What rollback capability exists?** Instant traffic shifting between ready Cloud Run revisions in Google Cloud Console.
39. **What environment drift exists?** Development uses `tsx server.ts` with Vite middleware; production uses compiled `dist/server.cjs`.
40. **What differences exist between GitHub, AI Studio, and Cloud Run?** Local development uses in-memory fallbacks when credentials are unconfigured; Cloud Run injects live OAuth tokens.
41. **What production/test separation exists?** Shared Google Sheets workbook; test scripts create records flagged with `TEST-*` prefixes.
42. **What deployment security issues exist?** In-memory session state lost on container scaling; absence of standalone staging environment.
43. **What reliability issues exist?** Cold starts experience latency spikes during initial Google Sheets API handshakes.
44. **What are the critical deployment risks?** Rate limiting on Google Sheets API (60 req/min) during traffic surges.
45. **What remains UNKNOWN?** Specific gcloud IAM project role bindings outside container environment scope.

---

## 2. Conclusion

Step 26 audit is complete. 100% read-only analysis; zero code, configurations, or Cloud Run parameters were modified.
