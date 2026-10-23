/**
 * BURRA PARIKSHA CMS — First Administrator Provisioning Bootstrap
 *
 * Secure, one-time bootstrap script to provision the foundational system
 * administrator in Firebase Authentication and Cloud Firestore without depending
 * on legacy Google Sheets records or hardcoded development accounts.
 *
 * Security Requirements:
 * 1. Requires BOOTSTRAP_ADMIN_SECRET environment variable (minimum 16 characters).
 *    Passing secrets via CLI flags is strictly prohibited to prevent process/shell leaks.
 * 2. Idempotent: Checks if an active administrator already exists in Firestore.
 * 3. Never accepts passwords via CLI or logs: Password setup is strictly email-driven.
 *    Any --password argument is explicitly rejected before any database operation.
 * 4. Dispatches genuine password setup email via authService.dispatchPasswordSetupEmail.
 * 5. emailVerified: Defaults to false; inbox ownership is established via the email link.
 * 6. Zero secret leaks: Never prints, logs, persists, or returns raw reset action links or oobCode.
 * 7. Safe recovery: Reports partial-success truthfully if email delivery fails, and supports
 *    safe retry via --resend with the environment secret without creating duplicate profiles.
 *
 * Exit Codes:
 *   0 = Full Success (Account created & email dispatched, or resend succeeded)
 *   1 = Fatal Error (Invalid/missing secret, disallowed args, Firebase unavailable, Firestore save failed)
 *   2 = Partial Success (Account/profile created, but setup email dispatch failed)
 *   3 = Conflict (Administrator already exists; duplicate creation prevented)
 *
 * Usage:
 *   Set environment secret:
 *     export BOOTSTRAP_ADMIN_SECRET="YourBootstrapSecret123"
 *   Initial creation:
 *     npm run bootstrap:admin -- --email="admin@example.com" --name="System Administrator"
 *   Retry setup email if delivery previously failed:
 *     npm run bootstrap:admin -- --email="admin@example.com" --resend
 */

import '../src/config/env';
import { getAdminAuth, getAdminFirestore } from '../database/firestore/adapter/admin';
import { usersRepository } from '../database/firestore/repositories/users.repository';
import { auditLogRepository } from '../database/firestore/repositories/audit-log.repository';
import { authService } from '../backend/infrastructure/auth/services/auth.service';
import { UserRole, User } from '../shared';
import { canonicalIdService } from '../shared/lib/id.service';

export const BOOTSTRAP_EXIT_SUCCESS = 0;
export const BOOTSTRAP_EXIT_FATAL = 1;
export const BOOTSTRAP_EXIT_PARTIAL_SUCCESS = 2;
export const BOOTSTRAP_EXIT_ALREADY_EXISTS = 3;

export type BootstrapOutcome =
  | 'FULL_SUCCESS'
  | 'PARTIAL_SUCCESS'
  | 'ALREADY_EXISTS'
  | 'RESEND_SUCCESS'
  | 'RESEND_FAILED';

export interface BootstrapOptions {
  email?: string;
  name?: string;
  resend?: boolean;
}

export interface BootstrapResult {
  success: boolean;
  outcome: BootstrapOutcome;
  exitCode: number;
  userId?: string;
  email?: string;
  firebaseUid?: string;
  accountCreated?: boolean;
  setupEmailSent?: boolean;
  retryAvailable?: boolean;
  emailDelivery?: { sent: boolean; message?: string; error?: string };
  message: string;
}

