# Master Entity Lifecycle Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 35 of 51  

---

## 1. Formal Lifecycles Discovered

Every major business entity follows a distinct status lifecycle:

```
1. Question:      DRAFT -> GENERATED -> EDITING -> APPROVED -> [ARCHIVED]
                                        /
                            -> REJECTED -
2. Video:         NOT_STARTED -> QUEUED -> SCRIPT_REQUIRED -> SCRIPT_READY -> RECORDING
                  -> RECORDED -> EDITING -> EDITED -> FINAL_REVIEW -> READY_TO_UPLOAD
                  -> UPLOADED [TERMINAL] (or CANCELLED [TERMINAL] / ON_HOLD)
3. Script:        DRAFT -> REVISION_REQUIRED -> APPROVED
4. Thumbnail:     DRAFT -> PENDING_REVIEW -> APPROVED (or REJECTED)
5. Social Review: PENDING_REVIEW -> CHANGES_REQUESTED -> APPROVED (or STALE_REVISION_REQUIRED)
6. Publishing:    NOT_STARTED -> DRAFT -> SCHEDULED -> UPLOADED -> PUBLISHED (or FAILED)
7. Content Master:DRAFT -> ACTIVE -> READY_FOR_REVIEW -> APPROVED -> SCHEDULED -> PUBLISHED
                  -> COMPLETED [TERMINAL] (or ARCHIVED)
8. Assignment:    ASSIGNED -> IN_PROGRESS -> BLOCKED -> COMPLETED [TERMINAL] (or CANCELLED)
```
