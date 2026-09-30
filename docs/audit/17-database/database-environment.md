# Database Environment Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 04 of 39  

---

## 1. Environment Variable Architecture

Persistence behavior is strictly controlled by environment variables. A forensic review of `.env.example` and runtime lookups in `src/lib/google-sheets/client.ts` reveals:

| Variable Name | Required | Default / Example | Purpose | Security Classification |
| :--- | :---: | :--- | :--- | :---: |
| `SPREADSHEET_ID` | **YES** | `1A2B3C4D5E6F...` | ID of the authoritative primary Google Spreadsheet | SENSITIVE CONFIG |
| `ANALYTICS_SPREADSHEET_ID`| OPTIONAL | `9Z8Y7X6W5V...` | ID of secondary analytics spreadsheet | SENSITIVE CONFIG |
| `TEST_SPREADSHEET_ID` | OPTIONAL | `TEST_SHEET_ID` | ID used during automated script runs | SENSITIVE CONFIG |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL`| **YES** | `bp-cms@project.iam.gserviceaccount.com` | GCP Service Account client email | HIGH SECURITY |
| `GOOGLE_PRIVATE_KEY` | **YES** | `-----BEGIN PRIVATE KEY-----\n...` | RSA private key for JWT authentication | CRITICAL SECRET |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID`| **YES** | `1F2G3H4J5K...` | Root Google Drive folder for binary uploads | SENSITIVE CONFIG |

---

## 2. Environment Operating Modes

### 1. Production Mode (Google Cloud / Cloud Run)
- Activated when `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_PRIVATE_KEY` are present in environment.
- All repositories interact directly with live Google Sheets worksheets.
- All file uploads route to Google Drive root folder.

### 2. Ephemeral Development Mode (Local Fallback)
- Activated automatically when Service Account credentials are missing.
- Log message emitted: `"[GoogleSheetsClient] Warning: Service account credentials missing. Operating in in-memory fallback mode."`
- Reads and writes mutate `BaseRepository.fallbackStore`.
- **Limitation:** Data does not persist across server restarts.

### 3. Staging / Test Mode
- Repositories accept custom target spreadsheet IDs via `getTargetSpreadsheetId()`.
- Test scripts point to `TEST_SPREADSHEET_ID`.
- **Vulnerability:** If `TEST_SPREADSHEET_ID` is unset, test scripts inadvertently read from or write to `SPREADSHEET_ID` (production).
