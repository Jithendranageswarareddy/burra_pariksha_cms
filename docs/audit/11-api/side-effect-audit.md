# Endpoint Side-Effect Forensic Audit (19 Multi-Effect Endpoints)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 22 of 30  

---

## 1. Multi-Side-Effect Architecture

Because BP-CMS uses Google Sheets as a relational database, complex actions frequently require updating multiple worksheets sequentially.
An audit identified **19 endpoints that trigger 3 or more distinct side-effect writes**.

---

## 2. Top Multi-Side-Effect Endpoints

### 1. `POST /api/questions` (Create Question)
1. Allocates sequence ID via `sequenceSafetyService`
2. Appends row to `QUESTIONS` worksheet
3. Creates linked master record in `CONTENT_MASTERS` worksheet
4. Appends transaction record to `AUDIT_LOG` worksheet
*(4 sequential Sheet writes; vulnerable to partial save if Step 3 fails)*

### 2. `POST /api/videos/:id/final-qc` (QC Signoff)
1. Updates video status to `READY_TO_PUBLISH` in `VIDEOS`
2. Updates workflow conveyor state in `WORKFLOW`
3. Generates publishing task in `ASSIGNMENTS`
4. Appends signoff record to `AUDIT_LOG`
*(4 sequential Sheet writes)*

### 3. `POST /api/recovery/restore` (Snapshot Restore)
1. Truncates/clears all 18 active worksheets
2. Writes hundreds of restored rows across 18 tabs
3. Records restore completion event to audit archive
*(19+ sequential Sheet operations; critical failure risk)*
