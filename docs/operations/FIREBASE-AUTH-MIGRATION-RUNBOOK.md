# Burra Pariksha CMS (BP-CMS): Firebase Authentication Migration Runbook

## 1. Overview & Context

This runbook documents the architecture, operational procedures, configuration requirements, and disaster recovery workflows for the Burra Pariksha CMS (BP-CMS) Firebase Authentication integration.

Following the intentional purge of legacy Google Sheets authentication dependencies and legacy administrator records, BP-CMS relies entirely on **Firebase Authentication** for identity management, credential verification, and password lifecycle management, while **Cloud Firestore** remains the authoritative transactional store for user profiles, roles, and granular capability assignments.

---

## 2. Architecture & Security Invariants

### 2.1 Identity & Data Separation
1. **Firebase Authentication (Auth)**:
   - Owns identity credentials (email, hashed password, password reset oobCodes, session tokens, ID tokens).
   - Generates and validates secure 3-segment JWT ID tokens.
2. **Cloud Firestore (`users` collection)**:
   - Owns user records (`id`, `name`, `email`, `role`, `roles`, `firebaseUid`, `isActive`, `createdAt`, `updatedAt`).
   - Serves as the sole authoritative source of roles and permissions (`GAR-02` RBAC enforcement).
   - Any user record where `isActive === false` is immediately rejected by the backend authentication middleware with `401 Unauthorized (Account is inactive)`.

### 2.2 Security Invariants
- **No Client-Side Secrets / Direct SDK**: The frontend client never directly initializes the Firebase Admin SDK or accesses internal Firebase Auth service accounts. All authentication operations (login, forgot password, reset password, employee provisioning) are mediated through typed backend endpoints in `backend/server/routers/routes.ts`.
- **Anti-Account Enumeration**: Password reset requests (`POST /api/auth/forgot-password`) always return generic HTTP 200 responses with the message `"If an account with this email exists, password recovery instructions have been sent."`, preventing attackers from enumerating valid team email addresses.
- **Strict Role Authorization**: User management and provisioning endpoints require the `ADMIN` role or `USER:ADMINISTER` capability.
- **Idempotent First-Administrator Bootstrap**: The bootstrap endpoint (`POST /api/auth/bootstrap-admin`) requires the `BOOTSTRAP_ADMIN_SECRET` environment variable and fails closed (`409 Conflict`) if any active administrator already exists in Firestore.

---

## 3. Firebase Console Configuration

Before deploying or running in production, ensure the Firebase project is configured as follows:

