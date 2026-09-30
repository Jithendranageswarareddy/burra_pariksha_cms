# Google Sheets Action Trace

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 09 of 30  
**Document:** 14 of 30  

---

## 1. Google Sheets I/O Architecture

All persistence actions route server-side through `src/lib/google-sheets/client.ts`. The service account identity performs transactional writes using batch updates and row appending.

---

## 2. Action to Worksheet Write Mapping

| Action ID | Worksheet Name | Row Key Column | Appended / Updated Columns | Sequence Lock Used? |
| :--- | :--- | :--- | :--- | :---: |
| `ACT-QSTU-02` | `Questions` | `question_id` (`BP-Q-*`) | Statement, Options, Answer, Explanation, Status, Topic, Difficulty | YES (`sequenceSafetyService`) |
| `ACT-QVER-01` | `Videos` | `video_id` (`BP-VID-*`) | Linked Question ID, Status (`SCRIPT_READY`), Stage (3), CreatedAt | YES (`sequenceSafetyService`) |
| `ACT-SCPT-01` | `Scripts` | `script_id` (`BP-SCP-*`) | Spoken Script Text, Word Count, Estimated Duration, Status | NO |
| `ACT-REC-01` | `Videos` | `video_id` | Raw Video Drive URL, Selected Best Take, Presenter Notes | NO |
| `ACT-EDIT-01` | `Videos` | `video_id` | Rough Cut Drive URL, Status (`FINAL_REVIEW`), Edit Notes | NO |
| `ACT-QC-01` | `Videos` | `video_id` | Status (`READY_TO_UPLOAD`), QC Checklist Bitmask, Approver ID | NO |
| `ACT-THUM-01` | `Thumbnails` | `thumbnail_id` | Drive File ID, Resolution, Text Hook, Contrast Score, Status | YES |
| `ACT-SOC-01` | `SocialReviews`| `review_id` | Review Status (`APPROVED`), Signoff Timestamp, Reviewer Notes | NO |
| `ACT-PUB-01` | `Publishing` | `publish_id` | Scheduled Release Time, Target Channels, Live Links | YES |
