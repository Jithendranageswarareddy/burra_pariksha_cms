# Stale Data Analysis

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 27 of 35  

---

## 1. Stale Data Scenarios & Latency Windows

| Stale Data Scenario | Authoritative Source | Stale Copy Location | Stale Window | User Impact | Detection / Mitigation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Concurrent Sheet Read** | Google Sheets API | `GoogleSheetsClient.rowCache` | 0 to 2,500 ms | User sees data written <2.5s ago by another user | Automatic TTL expiry |
| **Multi-Container Cache** | Google Sheets API | Cloud Run Container B RAM | Up to 2,500 ms | Container B serves stale row while Container A updated | Inter-container cache synchronization absent |
| **Frontend Form Tab** | Backend Sheet Record | Browser `useState` | Indefinite until reload | User overwrites remote updates with stale form submit | No optimistic concurrency or ETag check |
| **Denormalized Taxonomy**| `TOPICS` / `SUBTOPICS` | `Question.topicName` | Permanent until re-save | Renamed topic name not reflected on historical questions | Manual migration script required |
| **Publishing Status** | Social Platform API | `PUBLISHING` Sheet | Until manual status update | Video appears un-published in CMS when live on YouTube | Manual sync or webhook needed |