export function parseBootstrapArgs(argv = process.argv.slice(2)): BootstrapOptions {
  let email: string | undefined;
  let name: string | undefined;
  let resend = false;

  for (let i = 0; i < argv.length; i++) {
    const rawArg = argv[i];

    // Explicitly reject password arguments in any format without echoing values
    if (rawArg === '--password' || rawArg.startsWith('--password=')) {
      throw new Error(
        'Disallowed argument "--password" detected: Passwords cannot be passed as command-line arguments. Account passwords must be set via secure email link.'
      );
    }

    // Explicitly reject secret arguments in any format without echoing values
    if (rawArg === '--secret' || rawArg.startsWith('--secret=')) {
      throw new Error(
        'Disallowed argument "--secret" detected: Passing secrets as command-line arguments is strictly prohibited. Configure BOOTSTRAP_ADMIN_SECRET in the environment instead.'
      );
    }

    if (rawArg === '--resend') {
      resend = true;
    } else if (rawArg.startsWith('--email=')) {
      email = rawArg.substring('--email='.length);
    } else if (rawArg === '--email') {
      if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) {
        throw new Error('Argument "--email" requires a value.');
      }
      email = argv[++i];
    } else if (rawArg.startsWith('--name=')) {
      name = rawArg.substring('--name='.length);
    } else if (rawArg === '--name') {
      if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) {
        throw new Error('Argument "--name" requires a value.');
      }
      name = argv[++i];
    } else {
      // Reject any unsupported argument or positional parameter without echoing values
      const flagName = rawArg.split('=')[0];
      throw new Error(
        `Unsupported argument "${flagName}" detected. Only --email, --name, and --resend are permitted.`
      );
    }
  }

  return { email, name, resend };
}

/**
 * Core administrator provisioning logic with full security guarantees.
 */
