# Lifecycle Stage 15: Intelligence Loop & Flywheel

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 23 of 35  
**Document:** 18 of 35  

---

## 1. Transition Details

| Attribute | Forensic Value |
| :--- | :--- |
| **Origin Entity** | Aggregated Performance Summaries |
| **Action** | Synthesize AI Strategy & Generate Topic Recommendations |
| **Resulting Entity** | `SocialPerformanceIntelligenceRecord` (`INT-######`) |
| **State** | `ADVISORY` |
| **Page / Component** | `AnalyticsExperiencePage.tsx?tab=intelligence` |
| **Active Route** | `/analytics/intelligence` |
| **REST API** | `POST /api/intelligence/generate` |
| **Service Layer** | `SocialPerformanceIntelligenceService.synthesizeInsights()` |
| **Repository Layer** | `intelligenceRepository.appendRecord()` |
| **Authoritative Storage**| Google Sheets `ANALYTICS_INTELLIGENCE` worksheet |
| **Next Entity / State** | Stage 01 Question Studio (Flywheel Loopback) |

---

## 2. Does the Flywheel Loop Back to Stage 01?

1. **Strategic Recommendations:** Gemini AI analyzes audience drop-offs and recommends specific topics (e.g. "Percentages - Successive Discount Trick") with suggested pacing and hook copy.
2. **The Feedback Mechanism:**
   - The UI provides an "Apply to Question Studio" action.
   - When clicked, it redirects to: `/studio?topicId=<TOPIC>&difficulty=<DIFF>&prompt=<SEED>`.
3. **Forensic Verdict:**
   - **Semi-Automated:** The feedback loop **does exist**, but it is not headless. It relies on a human user clicking the button in the intelligence tab to re-seed Stage 01.
