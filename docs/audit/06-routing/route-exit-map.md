# Route Exit Transitions Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 06 — Complete Route Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Key Route Exit Transitions

| Origin Route | Trigger Action | Exit Destination | Method |
| :--- | :--- | :--- | :--- |
| `/` (Index) | Route evaluation | Dynamic `landingRoute` based on role | `<Navigate replace />` |
| `/studio` | "Save & Continue to Verify" | `/questions/:id/verify` | `navigate()` |
| `/questions/:id/verify` | "Approve & Create Script" | `/videos/create-script?questionId=...` | `navigate()` |
| `/videos/create-script` | "Save Script Draft" | `/videos/:videoId?tab=script` | `navigate()` |
| `/queue` | "Open Studio Teleprompter" | `/videos/:videoId?tab=recording` | `navigate()` |
| `/videos/:videoId?tab=recording`| "Upload Raw Footage" | `/videos/:videoId?tab=editing` | `navigate()` |
| `/videos/:videoId?tab=editing`| "Submit for Final Review" | `/videos/:videoId?tab=final-review` | `navigate()` |
| `/videos/:videoId?tab=final-review`| "Approve Final Video" | `/videos/:videoId?tab=thumbnail` | `navigate()` |
| `/videos/:videoId?tab=thumbnail`| "Select Thumbnail" | `/videos/:videoId?tab=social` | `navigate()` |
| `/social-review/:reviewId` | "Approve Social Package" | `/publishing` | `navigate()` |
| `/platform-packages` | "Proceed to Schedule" | `/publishing` | `navigate()` |
| `/publishing` | "Publish Complete" | `/analytics/overview` | `navigate()` |
| `/*` (404) | "Return to Dashboard" | `/dashboard` | `<Link to="/dashboard">` |