export async function provisionInitialAdmin(options: BootstrapOptions = {}): Promise<BootstrapResult> {
  const secret = process.env.BOOTSTRAP_ADMIN_SECRET;

  if (!secret || secret.trim() === '' || secret.trim().length < 16) {
    throw new Error(
      'Administrative bootstrap secret is missing, unconfigured, or insufficient in the environment (BOOTSTRAP_ADMIN_SECRET must be at least 16 characters).'
    );
  }

  // Ensure datastore initialized
  getAdminFirestore();
  const adminAuth = getAdminAuth();

  // 1. Guard against duplicate active administrator provisioning
  const allUsers = await usersRepository.findAll();
  const existingActiveAdmin = allUsers.find(
    (u) => u.isActive && (u.role === UserRole.ADMIN || (Array.isArray(u.roles) && u.roles.includes(UserRole.ADMIN)))
  );

  // Recovery flow: If administrator already exists and operator explicitly requests --resend
  if (existingActiveAdmin) {
    if (options.resend) {
      const targetEmail = (options.email || existingActiveAdmin.email).trim().toLowerCase();
      if (targetEmail !== existingActiveAdmin.email.toLowerCase()) {
        throw new Error(`Cannot resend setup email: Target email (${targetEmail}) does not match existing administrator (${existingActiveAdmin.email}).`);
      }
      if (!existingActiveAdmin.firebaseUid) {
        throw new Error(`Existing administrator profile (${existingActiveAdmin.id}) is missing a linked Firebase UID.`);
      }

      const deliveryResult = await authService.dispatchPasswordSetupEmail(existingActiveAdmin.email);
      await auditLogRepository.logAction(existingActiveAdmin.id, existingActiveAdmin.name, 'FIRST_ADMIN_SETUP_EMAIL_RESENT', 'SYSTEM', existingActiveAdmin.id, {
        email: existingActiveAdmin.email,
        firebaseUid: existingActiveAdmin.firebaseUid,
        setupEmailSent: deliveryResult.sent,
      });

      if (deliveryResult.sent) {
        return {
          success: true,
          outcome: 'RESEND_SUCCESS',
          exitCode: BOOTSTRAP_EXIT_SUCCESS,
          userId: existingActiveAdmin.id,
          email: existingActiveAdmin.email,
          firebaseUid: existingActiveAdmin.firebaseUid,
          accountCreated: false,
          setupEmailSent: true,
          retryAvailable: false,
          emailDelivery: deliveryResult,
          message: `Setup email successfully re-dispatched to existing administrator (${existingActiveAdmin.email}).`,
        };
      } else {
        return {
          success: false,
          outcome: 'RESEND_FAILED',
          exitCode: BOOTSTRAP_EXIT_PARTIAL_SUCCESS,
          userId: existingActiveAdmin.id,
          email: existingActiveAdmin.email,
          firebaseUid: existingActiveAdmin.firebaseUid,
          accountCreated: false,
          setupEmailSent: false,
          retryAvailable: true,
          emailDelivery: deliveryResult,
          message: `Failed to re-dispatch setup email: ${deliveryResult.error || 'Provider delivery error'}.`,
        };
      }
    }

    throw new Error(`An active administrator already exists in Firestore (ID: ${existingActiveAdmin.id}, Email: ${existingActiveAdmin.email}). Duplicate administrator provisioning is prevented. To retry setup email delivery, re-run with --resend --email="${existingActiveAdmin.email}", or use the public /reset-password flow.`);
  }

  const email = (options.email || process.env.INITIAL_ADMIN_EMAIL)?.trim().toLowerCase();
  const name = (options.name || process.env.INITIAL_ADMIN_NAME || 'System Administrator')?.trim();

  if (!email || !email.includes('@')) {
    throw new Error('A valid administrator email address is required.');
  }

  // 2. Provision or verify Firebase Authentication identity
  let authUser: any;
  let authUserCreated = false;

  try {
    authUser = await adminAuth.getUserByEmail(email);
    // User already exists in Firebase Auth - ensure UID is not linked to another profile
    const existingProfileWithUid = await usersRepository.findByFirebaseUid(authUser.uid);
    if (existingProfileWithUid) {
      throw new Error(`Firebase Auth UID (${authUser.uid}) is already linked to user profile (ID: ${existingProfileWithUid.id}).`);
    }
  } catch (err: any) {
    if (err?.code === 'auth/user-not-found') {
      // Security Policy: emailVerified is false because inbox ownership is proven via the setup email link
      authUser = await adminAuth.createUser({
        email,
        displayName: name,
        emailVerified: false,
      });
      authUserCreated = true;
    } else {
      throw new Error(`Firebase Authentication unavailable: ${err?.message}`);
    }
  }

  if (!authUser || !authUser.uid) {
    throw new Error('Failed to obtain a valid Firebase Authentication UID.');
  }

  // 3. Save administrator profile in Cloud Firestore
  const id = canonicalIdService.generateUserId();
  const now = new Date().toISOString();

  const adminProfile: User = {
    id,
    name,
    email,
    role: UserRole.ADMIN,
    roles: [UserRole.ADMIN],
    firebaseUid: authUser.uid,
    isActive: true,
    dataScope: 'ALL',
    createdAt: now,
    updatedAt: now,
  };

  let created: User;
  try {
    created = await usersRepository.appendRecord(adminProfile);
  } catch (saveErr) {
    // Only clean up newly created account if profile persistence fails
    if (authUserCreated && authUser.uid) {
      try {
        await adminAuth.deleteUser(authUser.uid);
      } catch {
        // ignore compensating deletion failure
      }
    }
    throw saveErr;
  }

  // 4. Initiate setup email delivery via Firebase Authentication
  const deliveryResult = await authService.dispatchPasswordSetupEmail(email);
  const setupEmailSent = deliveryResult.sent;
  const retryAvailable = !setupEmailSent;
  const emailDelivery = {
    sent: deliveryResult.sent,
    message: deliveryResult.message,
    ...(deliveryResult.error ? { error: deliveryResult.error } : {}),
  };

  // 5. Audit the bootstrap operation without logging any tokens or sensitive links
  await auditLogRepository.logAction(created.id, created.name, 'FIRST_ADMIN_BOOTSTRAPPED', 'SYSTEM', created.id, {
    email: created.email,
    firebaseUid: authUser.uid,
    accountCreated: true,
    setupEmailSent,
    retryAvailable,
  });

  if (setupEmailSent) {
    return {
      success: true,
      outcome: 'FULL_SUCCESS',
      exitCode: BOOTSTRAP_EXIT_SUCCESS,
      userId: created.id,
      email: created.email,
      firebaseUid: authUser.uid,
      accountCreated: true,
      setupEmailSent: true,
      retryAvailable: false,
      emailDelivery,
      message: 'First administrator successfully provisioned and setup email dispatched.',
    };
  } else {
    return {
      success: false,
      outcome: 'PARTIAL_SUCCESS',
      exitCode: BOOTSTRAP_EXIT_PARTIAL_SUCCESS,
      userId: created.id,
      email: created.email,
      firebaseUid: authUser.uid,
      accountCreated: true,
      setupEmailSent: false,
      retryAvailable: true,
      emailDelivery,
      message: 'First administrator profile created in Firestore and Firebase Auth, but setup email delivery failed. Recovery: retry with --resend or use the public /reset-password flow.',
    };
  }
}

