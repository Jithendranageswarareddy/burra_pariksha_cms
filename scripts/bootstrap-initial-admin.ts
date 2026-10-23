/**
 * BURRA PARIKSHA CMS — First Administrator Provisioning Bootstrap
 *
 * Secure, one-time bootstrap script to provision the foundational system
 * administrator in Firebase Authentication and Cloud Firestore without depending
 * on legacy Google Sheets records or hardcoded development accounts.
 *
 * Security Requirements:
 * 1. Requires BOOTSTRAP_ADMIN_SECRET environment variable or --secret flag.
 * 2. Idempotent: Checks if an active administrator already exists in Firestore.
 * 3. Creates Firebase Auth user via Admin SDK without fabricating placeholder UIDs.
 * 4. Dispatches genuine password setup email via authService.dispatchPasswordSetupEmail.
 * 5. Saves canonical Firestore employee profile with UserRole.ADMIN.
 * 6. Zero secret leaks: Never prints, logs, persists, or returns raw reset action links or oobCode.
 * 7. Safe recovery: Reports partial-success truthfully if email delivery fails, preserving existing accounts.
 *
 * Usage:
 *   npx tsx scripts/bootstrap-initial-admin.ts --email=admin@example.com --name="System Administrator" [--password="SecurePassword123!"] [--secret="YourBootstrapSecret"]
 */

import '../src/config/env';
import { getAdminAuth, getAdminFirestore } from '../database/firestore/adapter/admin';
import { usersRepository } from '../database/firestore/repositories/users.repository';
import { auditLogRepository } from '../database/firestore/repositories/audit-log.repository';
import { authService } from '../backend/infrastructure/auth/services/auth.service';
import { UserRole, User } from '../shared';
import { canonicalIdService } from '../shared/lib/id.service';

export interface BootstrapOptions {
  email?: string;
  name?: string;
  password?: string;
  secret?: string;
}

export interface BootstrapResult {
  success: boolean;
  userId?: string;
  email?: string;
  firebaseUid?: string;
  accountCreated?: boolean;
  setupEmailSent?: boolean;
  retryAvailable?: boolean;
  emailDelivery?: { sent: boolean; message?: string; error?: string };
  message?: string;
}

export function parseBootstrapArgs(argv = process.argv.slice(2)): BootstrapOptions {
  const parsed: Record<string, string> = {};
  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const [key, ...rest] = arg.substring(2).split('=');
      parsed[key] = rest.join('=');
    }
  }
  return parsed;
}

/**
 * Core administrator provisioning logic with full security guarantees.
 */
