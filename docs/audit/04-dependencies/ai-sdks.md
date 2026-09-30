# AI & Gemini SDKs Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 04 — Dependency & Package Forensic Audit  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Analysis  

---

## 1. Primary AI Framework

The application relies on Google's modern GenAI SDK for server-side generative and verification workloads:
- **Package Name:** `@google/genai`
- **Declared Version:** `^2.4.0`
- **Resolved Version:** `2.22.0`
- **Primary Model Alias:** `gemini-2.5-flash` (with configurable overrides)
- **Primary Consumers:**
  - `src/lib/ai/gemini.client.ts` (Client bootstrap, timeout handling, retry wrapper)
  - `src/lib/ai/gemini.service.ts` (Content generation, prompt dispatching)
  - `src/lib/ai/providers/gemini.adapter.ts` (Provider interface abstraction)
  - `src/lib/ai/schemas/*.schema.ts` (Structured JSON output constraints via Zod)

---

## 2. Multi-Provider Fallback Architecture (Lean Footprint)

The application supports 7 fallback LLM providers in `src/lib/ai/providers/` without installing vendor-specific SDK packages:
1. **Groq** (`groq.adapter.ts`) — Native `fetch()` targeting Groq API
2. **Mistral** (`mistral.adapter.ts`) — Native `fetch()` targeting Mistral API
3. **Anthropic** (`anthropic.adapter.ts`) — Native `fetch()` targeting Anthropic API
4. **OpenRouter** (`openrouter.adapter.ts`) — Native `fetch()` targeting OpenRouter API
5. **Cohere** (`cohere.adapter.ts`) — Native `fetch()` targeting Cohere API
6. **Hugging Face** (`huggingface.adapter.ts`) — Native `fetch()` targeting Hugging Face Inference API
7. **xAI** (`xai.client.ts`) — Native `fetch()` targeting xAI API

### Architectural Assessment:
By utilizing standard REST endpoints with Node native `fetch` rather than installing vendor SDKs (`@anthropic-ai/sdk`, `groq-sdk`, etc.), the project prevents dependency bloat and keeps the container bundle lightweight.
