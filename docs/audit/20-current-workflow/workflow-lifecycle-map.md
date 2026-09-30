# Workflow Lifecycle Mapping

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 33 of 41  

---

## 1. Unified 15-Stage Lifecycle State Matrix

```
Stage 01: [DRAFT] (QuestionDraft)
   ↓ (Approval Gate: MultiLayerVerificationEngine)
Stage 02: [APPROVED] (Question) + [QUEUED] (Video)
   ↓
Stage 03: [SCRIPT_READY] (Script + Video)
   ↓
Stage 04: [RECORDING] (Video)
   ↓
Stage 05: [RECORDED] (Video + MediaAsset in Drive)
   ↓
Stage 06: [EDITING] -> [EDITED] (Video + Master Render)
   ↓
Stage 07: [FINAL_REVIEW] -> [READY_TO_UPLOAD] (Master QC Certified)
   ↓
Stage 08: [APPROVED] (Thumbnail linked to Drive)
   ↓
Stage 09: [APPROVED] (SocialReviewPackage in 9:16 simulator)
   ↓
Stage 10: [SCHEDULED] (Publishing slots configured)
   ↓
Stage 11: [PUBLISHED] / [UPLOADED] (Live URLs validated)
   ↓
Stage 12: [SYNCED] (Cross-platform character limits verified)
   ↓
Stage 13: [RECORDED] (Social Analytics metric snapshots)
   ↓
Stage 14: [ANALYZED] (Audience retention & drop-off diagnosed)
   ↓
Stage 15: [SYNTHESIZED] (AI Strategy recommendation loopback to Stage 01)
```
