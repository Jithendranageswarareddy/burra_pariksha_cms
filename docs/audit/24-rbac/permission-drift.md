# Permission Drift Forensic Register

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 26 of 41  

---

## 1. Discovered Drift Anomalies

1. **Role Aliasing Drift:**
   - `SPEAKER` vs `STUDIO_PRESENTER`
   - `CONTENT_WRITER` vs `QUESTION_CREATOR`
   - `EDITOR` vs `VIDEO_EDITOR`
   - Code checks alternate between checking string literals and `UserRole` enum values.
2. **Multi-Role String Splitting:**
   - Some code splits comma-separated strings (`user.role.split(',')`), while newer interfaces use typed `user.roles: string[]`.
