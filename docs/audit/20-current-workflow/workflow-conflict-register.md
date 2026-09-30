# Workflow Conflict Register

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 37 of 41  

---

## 1. Master Register of Workflow Conflicts

| Conflict ID | Workflow Component A | Workflow Component B | Nature of Conflict | Severity | Current Status |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **WF-CONF-01** | `VALID_VIDEO_TRANSITIONS` | `RecordingWorkspace.tsx` | Direct transition forbidden; bypassed via 3-step chained calls | **CRITICAL** | ACTIVE CODE BYPASS |
| **WF-CONF-02** | `Video.status` | `Question.videoStatus` | Non-atomic best-effort sync creates permanent status divergence | **CRITICAL** | ACTIVE RISK |
| **WF-CONF-03** | Draft ID in Route | Canonical ID in Sheets | Deleting draft without route replacement throws 404 on page reload | **HIGH** | REPRODUCIBLE BUG |
| **WF-CONF-04** | `Publishing.status` | `Video.status` | Marking video published on platforms does not transition video to UPLOADED | **HIGH** | INCOMPLETE CASCADE |
| **WF-CONF-05** | Canonical 15 Steps | 7-Workspace UI Tabs | 15 stages compressed into 7 workspace tabs without explicit 1:1 sub-routes | **MEDIUM** | CONCEPTUAL MISMATCH |
| **WF-CONF-06** | Stage 12 Platform Sync | Real Social APIs | Automated cross-platform sync is stubbed in UI | **MEDIUM** | PARTIAL IMPLEMENTATION|
