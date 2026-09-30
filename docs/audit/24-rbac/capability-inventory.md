# Capability Inventory Forensic Register

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 07 of 41  

---

## 1. Discovered System Capabilities

While permissions are evaluated primarily via discrete role checks and `objectAuthService` rules, the following 16 operational capabilities exist across the codebase:

1. `question.draft`: Create and save question drafts in `QUESTION_DRAFTS`.
2. `question.verify`: Execute 10-point pedagogical audit and approve drafts to canonical `QUESTIONS`.
3. `script.author`: Write and revise 45–60s short-form presenter scripts.
4. `video.film`: Execute teleprompter session and log camera takes.
5. `video.upload_raw`: Ingest raw camera MP4 binary to Google Drive.
6. `video.edit`: Produce master cut, burn Telugu subtitles, and update video duration.
7. `video.qc_certify`: Execute 6-point QC inspection and approve to `READY_TO_UPLOAD`.
8. `thumbnail.upload`: Upload 1080x1920 image to Drive and set `thumbnailReady`.
9. `social.review`: Review 9:16 smartphone simulator, approve tags and pinned comments.
10. `publishing.schedule`: Execute Gate D pre-publish check and schedule release slots.
11. `publishing.publish`: Ingest live platform URLs and record published status.
12. `platform.sync`: Review cross-platform adaptation limits.
13. `analytics.ingest`: Record 24h / 7d audience performance snapshots.
14. `analytics.diagnose`: View retention curves and drop-off diagnostics.
15. `intelligence.synthesize`: Generate Gemini AI flywheel recommendations.
16. `admin.recover`: Execute full snapshot backups, emergency rollbacks, and entity restoration.
