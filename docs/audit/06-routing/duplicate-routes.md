# Duplicate Route Candidates & Aliases Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 06 — Complete Route Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Competing & Duplicate Route Path Analysis

The audit identified **14 duplicate route pairs/aliases** declared in `src/App.tsx`:

### 1. Production Pipeline Aliases (`/videos/*` vs `/production/*`)
For every video workflow step, two identical parallel routes exist:
- `/videos/:videoId/script` == `/production/:videoId/script`
- `/videos/:videoId/create-script` == `/production/:videoId/create-script`
- `/videos/:videoId/review-script` == `/production/:videoId/review-script`
- `/videos/:videoId/record` == `/production/:videoId/record`
- `/videos/:videoId/edit-video` == `/production/:videoId/edit-video`
- `/videos/:videoId/final-video` == `/production/:videoId/final-video`
- `/videos/:videoId/thumbnail` == `/production/:videoId/thumbnail`
- `/videos/:videoId/pinned-comment` == `/production/:videoId/pinned-comment`
- `/videos/:videoId/social-review` == `/production/:videoId/social-review`
- `/videos/:videoId/platform-packages` == `/production/:videoId/platform-packages`
- `/videos/:videoId/publish` == `/production/:videoId/publish`

### 2. Creation Aliases
- `/studio` (Canonical) vs `/questions/new` (Redirect) vs `/generate` (Redirect).

### 3. Team Operations Aliases
- `/team` (Canonical) vs `/team-work` (Direct render of same component).

### 4. Admin Recovery Aliases
- `/recovery` (Canonical) vs `/admin` (Direct render of same component).
