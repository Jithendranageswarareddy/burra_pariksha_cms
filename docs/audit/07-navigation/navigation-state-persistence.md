# Client Navigation State Persistence Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 07 of 30  
**Document:** 23 of 27  

---

## 1. Persistence Mechanisms

To maintain user preferences and contextual workflows across page reloads and browser sessions, BP-CMS employs three persistence tiers:

---

## 2. Persistence Tiers Matrix

| Persistence Tier | Storage Mechanism | Tracked State Entity | Key / Parameter Name | Failure Fallback |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1: Browser Storage** | `localStorage` | Sidebar Collapsed Preference | `"burra_sidebar_collapsed"` | `false` (Expanded) |
| **Tier 1: Browser Storage** | `localStorage` | Auth Session Tokens / User | `"bp_auth_token"`, `"bp_user"` | Redirects to `/login` |
| **Tier 2: URL Parameters** | Browser Location | Active Production Workspace Tab | `?tab=` | `"overview"` |
| **Tier 2: URL Parameters** | Browser Location | Question Lifecycle Filter | `?status=` | `"ALL"` |
| **Tier 2: URL Parameters** | Browser Location | Curriculum Topic Filter | `?topic=` | None (All Topics) |
| **Tier 2: URL Parameters** | Browser Location | Search Query String | `?search=` | `""` (Empty String) |
| **Tier 3: React Context** | In-Memory (`Context`) | Active Production Stage | `currentStage` (1-15) | Initialized from video status |
| **Tier 3: React Context** | In-Memory (`Context`) | Stage Blocked Prerequisites | `stages: JourneyStage[]` | Computed from entity artifacts |

---

## 3. Resilience Assessment

1. **Storage Exception Safety**: `Layout.tsx` wraps `localStorage.getItem` and `setItem` in `try/catch` blocks, ensuring private browsing mode or storage quotas do not throw fatal exceptions.
2. **URL Bookmarkability**: Because all workspace tabs and filters live in URL query strings, operators can bookmark and share exact views with complete fidelity.
