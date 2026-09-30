# Runtime Dependencies Forensic Dossiers

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 04 — Dependency & Package Forensic Audit  
**Audit Date:** 2026-09-28  

Audit of all **15 declared runtime dependencies** in `package.json` (`dependencies`):

| Package | Declared Version | Resolved Version | Category | Inbound Imports | Criticality | Purpose |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| `@google/genai` | `^2.4.0` | `2.22.0` | AI | **7 files** | **CRITICAL** | Official Gemini AI SDK |
| `@tailwindcss/vite` | `^4.1.14` | `4.3.3` | BUILD / STYLING | **1 files** | **HIGH** | Vite plugin for Tailwind v4 CSS bundler |
| `@vitejs/plugin-react` | `^5.0.4` | `5.2.0` | BUILD / FRONTEND | **1 files** | **HIGH** | Vite plugin for React fast refresh & JSX |
| `busboy` | `^1.6.0` | `1.6.0` | STORAGE | **1 files** | **MEDIUM** | Streaming multipart form parser for video uploads |
| `dotenv` | `^17.2.3` | `17.4.2` | CONFIG | **0 files** | **LOW** | Environment variable loader (Unused in source) |
| `express` | `^4.21.2` | `4.22.2` | BACKEND | **3 files** | **CRITICAL** | HTTP server framework |
| `express-rate-limit` | `^8.7.0` | `8.7.0` | SECURITY | **1 files** | **MEDIUM** | API endpoint rate limiting |
| `googleapis` | `^176.0.0` | `176.0.0` | GOOGLE / STORAGE | **21 files** | **CRITICAL** | Google Sheets & Google Drive API client |
| `helmet` | `^8.3.0` | `8.3.0` | SECURITY | **1 files** | **MEDIUM** | HTTP security headers middleware |
| `lucide-react` | `^0.546.0` | `0.546.0` | UI / ICONS | **98 files** | **MEDIUM** | UI icon library (98 components) |
| `motion` | `^12.23.24` | `12.43.0` | ANIMATION | **0 files** | **LOW** | Framer motion animation library (Unused in source) |
| `react` | `^19.0.1` | `19.3.0` | FRONTEND | **47 files** | **CRITICAL** | Core UI rendering library |
| `react-dom` | `^19.0.1` | `19.3.0` | FRONTEND | **1 files** | **CRITICAL** | Core UI rendering library |
| `react-router-dom` | `^7.18.2` | `7.18.3` | FRONTEND | **61 files** | **CRITICAL** | Client-side routing and navigation |
| `zod` | `^4.4.3` | `4.6.2` | VALIDATION | **12 files** | **CRITICAL** | Schema declaration & validation engine |
