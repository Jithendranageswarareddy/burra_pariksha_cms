# Service-to-Service Dependencies & Invocation Chains

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 06 of 30  

---

## 1. Inter-Service Invocation Register

A forensic scan of import declarations across all 72 services identified **44 direct service-to-service dependencies**:

| Calling Service | Dependent Service | Method Called | Purpose of Invocation |
| :--- | :--- | :--- | :--- |
| `questionService` | `sequenceSafetyService` | `allocateNextId('Q')` | Ensure collision-free sequential question numbering |
| `questionService` | `auditService` | `logAction('CREATE_QUESTION')` | Record audit compliance trace in `AUDIT_LOG` |
| `videoService` | `sequenceSafetyService` | `allocateNextId('V')` | Allocate unique video production ID |
| `videoService` | `googleDriveService` | `verifyFileAccess(url)` | Validate presenter Google Drive take link |
| `videoService` | `auditService` | `logAction('RECORD_TAKE')` | Log take recording event |
| `publishingService`| `videoService` | `updateStatus(id, 'PUBLISHED')` | Advance video status upon live platform confirmation |
| `publishingService`| `platformAdaptationService`| `adaptHashtags(tags, platform)` | Reformat hashtags per platform rules |
| `planningService` | `taxonomyService` | `getTopicsBySubject(id)` | Populate syllabus options for curriculum batches |
| `copilotService` | `geminiService` | `chat(prompt, context)` | Dispatch user queries to Gemini 2.5 Pro |

---

## 2. Circular Dependency Verification
- **AST Scan Result**: **ZERO circular dependencies detected**.
- Dependencies flow strictly unidirectionally from higher-level domain orchestration services down to lower-level safety, sequence, and persistence adapters.
