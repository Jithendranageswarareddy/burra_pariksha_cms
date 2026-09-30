# AI & Gemini Orchestration Services Forensic Audit (7 Services)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 14 of 30  

---

## 1. AI Integration Architecture

BP-CMS centralizes its artificial intelligence logic within **7 dedicated AI services**:
- `src/lib/ai/gemini.service.ts` (Core SDK Client)
- `src/lib/ai/phase24-orchestrator.service.ts` (Pipeline AI Orchestrator)
- `src/lib/services/phase26-copilot.service.ts` (Workflow Copilot Assistant)
- `src/lib/services/comment-intelligence.service.ts` (Viewer Feedback Clustering)
- `src/lib/services/social-performance-intelligence.service.ts` (Audience Retention AI)
- `src/lib/services/phase18-thumbnail-intelligence.service.ts` (Thumbnail Vision Analysis)
- `src/lib/services/phase19-pinned-comment-intelligence.service.ts` (Call-to-Action Generation)

---

## 2. AI Model Selection & Prompt Characteristics

| AI Service | Target Model | Structured JSON Output? | Zod Validation Schema | Fallback Behavior on Malformed JSON |
| :--- | :--- | :---: | :--- | :--- |
| `gemini.service.ts` | `gemini-2.5-flash` | YES | `QuestionCandidateZodSchema` | Returns raw text error to caller |
| `phase24-orchestrator.service.ts`| `gemini-2.5-pro` | YES | `ScriptGenerationZodSchema` | Retries prompt once with error feedback |
| `phase26-copilot.service.ts` | `gemini-2.5-pro` | NO (Markdown) | N/A | Displays error banner in chat drawer |
| `comment-intelligence.service.ts`| `gemini-2.5-flash` | YES | `CommentIntelligenceZodSchema`| Drops invalid cluster; processes valid ones |
| `thumbnail-intelligence.service` | `imagen-3.0` | NO (Binary) | N/A | Fallback to default generated SVG banner |