1. **Enable Email/Password Provider**:
   - Go to [Firebase Console](https://console.firebase.google.com/) -> Select Project -> **Authentication** -> **Sign-in method**.
   - Enable **Email/Password** (Email link / passwordless can remain disabled).
2. **Authorized Domains**:
   - Under **Authentication** -> **Settings** -> **Authorized domains**, add:
     - `burra-pariksha-cms.web.app`
     - `burra-pariksha-cms.firebaseapp.com`
     - Custom domain (e.g. `cms.burrapariksha.com`)
     - `localhost` (for local development)
3. **Action URL / Templates**:
   - Under **Authentication** -> **Templates** -> **Password reset**:
     - Customize the email sender address and sender name (`Burra Pariksha CMS Security`).
     - Action URL should point to: `https://<YOUR-DOMAIN>/reset-password` (e.g. `https://burra-pariksha-cms.web.app/reset-password`).
     - When users click the link in their email, they will land on the BP-CMS password reset page with `?mode=resetPassword&oobCode=...`.

---

## 4. Environment Variables Reference

Ensure the following environment variables are configured in production (e.g. Cloud Run, Secret Manager, or `.env.production`):

| Variable | Description | Required | Example |
| :--- | :--- | :--- | :--- |
| `FIREBASE_API_KEY` | Public Firebase Web API Key for auth REST calls | Yes | `AIzaSyD...` |
| `GOOGLE_CLOUD_PROJECT` | GCP Project ID | Yes | `ai-studio-burraparikshacon-f592ca42...` |
| `BOOTSTRAP_ADMIN_SECRET` | Secret token used to bootstrap the first administrator | Production Setup Only | `super-secret-random-hex-string` |
| `FIRESTORE_DATABASE_ID` | Firestore Database ID | Default `(default)` | `(default)` |

---

## 5. First-Time Administrator Provisioning

When the database has zero active administrators, you can provision the initial administrator using either the CLI script or the protected REST API endpoint.

### Option A: CLI Bootstrap Script (Recommended)

1. Set the bootstrap environment variables:
   ```bash
   export BOOTSTRAP_ADMIN_SECRET="your-generated-secure-secret-phrase"
   ```
2. Execute the npm script:
   ```bash
   npm run bootstrap:admin -- --email="admin@burrapariksha.com" --name="System Administrator" --secret="your-generated-secure-secret-phrase"
   ```
   *Optional*: You can also provide `--password="InitialSecurePassword123!"`. If omitted, a Firebase password setup link is generated and printed to the terminal console.

### Option B: REST API Endpoint

1. Send an authorized POST request:
   ```bash
   curl -X POST https://api.<YOUR-DOMAIN>/api/auth/bootstrap-admin \
     -H "Content-Type: application/json" \
     -H "x-bootstrap-secret: your-generated-secure-secret-phrase" \
     -d '{
       "email": "admin@burrapariksha.com",
       "name": "System Administrator",
       "password": "InitialSecurePassword123!"
     }'
   ```
2. **Post-Bootstrap Cleanup**:
   - Immediately unset or rotate `BOOTSTRAP_ADMIN_SECRET` in production configuration.
   - Any subsequent calls to `/api/auth/bootstrap-admin` will be rejected with HTTP 409 Conflict.

---

## 6. Employee Provisioning & Onboarding Workflow

### Creating a New Team Member
1. Log in to the BP-CMS Dashboard as an Administrator.
2. Navigate to **Team Management** (or `Settings` -> `Users`).
3. Click **Add User** and provide:
   - Full Name
   - Email Address
   - Role (e.g. `RESEARCHER_SCRIPTWRITER`, `VIDEO_EDITOR`, `THUMBNAIL_DESIGNER`, `ADMIN`)
4. Click **Create User**:
   - The backend checks for email collisions.
   - A Firebase Auth user is created with a random temporary identity.
   - An initial password setup email link is generated.
   - A user document is created in Firestore with `firebaseUid`.
   - If Firestore creation fails, the backend triggers compensating deletion of the Firebase Auth user.
   - An audit log entry `USER_CREATED` is appended.

### Resending Setup Emails
If an employee did not receive or lost their initial password setup email:
1. In the **Team Management** table, locate the user.
2. Click **Resend Setup Email** (or call `POST /api/users/:id/resend-setup-email`).
3. A fresh Firebase password setup link is generated, emailed, and logged in the audit trail.

---

## 7. Password Recovery & Reset Flow

### Self-Service Recovery Flow
1. User navigates to `/login` and clicks **"Forgot password?"**.
2. User enters their registered email address and clicks **"Send Instructions"**.
3. Frontend issues `POST /api/auth/forgot-password`.
4. Backend triggers Firebase Auth `sendOobCode` (or Admin SDK password reset link).
5. User receives an email with a secure link pointing to `/reset-password?mode=resetPassword&oobCode=...`.
6. User enters and confirms their new password (minimum 8 characters).
7. Frontend calls `POST /api/auth/reset-password` with `{ oobCode, newPassword }`.
8. User is automatically redirected to `/login` with a success message to sign in with their new password.

---

## 8. Troubleshooting & Diagnostics

### Issue 1: Login fails with "Account is inactive" (401)
- **Root Cause**: The user's Firestore document has `isActive: false`.
- **Resolution**: An administrator must edit the user in Team Management and set `isActive: true`.

### Issue 2: Password reset link expired or invalid
- **Root Cause**: Firebase `oobCode` tokens expire (default 1 hour) or may have already been consumed.
- **Resolution**: Have the user request a new link at `/login` (or have an admin use "Resend Setup Email").

### Issue 3: Bootstrap fails with 409 Conflict
- **Root Cause**: An active administrator already exists in the Firestore `users` collection.
- **Resolution**: Use the existing administrator account to manage users or reset credentials via standard password recovery.
