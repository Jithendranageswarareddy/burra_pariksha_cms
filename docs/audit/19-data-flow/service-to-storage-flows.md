# Service-to-Storage Data Flows

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 09 of 35  

---

## 1. Service Layer Interaction Patterns

The service layer (`src/lib/services/`) contains 72 domain services governing business logic.

### Dominant Service-to-Storage Patterns:
1. **Single Repository Delegation:** Simple CRUD operations delegate directly to a single repository class (e.g. `TaxonomyService` -> `CategoriesRepository`).
2. **Multi-Repository Orchestration:** Lifecycle actions trigger sequential cascading writes across 2 to 5 repositories (e.g. `VideoService` writes to `VideosRepository`, `QuestionVideosRepository`, `QuestionsRepository`, `WorkflowService`, and `AuditService`).
3. **Dual-Tier Storage Bridging:** Media services bridge binary files to Google Drive and metadata rows to Google Sheets (e.g. `handleVideoUploadRoute` -> `GoogleDriveService.uploadFile()` + `VideosRepository.updateRecord()`).
4. **Volatile Process Memory Usage:** Services maintain localized in-memory Maps for caching, mutexes, and session state (`inFlightRegistry`, `draftCache`, `activeTokens`, `suggestionStore`).
