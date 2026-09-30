# Workflow State Authorization Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 20 of 41  

---

## 1. State-Gated Actions

- **QC Approval:** Allowed only when `Video.status === 'EDITED'`.
- **Publishing Schedule:** Allowed only when `Publishing.status === 'DRAFT'` and Gate D criteria pass.
- **Direct Editing Bypass:** As proven in Step 23, attempting to enter `EDITING` directly from `QUEUED` is rejected by state machine validation.
