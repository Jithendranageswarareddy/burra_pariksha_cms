# UI Refresh & State Invalidation Forensic Trace

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 09 of 30  
**Document:** 18 of 30  

---

## 1. UI Refresh Mechanics

When an action completes its mutation, the frontend must refresh its view to reflect the updated backend state. BP-CMS employs four UI update patterns:
1. **Immediate Programmatic Navigation**: Navigates away to the next stage workspace, triggering a fresh mount fetch.
2. **Local Component State Re-fetch**: Invokes a local `fetchData()` or `loadQuestions()` helper.
3. **Context Broadcast**: Updates `ProductionJourneyContext` state in-memory.
4. **Optimistic Updates**: Immediately updates UI state before API confirms (used in checkbox toggles).

---

## 2. Action UI Refresh Register

| Action ID | Triggering Action | Post-Action UI Refresh Mechanism | Stale UI Risk? | Refresh Reliability |
| :--- | :--- | :--- | :---: | :---: |
| `ACT-QSTU-02` | Save Question | Navigates to `/questions/:id/verify` | NO (Mount fetch) | 100% |
| `ACT-QVER-01` | Approve Question | Navigates to `/videos/:id?tab=script` | NO (Mount fetch) | 100% |
| `ACT-QVER-02` | Reject Question | Navigates to `/questions` with refetch | NO | 100% |
| `ACT-SCPT-01` | Approve Script | `setSearchParams({ tab: "recording" })` | **LOW (Tab remounts)** | 95% |
| `ACT-REC-01` | Save Best Take | Local state update (`takes`) | NO | 100% |
| `ACT-QC-01` | Approve Cut | `setSearchParams({ tab: "thumbnail" })` | **LOW (Tab remounts)** | 95% |
| `ACT-TEAM-01` | Reassign Task | Calls `loadWorkload()` on modal dismiss | NO | 100% |
| `ACT-SETT-01` | Save Taxonomy | None (User must manually navigate away) | **HIGH (Stale tree)** | **60% (UI-026)** |
