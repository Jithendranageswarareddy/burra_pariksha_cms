# Five-Stage Workflow Remnants

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 08 of 41  

---

## 1. Discovered 5-Stage Remnants in Codebase

Early iterations of BP-CMS organized content creation into 5 macro phases:
1. Question Creation
2. Script Writing
3. Video Recording
4. Post-Production Editing
5. Publishing

### Discovered Code References:
- **`src/lib/services/phase12-workflow.service.ts`:** Retains helper functions that group production steps into 5 high-level buckets for executive reporting.
- **Service Header Comments:** Phase 2 through Phase 6 headers (`id.service.ts`, `taxonomy.service.ts`, `question.service.ts`, `video.service.ts`, `publishing.service.ts`) reflect this 5-stage evolutionary lineage.
- **Active Status:** LEGACY CONCEPTUAL MAPPING — superseded by the canonical 15-stage workflow, but still active in dashboard aggregation helpers.
