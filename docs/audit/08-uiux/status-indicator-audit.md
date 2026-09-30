# UI Status Indicator Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 08 of 30  
**Document:** 15 of 30  

---

## 1. Status Indicator Architecture

Status indicators communicate lifecycle progression across entities:
- **Questions**: `DRAFT` -> `VERIFIED` -> `IN_PRODUCTION` -> `PUBLISHED` / `REJECTED`
- **Videos**: `SCRIPT_READY` -> `RECORDING` -> `EDITING` -> `FINAL_REVIEW` -> `READY_TO_UPLOAD` -> `PUBLISHED`
- **Tasks**: `PENDING` -> `IN_PROGRESS` -> `IN_REVIEW` -> `COMPLETED`

---

## 2. Frontend Badge vs Backend Status Mapping Matrix

| Entity Type | Backend Status String | UI Display Label | Visual Badge Style | Semantic Color Meaning |
| :--- | :--- | :--- | :--- | :--- |
| Question | `DRAFT` | Draft Question | `bg-slate-100 text-slate-700` | Initial authoring phase |
| Question | `VERIFIED` | Verified | `bg-emerald-100 text-emerald-700` | Academic signoff complete |
| Question | `IN_PRODUCTION` | In Production | `bg-blue-100 text-blue-700` | Linked video created |
| Question | `PUBLISHED` | Published Live | `bg-purple-100 text-purple-700` | Video broadcast active |
| Question | `REJECTED` | Rejection Logged | `bg-rose-100 text-rose-700` | Needs rework / improvement |
| Video | `SCRIPT_READY` | Script Ready | `bg-amber-100 text-amber-700` | Awaiting filming / talent |
| Video | `RECORDING` | Studio Filming | `bg-indigo-100 text-indigo-700`| Takes being captured |
| Video | `EDITING` | In Edit Bay | `bg-cyan-100 text-cyan-700` | Rough cut assembly |
| Video | `FINAL_REVIEW` | QC Review Queue | `bg-violet-100 text-violet-700`| Executive quality signoff |
| Video | `READY_TO_UPLOAD`| Packaging Ready | `bg-teal-100 text-teal-700` | Distribution ready |
| Video | `PUBLISHED` | Live on Channels | `bg-emerald-100 text-emerald-700`| Active broadcasts confirmed |
| System | `HEALTHY` | System Operational | `bg-emerald-500 rounded-full` | Google Sheets ping < 500ms |
| System | `DEGRADED` | Degraded Latency | `bg-amber-500 rounded-full` | Latency > 1500ms |
| System | `DOWN` | Connection Failed | `bg-rose-500 rounded-full` | Google API error / 500 |
