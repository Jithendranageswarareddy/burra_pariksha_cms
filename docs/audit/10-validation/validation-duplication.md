# Validation Duplication Forensic Audit (28 Duplicated Rules)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 10 of 30  
**Document:** 08 of 30  

---

## 1. Executive Summary

A forensic review identified **28 validation rules** implemented redundantly across multiple layers of the codebase.
In software architecture, validation duplication falls into two broad categories:
1. **Intentional Defense-in-Depth**: Client-side validation providing immediate responsive user feedback, backed up by strict server-side validation preventing malicious or invalid persistence.
2. **Accidental / Drifting Duplication**: Disconnected implementations of the same rule that can silently diverge over time when requirements evolve.

---

## 2. Duplication Classification Register

| Rule Description | Client Layer | Server Route Layer | Service / Schema Layer | Classification | Drift Risk |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Question Text Required** | `QuestionStudioPage.tsx` | `routes.ts` (`!questionText`) | `question.service.ts` (Zod `.min(10)`) | Intentional Defense-in-Depth | LOW |
| **Drive URL Format Check** | `RecordingWorkspace.tsx` | `routes.ts` (`.includes("drive")`) | `google-sheets-schema.ts` (`z.string().url()`) | Intentional Defense-in-Depth | LOW |
| **Email Format Check** | `LoginPage.tsx` | `auth.service.ts` | N/A | Duplicated Same Rule | LOW |
| **Question Language Enum** | `QuestionStudioPage.tsx` | `routes.ts` (`['te', 'en']`) | `QuestionLanguage` enum in types | Intentional Defense-in-Depth | LOW |
| **Question Difficulty Enum** | `QuestionStudioPage.tsx` | `routes.ts` (`['EASY','MEDIUM','HARD']`)| `DifficultyLevel` enum in types | Intentional Defense-in-Depth | LOW |
| **Video Production Status** | `ProductionTrackerPage.tsx` | `routes.ts` | `video.service.ts` & state machine | Duplicated Same Rule | MEDIUM |
| **Assignment Assignee ID** | `AssignmentModal.tsx` | `routes.ts` (`!assigneeId`) | `assignment.service.ts` (`getUserById`) | Intentional Defense-in-Depth | LOW |
| **Platform Target List** | `PublishingWorkspace.tsx` | `routes.ts` | `publishing.service.ts` | Duplicated Same Rule | MEDIUM |
| **Script Target Duration** | `ScriptWorkspace.tsx` (`30-300`) | `routes.ts` (None!) | `script.service.ts` (`30-180`) | **CONFLICTING DUPLICATION** | **HIGH** |
| **Verification Score Range**| `QuestionVerifyApprovePage` (`0-100`)| `routes.ts` (`0-100`) | `question.service.ts` (`0-100`) | Intentional Defense-in-Depth | LOW |
