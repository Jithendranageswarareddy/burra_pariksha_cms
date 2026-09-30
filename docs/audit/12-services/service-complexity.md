# Service Complexity Indicators Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 31 of 30  

---

## 1. Complexity Indicators Overview

Complexity indicators examine line counts, branch density, state dependencies, and external touches across services:
- **Top Service by Lines**: `publishing.service.ts` (2,168 lines)
- **Top Service by Method Count**: `publishing.service.ts` (46 public methods)
- **Top Service by Sheet Dependencies**: `data-integrity.service.ts` (18 sheets)
- **Top Service by Workflow Stages Touched**: `video.service.ts` (7 stages)

---

## 2. High-Complexity Service Ranking

| Rank | Service Name | Lines of Code | Public Methods | Downstream Dependencies | Sheets Touched | Complexity Rating |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| **1** | `publishing.service.ts` | 2,168 | 46 | 8 | 4 | **VERY HIGH** |
| **2** | `data-integrity.service.ts`| 1,835 | 38 | 6 | 18 | **VERY HIGH** |
| **3** | `dashboard.service.ts` | 1,425 | 34 | 4 | 8 | **HIGH** |
| **4** | `platform-adaptation.service`| 1,464 | 22 | 3 | 2 | **HIGH** |
| **5** | `assignment.service.ts` | 1,445 | 22 | 4 | 3 | **HIGH** |
| **6** | `phase26-copilot.service.ts`| 1,240 | 18 | 4 | 2 | **HIGH** |
| **7** | `question.service.ts` | 1,101 | 24 | 4 | 2 | **HIGH** |
| **8** | `content-master.service.ts` | 1,089 | 20 | 3 | 2 | **HIGH** |
| **9** | `taxonomy.service.ts` | 1,078 | 24 | 2 | 3 | **MODERATE** |
| **10**| `video.service.ts` | 920 | 28 | 5 | 4 | **HIGH** |
