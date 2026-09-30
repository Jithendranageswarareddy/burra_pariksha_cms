# Step 30: 09 — Intelligence Loop & Feedback System Blueprint

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Intelligence Engine & Closed-Loop Architecture  
**Status:** **AUTHORITATIVE BLUEPRINT**  
**Date:** 2026-09-29  

---

## 1. Closed-Loop Intelligence Architecture (Stage 15 → Stage 01)

The Burra Pariksha Content Management System achieves continuous curriculum improvement by connecting Stage 14 (Performance Diagnosis) and Stage 15 (Intelligence Synthesis) directly back into Stage 01 (Question Generation).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        THE 15-STAGE CLOSED LOOP                        │
└────────────────────────────────────────────────────────────────────────┘
  [ Stage 01: Authoring & Gemini AI ] ◄─────────────────────────────────┐
                 │                                                      │
                 ▼                                                      │
  [ Stages 02–10: Production Pipeline ]                                 │
                 │                                                      │
                 ▼                                                      │
  [ Stage 11: Multi-Platform Publishing ]                               │
                 │                                                      │
                 ▼                                                      │
  [ Stage 13: 24h / 7d / 30d Analytics Ingestion ]                      │
                 │                                                      │
                 ▼                                                      │
  [ Stage 14: Audience Retention & Drop-off Diagnostics ]               │
                 │                                                      │
                 ▼                                                      │
  [ Stage 15: Intelligence Synthesis Engine ] ──────────────────────────┘
    - High-performing topic clustering
    - Question length vs retention correlation
    - Prompt optimization directives (e.g. "Shorter intros, punchier Telugu idioms")
```

---

## 2. Dynamic Prompt Tuning & Topic Recommendation Engine

```typescript
export class IntelligenceSynthesisService {
  async generateNextCurriculumBatch(subject: string): Promise<IntelligenceBatchResult> {
    // 1. Fetch top 10% and bottom 10% performing videos in subject
    const performanceData = await analyticsRepository.getSubjectBenchmarks(subject);

    // 2. Synthesize audience retention drop-off patterns
    const promptDirectives = this.extractPromptTuningDirectives(performanceData);

    // 3. Invoke Gemini Pro to generate next recommended topic batch
    const aiResponse = await geminiService.generateContent({
      model: 'gemini-2.5-pro',
      systemInstruction: `You are the Burra Pariksha Chief Curriculum Strategist.
      Historical Data Insights:
      ${JSON.stringify(promptDirectives)}
      Generate 5 high-yield question topics that address audience retention weaknesses.`,
      contents: [{ role: 'user', parts: [{ text: `Generate top 5 topics for subject: ${subject}` }] }]
    });

    const recommendations = JSON.parse(aiResponse.text);

    // 4. Persist recommendations into database
    await db.insert(intelligenceRecommendations).values(recommendations);

    return { recommendations, promptDirectives };
  }
}
```

---

## 3. One-Click Studio Ingestion Protocol

1. When a Content Manager reviews recommendations in `/intelligence`, clicking **"Create from Insight"** triggers `POST /api/intelligence/:id/spawn-studio-draft`.
2. The server initializes a new `ContentItem` and `QuestionDraft` pre-populated with AI prompt directives, target keywords, and recommended difficulty.
3. The UI automatically transitions the manager to `/studio?draftId=BP-DFT-...` with live state synchronization.
