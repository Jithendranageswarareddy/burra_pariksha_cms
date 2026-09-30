# Authoritative State Ownership Architecture

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 13 of 30  
**Document:** 16 of 30  

---

## 1. Single Authoritative Owner Principle

In a clean architecture, each entity status column must have **exactly ONE designated domain service** that is legally permitted to write to that column. All other services requiring a state change must dispatch a command to that owner service.

---

## 2. Canonical Ownership vs Actual Reality Matrix

| Entity | State Field | Canonical Owner | Actual Writers in Codebase | Compliance Status |
| :--- | :--- | :--- | :--- | :---: |
| **Question** | `status` | `QuestionService` | `question.service.ts`, `question-validation.service.ts`, `phase13.service.ts`, `routes.ts` | **VIOLATION** |
| **Question** | `validationStatus` | `QuestionValidationService`| `question-validation.service.ts`, `question.service.ts` | **VIOLATION** |
| **Video** | `status` | `VideoService` | `video.service.ts`, `script.service.ts`, `phase17.service.ts`, `publishing.service.ts` | **VIOLATION** |
| **Script** | `status` | `ScriptService` | `script.service.ts`, `phase15.service.ts`, `phase16.service.ts` | **VIOLATION** |
| **Thumbnail**| `status` | `ThumbnailService` | `thumbnail.service.ts`, `phase18.service.ts` | **VIOLATION** |
| **Publishing**| `status` | `PublishingService` | `publishing.service.ts`, `routes.ts` | PARTIAL |
| **Assignment**| `status` | `AssignmentService` | `assignment.service.ts` | **COMPLIANT** |
| **Master** | `status` | `ContentMasterService` | `content-master.service.ts` | **COMPLIANT** |
