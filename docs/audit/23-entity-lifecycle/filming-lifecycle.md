# Lifecycle Stage 04: Filming & Teleprompter

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 23 of 35  
**Document:** 07 of 35  

---

## 1. Transition Details

| Attribute | Forensic Value |
| :--- | :--- |
| **Origin Entity** | Approved `Script` (`BP-S-000001`) & `Video` (`BP-V-000001`) |
| **Action** | "Start Filming" / Launch Teleprompter |
| **Resulting Entity** | Filming Session / Updated `Video` |
| **State** | `Video.status = RECORDING` |
| **Page / Component** | `VideoDetailPage.tsx?tab=recording` -> `RecordingWorkspace.tsx` |
| **Active Route** | `/videos/:id?tab=recording` |
| **REST API** | `PATCH /api/videos/:id/status` |
| **Service Layer** | `video.service.ts:transitionStatus('RECORDING')` |
| **Repository Layer** | `videosRepository.updateRecord()` |
| **Authoritative Storage**| Google Sheets `VIDEOS` worksheet |
| **Next Entity / State** | Raw Video Binary Upload |

---

## 2. Forensic Findings

1. **Teleprompter Execution:** `TeleprompterModal.tsx` consumes the script sections (Hook, Problem, Solution, CTA) and provides variable scroll pacing.
2. **Host Assignment:** `BP-V-000001` holds `assignedHost: 'Jithendra Reddy'`.
3. **UI Conflation:** Stages 04 (Filming) and 05 (Raw Video Upload) are physically colocated in `RecordingWorkspace.tsx`.
