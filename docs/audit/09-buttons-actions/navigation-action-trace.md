# Navigation Action Forensic Trace

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 09 of 30  
**Document:** 19 of 30  

---

## 1. Action-to-Navigation Flow

This document audits the exact navigation execution that follows every mutating and non-mutating action, verifying whether navigation occurs before or after persistence success.

---

## 2. Navigation Action Trace Register

| Action ID | Triggering Button | Pre-Navigation Mutation | Navigation Execution | Destination Route | Navigation Timing |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `ACT-AUTH-01` | "Sign In" | Session token saved to localStorage | `navigate(from || "/")` | Landing Route | **AFTER SUCCESS** |
| `ACT-QSTU-02` | "Save & Continue" | Question row written to Sheets | `navigate(`/questions/${id}/verify`)` | Stage 02 View | **AFTER SUCCESS** |
| `ACT-QVER-01` | "Approve Question"| Question verified + Video created | `navigate(`/videos/${vid}?tab=script`)`| Stage 03 Workspace | **AFTER SUCCESS** |
| `ACT-QVER-02` | "Reject Question" | Rejection reason written to Sheets | `navigate("/questions")` | Question Library | **AFTER SUCCESS** |
| `ACT-PUB-01` | "Schedule Release"| Schedule timestamp saved | `navigate("/publishing")` | Publishing Manager | **AFTER SUCCESS** |
| `ACT-ERR-01` | "Go Back" | None | `navigate(-1)` | Browser History | **IMMEDIATE (Risk)**|
| `ACT-ERR-02` | "Return Home" | None | `navigate("/dashboard")` | Dashboard | **IMMEDIATE** |
| `ACT-REST-01` | "Cancel Preflight"| None | `navigate("/dashboard")` | Dashboard | **IMMEDIATE** |