export async function runBootstrap(argv = process.argv.slice(2)): Promise<number> {
  console.log('============================================================');
  console.log('BURRA PARIKSHA CMS — INITIAL ADMINISTRATOR PROVISIONING');
  console.log('============================================================\n');

  try {
    const args = parseBootstrapArgs(argv);
    const result = await provisionInitialAdmin(args);

    console.log('\n============================================================');
    console.log(`STATUS: ${result.outcome} (Exit Code ${result.exitCode})`);
    console.log('============================================================');
    console.log(`User ID:      ${result.userId}`);
    console.log(`Email:        ${result.email}`);
    console.log(`Role:         ${UserRole.ADMIN}`);
    console.log(`Firebase UID: ${result.firebaseUid}`);
    console.log(`Setup Email:  ${result.setupEmailSent ? 'DISPATCH_ACCEPTED' : 'FAILED'}`);

    if (result.outcome === 'PARTIAL_SUCCESS') {
      console.warn(`\n⚠️  WARNING: PARTIAL SUCCESS (Exit Code ${BOOTSTRAP_EXIT_PARTIAL_SUCCESS})`);
      console.warn(`   Reason: Setup email delivery failed (${result.emailDelivery?.error || 'Provider delivery error'}).`);
      console.warn('   The administrator profile is safely provisioned in Firestore and Firebase Auth.');
      console.warn('   Recovery Options:');
      console.warn(`   1. Once email settings are verified, ensure BOOTSTRAP_ADMIN_SECRET is set and run: npm run bootstrap:admin -- --resend --email="${result.email}"`);
      console.warn(`   2. Or the administrator can navigate to /reset-password and enter "${result.email}".`);
    } else if (result.outcome === 'RESEND_FAILED') {
      console.warn(`\n⚠️  WARNING: RESEND FAILED (Exit Code ${BOOTSTRAP_EXIT_PARTIAL_SUCCESS})`);
      console.warn(`   Reason: Setup email delivery failed (${result.emailDelivery?.error || 'Provider delivery error'}).`);
    } else {
      console.log(`\n✓ ${result.message}`);
      console.log('   The administrator should inspect their inbox and complete initial password setup.');
    }

    return result.exitCode;
  } catch (err: any) {
    const isAlreadyExists = err?.message?.includes('already exists in Firestore');
    const exitCode = isAlreadyExists ? BOOTSTRAP_EXIT_ALREADY_EXISTS : BOOTSTRAP_EXIT_FATAL;
    console.error(`\n❌ Bootstrap Aborted (Exit Code ${exitCode}): ${err?.message}`);
    return exitCode;
  }
}

// Auto-run if executed directly as entrypoint
const isDirectEntrypoint = Boolean(
  process.argv[1] &&
  (process.argv[1].replace(/\\/g, '/').endsWith('bootstrap-initial-admin.ts') ||
   process.argv[1].replace(/\\/g, '/').endsWith('bootstrap-initial-admin.js'))
);

if (isDirectEntrypoint) {
  runBootstrap().then((code) => {
    process.exit(code);
  }).catch((err) => {
    console.error('Fatal bootstrap execution error:', err);
    process.exit(BOOTSTRAP_EXIT_FATAL);
  });
}