export async function provisionInitialAdmin(options: BootstrapOptions = {}): Promise<BootstrapResult> {
  const secret = options.secret || process.env.BOOTSTRAP_ADMIN_SECRET;
  const expectedSecret = process.env.BOOTSTRAP_ADMIN_SECRET;

  if (!expectedSecret || !secret || secret !== expectedSecret) {
    throw new Error('Administrative bootstrap secret is missing or invalid.');
  }

  const email = (options.email || process.env.INITIAL_ADMIN_EMAIL)?.trim().toLowerCase();
  const name = (options.name || process.env.INITIAL_ADMIN_NAME || 'System Administrator')?.trim();
  const password = options.password?.trim() || undefined;

  if (!email || !email.includes('@')) {
    throw new Error('A valid administrator email address is required.');
  }

  // Ensure datastore initialized
  getAdminFirestore();
  const adminAuth = getAdminAuth();

  // 1. Guard against duplicate active administrator provisioning
  const allUsers = await usersRepository.findAll();
  const existingActiveAdmin = allUsers.find(
    (u) => u.isActive && (u.role === UserRole.ADMIN || (Array.isArray(u.roles) && u.roles.includes(UserRole.ADMIN)))
  );

  if (existingActiveAdmin) {
    throw new Error(`An active administrator already exists in Firestore (ID: ${existingActiveAdmin.id}, Email: ${existingActiveAdmin.email}). Bootstrap provisioning is permanently disabled.`);
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
    // Safeguard: Never overwrite password of existing account unexpectedly
  } catch (err: any) {
    if (err?.code === 'auth/user-not-found') {
      authUser = await adminAuth.createUser({
        email,
        displayName: name,
        password: password || undefined,
        emailVerified: true,
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

  // 4. Initiate setup email delivery via Firebase Authentication if password not provided
  let setupEmailSent = false;
  let retryAvailable = false;
  let emailDelivery: { sent: boolean; message?: string; error?: string } = {
    sent: false,
    message: password ? 'Password established during bootstrap.' : undefined,
  };

  if (!password) {
    const deliveryResult = await authService.dispatchPasswordSetupEmail(email);
    setupEmailSent = deliveryResult.sent;
    retryAvailable = !setupEmailSent;
    emailDelivery = {
      sent: deliveryResult.sent,
      message: deliveryResult.message,
      ...(deliveryResult.error ? { error: deliveryResult.error } : {}),
    };
  }

  // 5. Audit the bootstrap operation without logging any tokens or sensitive links
  await auditLogRepository.logAction(created.id, created.name, 'FIRST_ADMIN_BOOTSTRAPPED', 'SYSTEM', created.id, {
    email: created.email,
    firebaseUid: authUser.uid,
    accountCreated: true,
    setupEmailSent,
    retryAvailable,
  });

  const outcomeMessage = setupEmailSent
    ? 'First administrator successfully provisioned and setup email dispatched.'
    : !password
    ? 'First administrator successfully provisioned, but setup email delivery failed. An administrator or operator can retry delivery once email provider settings are verified.'
    : 'First administrator successfully provisioned with initial credentials.';

  return {
    success: true,
    userId: created.id,
    email: created.email,
    firebaseUid: authUser.uid,
    accountCreated: true,
    setupEmailSent,
    retryAvailable,
    emailDelivery,
    message: outcomeMessage,
  };
}

export async function runBootstrap() {
  console.log('============================================================');
  console.log('BURRA PARIKSHA CMS — INITIAL ADMINISTRATOR PROVISIONING');
  console.log('============================================================\n');

  const args = parseBootstrapArgs();

  try {
    const result = await provisionInitialAdmin(args);

    console.log('\n============================================================');
    console.log('✓ ADMINISTRATOR PROVISIONING COMPLETE');
    console.log('============================================================');
    console.log(`ID:           ${result.userId}`);
    console.log(`Email:        ${result.email}`);
    console.log(`Role:         ${UserRole.ADMIN}`);
    console.log(`Firebase UID: ${result.firebaseUid}`);
    console.log(`Setup Email:  ${result.setupEmailSent ? 'SENT' : result.emailDelivery?.message?.includes('Password established') ? 'NOT_REQUIRED (Password set during invocation)' : 'FAILED (Partial Success)'}`);

    if (result.retryAvailable) {
      console.warn(`\n⚠️  Notice: Setup email delivery failed (${result.emailDelivery?.error || 'unspecified error'}).`);
      console.warn('   The administrator profile exists in Firestore and Firebase Auth.');
      console.warn('   Once email configuration (FIREBASE_API_KEY) is verified, trigger a resend via the CMS API or console.');
    }

    process.exit(0);
  } catch (err: any) {
    console.error(`\n❌ Bootstrap Aborted: ${err?.message}`);
    process.exit(1);
  }
}

// Auto-run if executed directly as entrypoint
const isDirectEntrypoint = Boolean(
  process.argv[1] &&
  (process.argv[1].replace(/\\/g, '/').endsWith('bootstrap-initial-admin.ts') ||
   process.argv[1].replace(/\\/g, '/').endsWith('bootstrap-initial-admin.js'))
);

if (isDirectEntrypoint) {
  runBootstrap().catch((err) => {
    console.error('Fatal bootstrap execution error:', err);
    process.exit(1);
  });
}
