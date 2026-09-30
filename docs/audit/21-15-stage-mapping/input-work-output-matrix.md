# Input -> Work -> Output Cross-Stage Matrix

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 21 of 30  
**Document:** 19 of 31  

---

## 1. Input-Work-Output Transform Pipeline

| Stage | Input Entity / Data | Work Performed | Output Entity / Data | Persistent State |
| :---: | :--- | :--- | :--- | :--- |
| **01** | Topic Taxonomy + AI Prompt | 4-option generation & math proof drafting | `QuestionDraft` (`BP-DFT-`) | `QuestionStatus.DRAFT` |
| **02** | `QuestionDraft` | 10-point pedagogical audit + sequence minting | `Question` (`BP-Q-`) + `Video` (`BP-V-`) | `APPROVED` + `QUEUED` |
| **03** | Approved Question | Presenter script drafting with hook/CTA | `Script` (`BP-S-`) + `SCRIPT_VERSIONS` | `SCRIPT_READY` |
| **04** | Script Text | Interactive auto-scroll prompter filming session | Filming notes & take metadata | `RECORDING` |
| **05** | Camera MP4 file | Google Drive streaming upload & checksum | `MediaAsset` (`ASSET-`) + `driveFileId` | `RECORDED` |
| **06** | Raw MP4 + Script | Master cut editing & Telugu caption burn | Final render cut in Google Drive | `EDITED` |
| **07** | Master render cut | 6-point Master QC certification sign-off | Certified Video Project | `READY_TO_UPLOAD` |
| **08** | Question hook | 1080x1920 thumbnail upload & 5MB check | `Thumbnail` (`BP-T-`) + Drive link | `APPROVED` |
| **09** | Video + Thumbnail | 9:16 smartphone simulator & packaging sign-off | `SocialReviewPackage` (`SR-`) | `APPROVED` |
| **10** | Approved Social Package | Gate D pre-publish check & timestamp slot | Scheduled release configuration | `SCHEDULED` |
| **11** | Live platform post URLs| Regex URL check & completed count tally | Verified live publication record | `PUBLISHED` |
| **12** | Live published post | Character limit & audio adaptation audit | Synchronized package log | `SYNCED` (Simulated) |
| **13** | Audience metrics | Metric ingestion & snapshot row creation | `SocialAnalyticsRecord` (`ANL-`) | Metric row active |
| **14** | Multi-row snapshots | Deterministic aggregation & drop-off curves | Diagnostic dashboard views | Computed |
| **15** | Aggregated diagnostics | Gemini AI prompt execution & strategy advisory | `SocialPerfIntRecord` (`INT-`) | `ADVISORY` |
