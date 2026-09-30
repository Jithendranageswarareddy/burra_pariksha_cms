# Google Drive Permissions & ACL Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 21 of 40  

---

## 1. OAuth Scopes & Drive Access Rights

Drive connectivity is authorized via Google OAuth 2.0 with the following requested scopes:
- `https://www.googleapis.com/auth/drive.file` (Create and access files created or opened by the app)
- `https://www.googleapis.com/auth/drive` (Full read/write access to Google Drive files and folders)

---

## 2. Decoupling of Drive ACLs vs Application RBAC

A fundamental architectural finding: **GOOGLE DRIVE PERMISSIONS ARE COMPLETELY DECOUPLED FROM APPLICATION RBAC.**

```
[Burra Pariksha Application Layer]
  - Role-Based Access Control (ADMIN, CONTENT_MANAGER, VIDEO_EDITOR, PRESENTER)
  - Fine-grained object permissions (objectAuthService.canAccessVideo)
  - Granular API routes (/api/videos/:id/stream guarded by requireAuth)

                ║ (AIR-GAPPED AUTHORIZATION BOUNDARY)
                ▼

[Google Drive Infrastructure Layer]
  - Single OAuth 2.0 Identity / Service Account
  - Owns or edits all files globally across the root folder
  - Zero concept of application roles or individual BP-CMS team members
```

---

## 3. Security Implication: The "Anyone with the Link" Hazard
- If a user copies a direct `webViewLink` (`https://drive.google.com/file/d/{id}/view`) from Google Sheets and the Drive folder sharing is set to "Anyone with the link can view", external parties can view raw production footage completely bypassing application authentication.
- Conversely, if Drive folder sharing is restricted to the OAuth service identity, team members cannot view files directly in Google Drive without logging into BP-CMS.
