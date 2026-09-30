# Duplicate & Overlapping Library Analysis

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 04 — Dependency & Package Forensic Audit  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Analysis  

---

## 1. Overlapping Functionality Analysis

| Functional Domain | Packages / Mechanisms | Overlap Nature | Forensic Evidence & Architectural Observation |
| :--- | :--- | :--- | :--- |
| **Vite Tooling in Runtime Dependencies** | `@tailwindcss/vite`, `@vitejs/plugin-react` vs `devDependencies` | Bundler plugins declared in runtime `dependencies` | Both plugins are build-time tools needed only by Vite during compilation. In the production container, `npm ci --omit=dev` retains them unnecessarily in production `node_modules`. |
| **Tailwind CSS Declarations** | `tailwindcss` in `devDependencies` + `@tailwindcss/vite` in `dependencies` | Split dependency declaration | Tailwind v4 engine is split across dev and runtime dependencies. |
| **AI Multi-Provider Adapters** | `@google/genai` vs native `fetch` in provider adapters | Formal SDK vs REST HTTP clients | Gemini uses the official `@google/genai` TypeScript SDK. The other 7 fallback providers (Groq, Mistral, Anthropic, OpenRouter, Cohere, HuggingFace, xAI) implement direct `fetch` calls without pulling vendor SDK packages, maintaining a lean dependency footprint. |
| **HTTP Parsing** | `express.json()` vs `busboy` | Body parser vs multipart stream | `express.json()` handles structured JSON payloads, while `busboy` handles chunked multipart video uploads to Google Drive. Complementary, non-conflicting. |
