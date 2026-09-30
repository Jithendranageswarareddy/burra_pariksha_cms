# Platform Adaptation State Machine Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 13 of 30  
**Document:** 12 of 30  

---

## 1. PlatformAdaptationStatus State Model

Defined in `src/types/index.ts:2556–2563`, `PlatformAdaptationStatus` manages platform-specific derivatives of content (e.g. YouTube Community Post, Instagram Carousel copy, LinkedIn summary).

### States
- `DRAFT`: Initial AI generated or manual draft.
- `IN_REVIEW`: Submitted to platform specialist.
- `APPROVED`: Approved for publishing on target channel.
- `READY_TO_PUBLISH`: Asset bundle compiled with aspect ratio and media files.
- `CHANGES_REQUIRED`: Reviewer noted character count or hashtag issues.
- `REJECTED`: Inappropriate tone or non-compliant format.

---

## 2. State Transition Flow

```
[DRAFT] ---> [IN_REVIEW] ---> [APPROVED] ---> [READY_TO_PUBLISH]
  ^               |
  |               +---------> [CHANGES_REQUIRED]
  |               |
  +---------------+---------> [REJECTED]
```

---

## 3. Disconnect from Main Publishing Engine

Forensic inspection reveals that while `PlatformAdaptationService` maintains full state transition machinery, the primary `PublishingService` in `src/lib/services/publishing.service.ts` does not query or enforce `PlatformAdaptationStatus === APPROVED` before executing YouTube or Instagram publishing calls. The primary publishing flow relies solely on its internal metadata payload, leaving adaptations as a disconnected sub-system.
