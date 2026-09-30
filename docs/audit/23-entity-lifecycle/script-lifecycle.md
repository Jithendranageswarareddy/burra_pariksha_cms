# Lifecycle Stage 03: Audience Script

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 23 of 35  
**Document:** 06 of 35  

---

## 1. Transition Details

| Attribute | Forensic Value |
| :--- | :--- |
| **Origin Entity** | Approved `Question` (`BP-Q-000001`) & Queued `Video` (`BP-V-000001`) |
| **Action** | "Save Script" |
| **Resulting Entity** | `Script` (`BP-S-000001`) |
| **State** | `Video.status = SCRIPT_READY` (or remains `QUEUED`) |
| **Page / Component** | `VideoDetailPage.tsx?tab=script` -> `ScriptWorkspace.tsx` |
| **Active Route** | `/videos/:id?tab=script` |
| **REST API** | `POST /api/scripts` |
| **Service Layer** | `script.service.ts:saveScript()` |
| **Repository Layer** | `scriptsRepository.appendRecord()`, `scriptVersionsRepository.appendRecord()` |
| **Authoritative Storage**| Google Sheets `SCRIPTS` and `SCRIPT_VERSIONS` |
| **Next Entity / State** | `Video` -> Filming / Teleprompter Workspace |

---

## 2. Forensic Findings

1. **Foreign Key Integrity:** The `Script` record stores `questionId: 'BP-Q-000001'` and references the canonical Question.
2. **Telugu Call-to-Action:** Script structure enforces the Telugu comment prompt: `"మీ సమాధానం ఏదో కామెంట్ చేయండి"`.
3. **Workspace Compression:** Stage 03 has no dedicated URL route; it lives as a tab query parameter on `VideoDetailPage.tsx`.
