# Service Cohesion Forensic Evaluation

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 29 of 30  

---

## 1. Cohesion Ratings across Services

Cohesion measures how closely related the functions within a single service are:
- **HIGH COHESION (48 services, 66.7%)**: All methods operate on a single entity type and bounded context (e.g. `TaxonomyService`, `ScriptService`, `ThumbnailService`, `AuthService`).
- **MODERATE COHESION (16 services, 22.2%)**: Methods operate on a primary entity plus related workflow tasks (e.g. `QuestionService`, `AssignmentService`).
- **LOW COHESION (8 services, 11.1%)**: Methods span completely unrelated business domains, combining analytics, formatting, external APIs, and cross-sheet repairs.
