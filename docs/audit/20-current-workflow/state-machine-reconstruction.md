# State Machine Reconstruction

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 16 of 41  

---

## 1. Detailed Reconstruction of Video State Machine

Defined in `src/lib/services/video.service.ts:59-75`:

```
NOT_STARTED
  ↓
QUEUED ──────────┬──────────────┬──────────────┐
  ↓               ↓              ↓              ↓
SCRIPT_REQUIRED  SCRIPT_READY  ON_HOLD      CANCELLED (Terminal)
  ↓               ↓
SCRIPT_READY     RECORDING
  ↓               ↓
RECORDING ──────→ RECORDED
                  ↓
                EDITING
                  ↓
                EDITED
                  ↓
                FINAL_REVIEW
                  ↓
                READY_TO_UPLOAD
                  ↓
                UPLOADED (Terminal)
```

### Transition Validation Rules:
1. Cannot transition out of `CANCELLED` (lines 158-160).
2. Cannot transition out of `UPLOADED` (lines 162-164).
3. Transitions must strictly exist in `VALID_VIDEO_TRANSITIONS` map.
