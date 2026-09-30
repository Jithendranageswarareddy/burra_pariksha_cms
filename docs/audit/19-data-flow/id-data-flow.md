# Identifier Data Flows & Sequence Minting

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 22 of 35  

---

## 1. Primary Identifier Schemes & Formats

BP-CMS enforces standardized business identifier formats:

| Entity | Identifier Format | Example | Generation Mechanism | Mutex Protection |
| :--- | :--- | :--- | :--- | :--- |
| **Question** | `BP-Q-######` | `BP-Q-000001` | `IdService.allocateQuestionId()` | In-memory Promise chain + `SEQUENCES` sheet |
| **Question Draft** | `BP-DFT-######-XXXX` | `BP-DFT-172890-A4B2` | Timestamp slice + random alphanumeric | Client / Service random generation |
| **Content Master** | `BP-CNT-######` | `BP-CNT-000001` | `IdService.allocateContentMasterId()`| In-memory Promise chain + `SEQUENCES` sheet |
| **Video** | `BP-V-######` | `BP-V-000001` | `IdService.allocateVideoId()` | In-memory Promise chain + `SEQUENCES` sheet |
| **Script** | `BP-S-######` | `BP-S-000001` | `IdService.allocateScriptId()` | In-memory Promise chain + `SEQUENCES` sheet |
| **Script Version** | `BP-S-######-V#` | `BP-S-000001-V1` | Script ID + version counter | Appended on script update |
| **Thumbnail** | `BP-T-######` | `BP-T-000001` | `IdService.allocateThumbnailId()` | In-memory Promise chain + `SEQUENCES` sheet |
| **Thumbnail Version**| `BP-T-######-V#` | `BP-T-000001-V1` | Thumbnail ID + version counter | Appended on thumbnail update |
| **Pinned Comment** | `BP-PIN-######` | `BP-PIN-000001` | `IdService.allocatePinnedCommentId()`| In-memory Promise chain + `SEQUENCES` sheet |
| **User** | `USR-###` | `USR-001` | Seeded / Admin manual creation | Static sequence |
| **Drive File ID** | Alphanumeric (Google) | `1ay-prfhC8jx... ` | Google Drive API v3 | Google Infrastructure |

### Forensic Examination of Sequence Mutex Collision:
`SequencesRepository.allocateSequence()` guards against concurrent counter reads using an in-memory queue:
```typescript
private sequenceLockQueue: Map<string, Promise<any>> = new Map();
```
**Finding:** This lock is effective ONLY within a single Node.js process. If two Cloud Run containers simultaneously allocate a Question ID, both can read the identical counter value from the `SEQUENCES` worksheet, minting duplicate IDs!
