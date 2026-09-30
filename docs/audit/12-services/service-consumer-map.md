# Service Consumer Mapping Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 04 of 30  

---

## 1. Consumer Types Overview

Services are consumed across three distinct architectural tiers:
1. **API Controllers (`src/server/routes.ts`)**: 58 services are called directly by Express route handlers.
2. **Inter-Service Consumers**: 32 services call other domain services (orchestration chains).
3. **Frontend Indirect Callers**: Components invoking services via HTTP fetch requests.

---

## 2. Top Services by Consumer Count

| Service Name | API Routes Consuming | Other Services Consuming | UI Pages Depending On | Architectural Centrality |
| :--- | :---: | :---: | :---: | :--- |
| **`googleSheetsService`** | 0 (Mediated) | 58 | 31 (Indirect) | **HIGHEST (Core DB Adapter)** |
| **`videoService`** | 32 | 12 | 14 | **CRITICAL (Production Core)** |
| **`questionService`** | 21 | 8 | 8 | **CRITICAL (Pedagogy Core)** |
| **`auditService`** | 1 (Direct) | 32 | 4 (Indirect) | **HIGH (Audit Hub)** |
| **`publishingService`** | 9 | 6 | 6 | **HIGH (Release Hub)** |
| **`assignmentService`** | 11 | 4 | 5 | **HIGH (Workload Hub)** |
| **`taxonomyService`** | 8 | 6 | 4 | **HIGH (Syllabus Hub)** |
| **`geminiService`** | 0 (Mediated) | 7 | 8 (Indirect) | **HIGH (AI Provider)** |
