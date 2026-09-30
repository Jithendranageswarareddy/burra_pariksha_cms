# Database Security & Credentials Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 32 of 39  

---

## 1. Credential & Access Architecture

Access to Google Sheets and Google Drive persistence is secured via a single Google Cloud Service Account:
- **Client Email:** Injected via `GOOGLE_SERVICE_ACCOUNT_EMAIL`.
- **Private Key:** Injected via `GOOGLE_PRIVATE_KEY` (PEM RSA private key).
- **Authentication Protocol:** OAuth 2.0 JWT Bearer Token exchange.

---

## 2. Least-Privilege & Scope Analysis

1. **Broad Workspace Permissions:**  
   The Service Account requires `https://www.googleapis.com/auth/spreadsheets` and `https://www.googleapis.com/auth/drive`.
   - **Vulnerability:** The Service Account possesses full editor access across the entire spreadsheet and all folders in the root Drive directory. It cannot be restricted to specific worksheets or specific columns at the Google IAM layer.
2. **Zero Row-Level or Column-Level Security (RLS/CLS):**  
   Unlike relational databases with Row-Level Security (`CREATE POLICY`), Google Sheets exposes all rows to any caller holding the Service Account credentials. Authorization and tenant isolation are enforced strictly in the Express application layer.
3. **Credential Redaction in Logs & Snapshots:**  
   Automated verification in `task3f4-snapshot-exporter-verification.ts` confirms that backup snapshots explicitly redact `GOOGLE_PRIVATE_KEY`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, and `DATABASE_URL` to prevent secret leakage.
