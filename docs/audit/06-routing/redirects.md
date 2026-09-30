# Route Redirects Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 06 — Complete Route Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Overview of Redirects in `src/App.tsx`

There are **39 total redirect routes** declared in `src/App.tsx`:
- **15 Static Redirects:** Using standard React Router `<Navigate to="..." replace />`.
- **24 Dynamic Redirects:** Using the custom `<VideoTabRedirect />` component.

---

## 2. Static Redirect Register (15 Routes)

| Origin Route | Destination Route | Trigger / Rationale | Classification |
| :--- | :--- | :--- | :--- |
| `/` (Index) | `landingRoute` (Role-based) | Initial app entry point | **EXPECTED** |
| `/questions/new` | `/studio` | Deprecated creation route | **LEGACY ALIAS** |
| `/generate` | `/studio` | Deprecated generator alias | **LEGACY ALIAS** |
| `/production-tracker` | `/production` | Nomenclature normalization | **LEGACY ALIAS** |
| `/production-board` | `/production?status=EDITING` | Kanban board alias | **LEGACY ALIAS** |
| `/videos/review-script`| `/production?status=SCRIPT_READY` | Discrete step page superseded | **LEGACY REDIRECT** |
| `/videos/record` | `/production?status=RECORDING` | Discrete step page superseded | **LEGACY REDIRECT** |
| `/videos/edit-video` | `/production?status=EDITING` | Discrete step page superseded | **LEGACY REDIRECT** |
| `/videos/final-video` | `/production?status=FINAL_REVIEW` | Discrete step page superseded | **LEGACY REDIRECT** |
| `/videos/thumbnail` | `/production?status=READY_TO_UPLOAD` | Discrete step page superseded | **LEGACY REDIRECT** |
| `/videos/pinned-comment`| `/production` | Discrete step page superseded | **LEGACY REDIRECT** |
| `/publishing-package` | `/platform-packages` | Nomenclature normalization | **LEGACY ALIAS** |
| `/videos/publishing-package` | `/platform-packages` | Nomenclature normalization | **LEGACY ALIAS** |
| `/videos/:videoId/publishing-package` | `/platform-packages` | Parameterized alias normalization | **LEGACY ALIAS** |
| `/production/:videoId/publishing-package`| `/platform-packages` | Parameterized alias normalization | **LEGACY ALIAS** |
| `/analytics` | `/analytics/overview` | Default tab redirect | **EXPECTED** |

---

## 3. Dynamic VideoTabRedirect Register (24 Routes)

`VideoTabRedirect` extracts `:videoId` from `useParams()` and redirects to `/videos/:videoId?tab={tab}`:
- `/videos/:videoId/script` -> `?tab=script`
- `/production/:videoId/script` -> `?tab=script`
- `/videos/:videoId/create-script` -> `?tab=script`
- `/production/:videoId/create-script` -> `?tab=script`
- `/videos/:videoId/review-script` -> `?tab=script`
- `/production/:videoId/review-script` -> `?tab=script`
- `/videos/:videoId/record` -> `?tab=recording`
- `/production/:videoId/record` -> `?tab=recording`
- `/videos/:videoId/edit-video` -> `?tab=editing`
- `/production/:videoId/edit-video` -> `?tab=editing`
- `/videos/:videoId/final-video` -> `?tab=final-review`
- `/production/:videoId/final-video` -> `?tab=final-review`
- `/videos/:videoId/thumbnail` -> `?tab=thumbnail`
- `/production/:videoId/thumbnail` -> `?tab=thumbnail`
- `/videos/:videoId/pinned-comment` -> `?tab=pinned-comment`
- `/production/:videoId/pinned-comment` -> `?tab=pinned-comment`
- `/videos/:videoId/social-review` -> `?tab=social`
- `/production/:videoId/social-review` -> `?tab=social`
- `/production/:videoId` -> `/videos/:videoId`
- `/videos/:videoId/publish` -> `?tab=publishing`
- `/production/:videoId/publish` -> `?tab=publishing`
