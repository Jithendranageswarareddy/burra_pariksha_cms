# Stage Transition & Exit Matrix

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 21 of 30  
**Document:** 20 of 31  

---

## 1. Actual Exit Condition vs Canonical Target

| Stage | Actual Exit Condition | Actual Next Route | Canonical Next Stage | Transition Mechanism | Alignment |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **01** | Draft saved to sheet | `/questions/:id/verify` | 02 Question Verification | React Router `navigate()` | **ALIGNED** |
| **02** | Approval certified | `/videos/:id?tab=script` | 03 Audience Script | React Router `navigate()` | **ALIGNED** |
| **03** | Script saved as v1 | `/videos/:id?tab=recording` | 04 Teleprompter & Filming| Tab switch inside page | **ALIGNED** |
| **04** | Filming completed | `/videos/:id?tab=recording` | 05 Raw Video | Same tab (Action switch) | **COMPRESSED** |
| **05** | Raw footage uploaded | `/videos/:id?tab=editing` | 06 Editing Bay | 3-step chained API calls | **HACKED** |
| **06** | Final cut linked | `/videos/:id?tab=final-review`| 07 Final QC | Tab switch inside page | **ALIGNED** |
| **07** | Master QC certified | `/videos/:id?tab=thumbnail` | 08 Thumbnail Studio | Tab switch inside page | **ALIGNED** |
| **08** | Thumbnail approved | `/social-review/:reviewId` | 09 Social Review | React Router `navigate()` | **ALIGNED** |
| **09** | Review signed off | `/publishing` | 10 Publishing Setup | React Router `navigate()` | **ALIGNED** |
| **10** | Release scheduled | `/publishing` (Live tab) | 11 Published / Live | Same page tab switch | **ALIGNED** |
| **11** | URLs validated | `/platform-packages` | 12 Platform Sync | React Router `navigate()` | **ALIGNED** |
| **12** | Sync confirmed | `/social-analytics/:id` | 13 Analytics | React Router `navigate()` | **ALIGNED** |
| **13** | Metrics entered | `/analytics/engagement` | 14 Performance Review | React Router `navigate()` | **ALIGNED** |
| **14** | Trends analyzed | `/analytics/intelligence` | 15 Intelligence Loop | Tab switch inside page | **ALIGNED** |
| **15** | Strategy generated | `/studio?topicId=...` | 01 Question Generation | React Router `navigate()` | **ALIGNED** |
