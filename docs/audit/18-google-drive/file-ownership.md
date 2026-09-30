# File Ownership & Creator Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 22 of 40  

---

## 1. Multi-Tier Ownership Matrix

File ownership is tracked differently across the application tier and Google Drive:

| Ownership Role | Storage Location | Entity Represented | How Assigned |
| :--- | :--- | :--- | :--- |
| **Drive File Owner** | Google Drive Metadata | Google Cloud User / Service Account | Assigned automatically to the OAuth credential holder on upload |
| **Application Uploader** | Google Sheets (`created_by`) | Application User (e.g. `USR-0001`) | Populated from `actor.id` in request context |
| **Assigned Video Editor**| Google Sheets (`assigned_editor_id`)| Application User (Editor) | Assigned during video workflow delegation |
| **Assigned Presenter** | Google Sheets (`assigned_presenter_id`)| Application User (Presenter) | Assigned to teleprompter speaker |
| **Editorial Reviewer** | Google Sheets (`reviewer_id`) | Application User (Reviewer) | Recorded in `SOCIAL_REVIEWS` on sign-off |

---

## 2. Ownership Drift & Disconnect
Because Google Drive only records the OAuth service account as the file owner, Drive itself possesses zero metadata linking a file to an editor or presenter. Auditability of who uploaded or modified an asset depends 100% on the `AUDIT_LOG` sheet in Google Sheets.
