# Workflow Execution Data Flows

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 22 of 41  

---

## 1. Step-by-Step Execution Chains

Every stage transition follows an enforced architectural pattern:
```
USER CLICK
  ↓
FRONTEND COMPONENT (e.g. RecordingWorkspace)
  ↓
API CLIENT BRIDGE (apiClient.updateVideoStatus)
  ↓
EXPRESS ROUTE (PATCH /api/videos/:id/status)
  ↓
AUTH & PERMISSIONS (requireAuth + verifyVideoRole)
  ↓
DOMAIN SERVICE (VideoService.transitionStatus)
  ↓
STATE MACHINE VALIDATION (VALID_VIDEO_TRANSITIONS check)
  ↓
PRIMARY REPOSITORY (videosRepository.updateRecord)
  ↓
SECONDARY SYNC (questionsRepository.updateRecord videoStatus) [UNSAFE]
  ↓
AUDIT & WORKFLOW (workflowService.recordTransition + auditService.log)
  ↓
HTTP 200 RESPONSE
  ↓
REACT COMPONENT REFRESH & NOTIFICATION
```
