# Reference Content Item Forensic Specification

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 23 of 35  
**Document:** 02 of 35  

---

## 1. Content Item Identification & Availability

A live read of the Google Sheets and in-memory repositories confirms the presence of an active canonical production item spanning multiple lifecycle worksheets:

| Attribute | Verified Runtime Value | Source Tab / Store |
| :--- | :--- | :--- |
| **Canonical Content ID** | `BP-CNT-000001` | `CONTENT_MASTERS` |
| **Canonical Question ID** | `BP-Q-000001` | `QUESTIONS` |
| **Associated Video ID** | `BP-V-000001` | `VIDEOS` |
| **Associated Script ID** | `BP-S-000001` | `SCRIPTS` |
| **Associated Publishing ID** | `PUB-000001` | `PUBLISHING` |
| **Associated Drive File ID** | `1hE5dPcuPByYdUogk5AEKEO7JSKeK_9EK` | Google Drive |
| **Preceding Draft ID** | `BP-DFT-529472-5SOD` | `QUESTION_DRAFTS` (Deleted on approval) |

---

## 2. Runtime Entity State Inspection

```json
{
  "BP-Q-000001": {
    "id": "BP-Q-000001",
    "status": "APPROVED",
    "videoStatus": "QUEUED",
    "contentId": "BP-CNT-000001"
  },
  "BP-V-000001": {
    "id": "BP-V-000001",
    "contentId": "BP-CNT-000001",
    "contentMasterId": "BP-CNT-000001",
    "questionId": "BP-Q-000001",
    "title": "Short: ఒక షర్ట్ అసలు ధర ₹1000. దాని ధరను 20% పెంచారు...",
    "status": "QUEUED",
    "priority": "NORMAL",
    "targetDurationSeconds": 45,
    "assignedHost": "Jithendra Reddy",
    "driveFileId": "1hE5dPcuPByYdUogk5AEKEO7JSKeK_9EK",
    "fileName": "vd1.2.mp4",
    "version": 2,
    "finalRenderValidationStatus": "INVALID"
  },
  "PUB-000001": {
    "id": "PUB-000001",
    "contentId": "BP-CNT-000001",
    "videoId": "BP-V-000001",
    "questionId": "BP-Q-000001",
    "thumbnailReady": false,
    "pinnedCommentReady": true,
    "completedPlatformsCount": 0,
    "totalPlatformsCount": 3
  }
}
```

---

## 3. Forensic Evaluation

This reference item provides exceptional forensic coverage:
1. It proves that the conversion from Draft to Canonical Question, Content Master, and Video succeeded in production.
2. It proves that script generation and publishing initialization executed.
3. It demonstrates active state divergence: `BP-V-000001` holds status `QUEUED` while having physical binary `vd1.2.mp4` attached and `PUB-000001` initialized.
