# Service Coupling Forensic Evaluation

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 30 of 30  

---

## 1. Architectural Coupling Metrics

- **Afferent Coupling (Fan-in)**: Number of consumers depending on a service. Highest: `googleSheetsService` (58), `auditService` (32), `videoService` (12).
- **Efferent Coupling (Fan-out)**: Number of services a service depends upon. Highest: `publishingService` (8), `dataIntegrityService` (6), `videoService` (5).
- **Coupling Classification**:
  - **Cleanly Decoupled**: 52 services have an efferent coupling of <= 2.
  - **Highly Coupled**: 6 services have an efferent coupling >= 5.
