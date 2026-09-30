# API Response Shape Coupling Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 05 — Frontend Architecture Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Coupling Overview

Frontend components exhibit high coupling to raw backend TypeScript interfaces declared in `src/types/` and `src/lib/schemas/`:

| Entity Model | Consuming Frontend Files | Coupling Depth | Transformation Layer |
| :--- | :---: | :---: | :--- |
| `Question` | **28 files** | **HIGH** | Direct property access (`question.teluguQuestion`, `question.options`) without ViewModel |
| `Video` | **22 files** | **HIGH** | Direct property access (`video.rawFootageUrl`, `video.finalVideoUrl`) |
| `Script` | **14 files** | **MEDIUM** | Direct property access (`script.hook`, `script.body`, `script.cta`) |
| `Thumbnail` | **11 files** | **MEDIUM** | Direct property access (`thumbnail.candidates`, `thumbnail.selectedUrl`) |
| `Publishing` | **12 files** | **HIGH** | Direct property access (`publishing.platforms`, `publishing.scheduledTime`) |
| `ContentMaster` | **8 files** | **HIGH** | Correlates all downstream entities by raw foreign keys |

---

## 2. ViewModel & DTO Absence
- **Finding:** The application does NOT implement a client-side ViewModel or DTO transformation layer. Raw backend database entities flow directly from `apiClient` into React component props and `useState` holders.
