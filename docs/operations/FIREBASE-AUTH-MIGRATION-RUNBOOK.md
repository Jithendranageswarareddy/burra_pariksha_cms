# Burra Pariksha CMS (BP-CMS): Firebase Authentication Migration Runbook

## 1. Overview & Context

This runbook documents the architecture, operational procedures, configuration requirements, security invariants, and disaster recovery workflows for the Burra Pariksha CMS (BP-CMS) Firebase Authentication integration.

Following the intentional purge of legacy Google Sheets authentication dependencies and legacy administrator records, BP-CMS relies entirely on **Firebase Authentication** for identity management, credential verification, and password lifecycle management, while **Cloud Firestore** remains the authoritative transactional store for user profiles, roles, and granular capability assignments.

---

## 2. Architecture & Security Invariants

### 2.1 Identity & Data Separation
1. **Firebase Authentication (Auth)**:
   - Owns identity credentials (email, hashed password, password reset oobCodes, session tokens, ID tokens).
   - Generates and validates secure 3-segment JWT ID tokens.
   - Built-in email delivery mechanism dispatches password setup and reset emails.
2. **Cloud Firestore (`users` collection)**:
   - Owns user records (`id`, `name`, `email`, `role`, `roles`, `firebaseUid`, `isActive`, `createdAt`, `updatedAt`).
   - Serves as the sole authoritative source of roles and permissions (`GAR-02` RBAC enforcement).
   - Any user record where `isActive === false` is immediately rejected by the backend authentication middleware with `401 Unauthorized (Account is inactive)`.

### 2.2 Security Invariants
- **Fail-Closed Production Login**: Firebase Authentication is the sole credential authority in production. In production, successful sign-in strictly requires valid Firebase credentials and successful verification of the returned Firebase ID token by the Firebase Admin SDK. Legacy `password_hash` verification is isolated to test execution and is structurally unreachable in production. Hardcoded default passwords are permanently prohibited.
- **Safe UID Linking & Collision Prevention**: Every `firebaseUid` must originate from a real Firebase Authentication user record or verified ID token. One Firebase UID cannot be linked to multiple employee profiles. If a UID is already bound to another profile, sign-in and provisioning reject the operation with an identity collision conflict.
- **Truthful Email Delivery**: Generating a password-reset action link alone does not deliver an email. The CMS uses Firebase's official email action API (`accounts:sendOobCode` with `requestType: "PASSWORD_RESET"`). If email dispatch fails, the system returns a partial-success status (`accountCreated: true, emailDelivery: { sent: false, error }, retryAvailable: true`) and never claims false delivery or fabricates synthetic fallback URLs.
- **Zero Secret Exposure**: Password setup links, action codes (`oobCode`), passwords, and credentials are never returned in public API responses or logged in Firestore audit trails.
- **Anti-Account Enumeration**: Password reset requests (`POST /api/auth/forgot-password`) always return identical neutral HTTP 200 responses with the message `"If an account exists for this email address, a password reset link will be sent."`, preventing attackers from enumerating valid team email addresses.
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
3. **Action URL & Email Templates**:
   - Under **Authentication** -> **Templates** -> **Password reset**:
     - Customize the email sender address and sender name (`Burra Pariksha CMS Security`).
     - Action URL should point to: `https://<YOUR-DOMAIN>/reset-password` (e.g. `https://burra-pariksha-cms.web.app/reset-password`).
     - When users click the link in their email, they land on the BP-CMS password reset page with `?mode=resetPassword&oobCode=...`.

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
   *Optional*: You can also provide `--password="InitialSecurePassword123!"`. If omitted, a genuine Firebase password reset link is generated and printed directly to the terminal console for manual one-time handover.

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
2. Navigate to **Team Operations** (`/team/operations`).
3. Click **Add Team Member** and provide:
   - Full Name
   - Email Address
   - Assigned Roles (e.g. `QUESTION_CREATOR`, `QUESTION_EDITOR`, `SCRIPT_WRITER`, `ADMIN`)
4. Click **Save User**:
   - The backend checks for duplicate emails in Firestore.
   - A Firebase Auth user is created with a genuine UID (or verifies an unlinked existing auth user).
   - If an existing Firebase user is already bound to another profile, creation aborts with an identity collision error.
   - The user document is persisted in Cloud Firestore with the verified `firebaseUid`.
   - If Firestore persistence fails, compensating rollback deletes the newly created Firebase Auth user.
   - The backend dispatches a real setup email via Firebase Authentication's `sendOobCode` API.
   - The API response truthfully returns:
     - `accountCreated: true`
     - `emailDelivery: { sent: boolean, error?: string }`
     - `setupEmailSent: boolean`
     - `retryAvailable: boolean`
   - If email delivery fails, the UI indicates partial success and makes the **Resend Setup Email** button available.

### Resending Setup Emails
If an employee did not receive or lost their initial password setup email:
1. In the **Team Operations** interface, click **Edit User** on the target user card.
2. Click **Resend Setup Email** (or call `POST /api/users/:id/resend-setup-email`).
3. The backend:
   - Verifies the actor has `USER:ADMINISTER` capability.
   - Confirms the target user is active and bound to a valid `firebaseUid`.
   - Dispatches a fresh setup email through Firebase Authentication.
   - Audits the operation (`USER_SETUP_EMAIL_RESENT`) without logging sensitive links.
   - Returns `{ success: true, emailDelivered: true, retryAvailable: false }`.
   - If delivery fails, returns `{ success: false, emailDelivered: false, retryAvailable: true, error: "..." }`.

---

## 7. Password Recovery & Reset Flow

### Self-Service Recovery Flow
1. User navigates to `/login` and clicks **"Forgot password?"**.
2. User enters their registered email address and clicks **"Send Instructions"**.
3. Frontend issues `POST /api/auth/forgot-password`.
4. Backend triggers Firebase Authentication's built-in email dispatcher (`sendOobCode`).
5. A neutral response is returned to prevent account enumeration.
6. The user receives an email from Firebase containing a secure link pointing to `/reset-password?mode=resetPassword&oobCode=...`.
7. User enters and confirms their new password (minimum 8 characters).
8. Frontend calls `POST /api/auth/reset-password` with `{ oobCode, newPassword }`.
9. The backend verifies the action code with Firebase Auth, updates the password in Firebase Auth, and invalidates existing sessions in Firestore (`incrementSessionVersionPersistent`).
10. User is redirected to `/login` to sign in with their new credentials.

---

## 8. Troubleshooting & Diagnostics

### Issue 1: Login fails with "Account is inactive" (401)
- **Root Cause**: The user's Firestore document has `isActive: false` or Firebase user has `disabled: true`.
- **Resolution**: An administrator must edit the user in Team Operations and set `isActive: true`.

### Issue 2: Login fails with "Authentication service unavailable" (500/401)
- **Root Cause**: `FIREBASE_API_KEY` is missing or Firebase Identity Toolkit endpoint is unreachable.
- **Resolution**: Verify `FIREBASE_API_KEY` in environment variables and network connectivity to `https://identitytoolkit.googleapis.com`.

### Issue 3: Email delivery fails during user creation or resend
- **Root Cause**: `FIREBASE_API_KEY` missing, sender email domain unverified in Firebase Console, or quota exceeded.
- **Resolution**: Verify Firebase Console -> Authentication -> Templates -> Password reset sender email. Use **Resend Setup Email** once resolved.

### Issue 4: Bootstrap fails with 409 Conflict
- **Root Cause**: An active administrator already exists in the Firestore `users` collection.
- **Resolution**: Use the existing administrator account or reset credentials via standard password recovery.
