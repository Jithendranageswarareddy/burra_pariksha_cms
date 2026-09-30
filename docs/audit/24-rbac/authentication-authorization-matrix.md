# Layered Authentication & Authorization Matrix

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 37 of 41  

---

| System Layer | Authentication Enforced? | Authorization Enforced? | Mechanism | Authority |
| :--- | :---: | :---: | :--- | :--- |
| **Frontend Root** | **YES** | Partial (UI hiding) | `AuthContext`, `AppRoutes` | Browser State |
| **Page Navigation** | **YES** | **NO** | Mounts view if logged in | Client Router |
| **REST API Router** | **YES** | **YES** | `requireAuth`, `requireRole` | HMAC Token |
| **Service Layer** | **YES** | **YES** | `objectAuthService`, Role checks | Domain Code |
| **Repository Layer**| **NO** | **NO** | Pure DAO data passthrough | None |
| **Google Sheets** | Server-Side | Service Account | GCP IAM Service Account Key | Google Cloud |
| **Google Drive** | Server-Side | OAuth / Service Account| Refresh Token / IAM | Google Cloud |
