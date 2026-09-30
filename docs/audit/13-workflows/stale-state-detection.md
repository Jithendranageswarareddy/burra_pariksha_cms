# Stale State & Concurrency Race Detection

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 13 of 30  
**Document:** 23 of 30  

---

## 1. Google Sheets Concurrency Architecture

Google Sheets lacks native row versioning (`ETag` or `row_version`). When two users open the same video in separate browser tabs:
1. User A (QC Lead) approves the video (`READY_TO_UPLOAD`).
2. User B (Video Editor) re-uploads an audio fix and clicks Save Cut (`EDITED`).
3. If User B's request arrives 100ms after User A, User B's write **blindly overwrites User A's approval**, regressing the video back to `EDITED` without warning.

---

## 2. Cryptographic Version Hash Guard in Social Review

The only subsystem in BP-CMS that implements true optimistic concurrency protection is the **Social Review Engine** (`src/lib/services/social-review.service.ts:430–440`):
```typescript
const currentVersionHash = bundle.currentVersionHash;
if (input.versionHash && input.versionHash !== currentVersionHash) {
  const err = new Error(
    'Review package has been modified by an upstream change since you opened this review. Please refresh and review the updated package.'
  );
  (err as any).statusCode = 409; // HTTP Conflict
  throw err;
}
```

**Audit Finding:** This version hash pattern is completely absent from Questions, Videos, Scripts, and Content Masters, leaving 90% of the system exposed to silent concurrent overwrites.
