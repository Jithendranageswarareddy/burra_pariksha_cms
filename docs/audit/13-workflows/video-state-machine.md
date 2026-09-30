# Video Production State Machine Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 13 of 30  
**Document:** 05 of 30  

---

## 1. VideoProductionStatus State Model

The video production lifecycle is the core operational engine of BP-CMS, defined across 13 states in `src/types/index.ts:39–54`.

### State Definitions
1. `NOT_STARTED`: Question approved; video entity uninstantiated or skeleton only.
2. `QUEUED`: Ingested into video production queue; waiting for script or filming assignment.
3. `SCRIPT_REQUIRED`: Scriptwriting pending; teleprompter script not yet written.
4. `SCRIPT_READY`: Script completed and approved; ready for camera rehearsal.
5. `RECORDING`: Filming in progress in studio.
6. `RECORDED`: Raw camera take uploaded to Google Drive.
7. `EDITING`: Video editor cutting footage, adding overlays, audio normalization.
8. `EDITED`: Rendered cut uploaded to Google Drive edited folder.
9. `FINAL_REVIEW`: QC lead conducting 12-point review.
10. `READY_TO_UPLOAD`: QC approved; waiting for distribution packaging.
11. `UPLOADED`: Published to YouTube/Instagram; terminal production state.
12. `ON_HOLD`: Temporarily suspended due to technical or talent blocker.
13. `CANCELLED`: Terminated; abandoned content piece.

---

## 2. Authoritative Transition Matrix (`src/lib/services/video.service.ts:59–125`)

| State | Allowed Target Transitions | Legal Exit Count | Is Terminal? |
| :--- | :--- | :---: | :---: |
| `NOT_STARTED` | `QUEUED` | 1 | No |
| `QUEUED` | `SCRIPT_REQUIRED`, `SCRIPT_READY`, `ON_HOLD`, `CANCELLED` | 4 | No |
| `SCRIPT_REQUIRED` | `SCRIPT_READY`, `ON_HOLD`, `CANCELLED` | 3 | No |
| `SCRIPT_READY` | `RECORDING`, `RECORDED`, `ON_HOLD`, `CANCELLED` | 4 | No |
| `RECORDING` | `RECORDED`, `EDITING`, `ON_HOLD`, `CANCELLED` | 4 | No |
| `RECORDED` | `EDITING`, `ON_HOLD`, `CANCELLED` | 3 | No |
| `EDITING` | `EDITED`, `FINAL_REVIEW`, `ON_HOLD`, `CANCELLED` | 4 | No |
| `EDITED` | `FINAL_REVIEW`, `READY_TO_UPLOAD`, `EDITING`, `ON_HOLD`, `CANCELLED` | 5 | No |
| `FINAL_REVIEW` | `READY_TO_UPLOAD`, `EDITING`, `ON_HOLD`, `CANCELLED` | 4 | No |
| `READY_TO_UPLOAD` | `UPLOADED`, `FINAL_REVIEW`, `ON_HOLD`, `CANCELLED` | 4 | No |
| `ON_HOLD` | `QUEUED`, `SCRIPT_REQUIRED`, `SCRIPT_READY`, `RECORDING`, `RECORDED`, `EDITING`, `EDITED`, `FINAL_REVIEW`, `READY_TO_UPLOAD`, `CANCELLED` | 10 | No |
| `CANCELLED` | *None* | 0 | **YES** |
| `UPLOADED` | *None* | 0 | **YES** |

---

## 3. Enforcement Implementation

Transition validity is enforced by `videoService.validateTransition(fromStatus, toStatus)` at `src/lib/services/video.service.ts:155–172`:
```typescript
public validateTransition(fromStatus: VideoProductionStatus, toStatus: VideoProductionStatus): void {
  if (fromStatus === toStatus) return;
  const allowed = VALID_VIDEO_TRANSITIONS[fromStatus] || [];
  if (!allowed.includes(toStatus)) {
    throw new ValidationError(
      `Illegal video production status transition from "${fromStatus}" to "${toStatus}". Allowed transitions: [${allowed.join(', ') || 'None (Terminal)'}]`
    );
  }
}
```

When this check fails, it throws a `ValidationError` with HTTP 400. However, multiple service methods bypass `validateTransition` entirely by directly calling `videosRepository.updateRecord()`.
