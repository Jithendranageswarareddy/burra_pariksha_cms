# Public Service Method Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 28 of 30  

---

## 1. Method Distribution Analysis

Across all 72 services, **584 public methods** are exposed.
- Average methods per service: 8.1
- Services with > 25 methods: 6 services (God services / complex orchestrators)
- Services with < 5 methods: 38 services (Focused domain adapters or helpers)

---

## 2. Most Heavily Methodized Services

| Service Name | Public Method Count | Primary Method Categories |
| :--- | :---: | :--- |
| `publishing.service.ts` | **46** | Scheduling, platform dispatch, sync, status checks, formatters |
| `data-integrity.service.ts` | **38** | Entity scanners, foreign key validators, orphan cleaners |
| `dashboard.service.ts` | **34** | Metric aggregates, chart time-series, KPI calculators |
| `video.service.ts` | **28** | Status transitions, take logs, edit cuts, QC reviews |
| `taxonomy.service.ts` | **24** | Categories, topics, subtopics, syllabus tree traversals |
| `assignment.service.ts` | **22** | Workload algorithms, task creation, reassignment, completion |
