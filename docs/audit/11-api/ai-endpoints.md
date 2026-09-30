# AI & Gemini Orchestration Endpoints Forensic Audit (42 Endpoints)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 15 of 30  

---

## 1. AI Integration Architecture

BP-CMS integrates the Google Gen AI SDK (`@google/genai`) across **42 dedicated endpoints** to power automated content generation, pedagogy verification, teleprompter pacing, and multi-platform social adaptations.

---

## 2. Key AI Endpoint Register (Sample)

| Endpoint Path | Method | Gen AI Model Invoked | Prompt Purpose | Service Executed |
| :--- | :--- | :--- | :--- | :--- |
| `/api/questions/ai-generate` | `POST` | `gemini-2.5-flash` | Generate 4-option Telugu multiple-choice questions | `questionService.generateCandidate` |
| `/api/questions/:id/ai-improve` | `POST` | `gemini-2.5-flash` | Improve academic stem and explanation polish | `questionService.aiImprove` |
| `/api/scripts/ai-generate` | `POST` | `gemini-2.5-pro` | Generate 60-second spoken teleprompter script | `scriptService.generateScript` |
| `/api/thumbnails/ai-variants` | `POST` | `imagen-3.0` | Generate visual thumbnail concept overlays | `thumbnailService.generateVariants` |
| `/api/social-enhancement/generate`| `POST` | `gemini-2.5-flash` | Generate platform-specific social hooks & tags | `SocialEnhancementService` |
| `/api/comment-intelligence/analyze`| `POST` | `gemini-2.5-flash` | Cluster viewer comments into syllabus questions | `commentIntelligenceService` |
| `/api/copilot/chat` | `POST` | `gemini-2.5-pro` | Interactive AI workflow assistant query | `phase26CopilotService.chat` |
| `/api/content-strategy/generate` | `POST` | `gemini-2.5-pro` | Generate 30-day curriculum content roadmap | `contentStrategyService.generate` |
