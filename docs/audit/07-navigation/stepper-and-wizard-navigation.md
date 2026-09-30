# Multi-Step Wizards & Guided Workflow Navigation

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 07 of 30  
**Document:** 19 of 27  

---

## 1. Wizard Navigation Architecture

Beyond the macro 15-stage production conveyor belt, BP-CMS features internal micro-wizards that guide operators through complex multi-step data entry processes.

---

## 2. Micro-Wizard Implementations

### 1. Question Studio Authoring Wizard (`QuestionStudioPage.tsx`)
- **Step 1: Curriculum & Syllabus Context**: Topic selection, subtopic mapping, difficulty assignment (Easy, Medium, Hard).
- **Step 2: Question Statement & Options**: English & Telugu bilingual drafting, 4 distinct options, single correct answer selection.
- **Step 3: Pedagogical Proof & Explanation**: Step-by-step academic proof, key misconceptions, solver verification notes.
- **Step 4: AI Polish & Review**: Similarity check radar, grammar enhancement, candidate generation.
- **Navigation Controls**: "Previous Step", "Save Draft", "Next: Options & Proof", and "Save & Continue to Verification".

### 2. Multi-Platform Publishing Dispatcher Wizard (`PublishingWorkspace.tsx`)
- **Step 1: Asset Verification**: Confirms final video render, vertical 9:16 aspect ratio, and custom thumbnail exist in Google Drive.
- **Step 2: Metadata & Social Copy**: Title, multi-language description, Telugu hashtag block, and pinned comment validation.
- **Step 3: Platform Targets**: Selection of target endpoints (YouTube Shorts, Instagram Reels, Facebook Reels, Telegram).
- **Step 4: Scheduling & Dispatch**: Immediate publish vs timed release broadcast slot selector.
- **Navigation Controls**: "Back to Review", "Edit Metadata", "Schedule Multi-Platform Release".
