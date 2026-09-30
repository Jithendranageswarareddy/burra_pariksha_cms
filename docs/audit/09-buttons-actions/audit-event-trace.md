# Audit Event Forensic Trace

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 09 of 30  
**Document:** 17 of 30  

---

## 1. Audit Logging Subsystem

System auditing is managed by `src/lib/services/audit.service.ts`. All critical mutations generate an immutable entry in the `AuditLogs` worksheet.

---

## 2. Action to Audit Event Mapping

| Action ID | Event Type String | Recorded Actor | Event Payload Recorded | Target Worksheet | Audit Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `ACT-AUTH-01` | `USER_LOGIN` | `user.id` / `user.email` | IP Address, UserAgent, Role | `AuditLogs` | **CONFIRMED** |
| `ACT-QSTU-02` | `QUESTION_CREATED` | `author.id` | Question ID, Topic, Difficulty | `AuditLogs` | **CONFIRMED** |
| `ACT-QVER-01` | `QUESTION_VERIFIED` | `reviewer.id` | Question ID, Video ID generated | `AuditLogs` | **CONFIRMED** |
| `ACT-QVER-02` | `QUESTION_REJECTED` | `reviewer.id` | Question ID, Rejection Reason | `AuditLogs` | **CONFIRMED** |
| `ACT-SCPT-01` | `SCRIPT_APPROVED` | `lead.id` | Video ID, Script Version # | `AuditLogs` | **CONFIRMED** |
| `ACT-QC-01` | `VIDEO_QC_PASSED` | `reviewer.id` | Video ID, Checklist Score (12/12) | `AuditLogs` | **CONFIRMED** |
| `ACT-PUB-01` | `BROADCAST_SCHEDULED`| `publisher.id` | Video ID, Datetime, Target Channels | `AuditLogs` | **CONFIRMED** |
| `ACT-REST-01` | `DISASTER_RESTORE` | `admin.id` | Snapshot ID, Checksum, Records Restored | `AuditLogs` | **CONFIRMED** |
| `ACT-TEAM-01` | `TASK_REASSIGNED` | `lead.id` | Assignment ID, Old User, New User | `AuditLogs` | **CONFIRMED** |
