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
 * 3. Creates Firebase Auth user via Admin SDK.
 * 4. Generates an initial password setup link or sets explicit password.
 * 5. Saves canonical Firestore employee profile with UserRole.ADMIN.
 * 6. Zero secret leaks: Never commits passwords or links to files.
 *
 * Usage:
 *   npx tsx scripts/bootstrap-initial-admin.ts --email=admin@example.com --name="System Administrator" [--password="SecurePassword123!"] [--secret="YourBootstrapSecret"]
 */

import '../src/config/env';
import { getAdminAuth, getAdminFirestore } from '../database/firestore/adapter/admin';
import { usersRepository } from '../database/firestore/repositories/users.repository';
import { auditLogRepository } from '../database/firestore/repositories/audit-log.repository';
import { UserRole, User } from '../shared';
import { canonicalIdService } from '../shared/lib/id.service';

function parseArgs(): { email?: string; name?: string; password?: string; secret?: string } {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, ...rest] = arg.substring(2).split('=');
      parsed[key] = rest.join('=');
    }
  }
  return parsed;
}

async function runBootstrap() {
  console.log('============================================================');
  console.log('BURRA PARIKSHA CMS — INITIAL ADMINISTRATOR PROVISIONING');
  console.log('============================================================\n');

  const args = parseArgs();
  const secret = args.secret || process.env.BOOTSTRAP_ADMIN_SECRET;

  if (!secret) {
    console.error('❌ Error: Administrative bootstrap secret is required.');
    console.error('   Set BOOTSTRAP_ADMIN_SECRET in environment or provide --secret=<value>');
    process.exit(1);
  }

  const expectedSecret = process.env.BOOTSTRAP_ADMIN_SECRET;
  if (expectedSecret && secret !== expectedSecret) {
    console.error('❌ Error: Invalid administrative bootstrap secret.');
    process.exit(1);
  }

  const email = (args.email || process.env.INITIAL_ADMIN_EMAIL)?.trim().toLowerCase();
  const name = (args.name || process.env.INITIAL_ADMIN_NAME || 'System Administrator')?.trim();
  const password = args.password || process.env.INITIAL_ADMIN_PASSWORD;

  if (!email || !email.includes('@')) {
    console.error('❌ Error: A valid administrator email address is required.');
    console.error('   Provide --email=admin@example.com or set INITIAL_ADMIN_EMAIL');
    process.exit(1);
  }

  console.log(`[BOOTSTRAP] Target Administrator: ${name} <${email}>`);

  // Ensure datastore initialized
  getAdminFirestore();
  const adminAuth = getAdminAuth();

  // 1. Guard against duplicate admin provisioning
  console.log('[BOOTSTRAP] Checking existing administrators in Cloud Firestore...');
  const allUsers = await usersRepository.findAll();
  const existingActiveAdmin = allUsers.find(
    (u) => u.isActive && (u.role === UserRole.ADMIN || (Array.isArray(u.roles) && u.roles.includes(UserRole.ADMIN)))
  );

  if (existingActiveAdmin) {
    console.error(`❌ Bootstrap Aborted: An active administrator already exists in Firestore (ID: ${existingActiveAdmin.id}, Email: ${existingActiveAdmin.email}).`);
    console.error('   Subsequent administrator accounts must be created through the authenticated CMS interface.');
    process.exit(1);
  }

  // 2. Provision or verify Firebase Authentication identity
  console.log('[BOOTSTRAP] Provisioning Firebase Authentication identity...');
  let authUser: any;
  let authUserCreated = false;

  try {
    authUser = await adminAuth.getUserByEmail(email);
    console.log(`[BOOTSTRAP] Found existing Firebase Auth account for ${email} (UID: ${authUser.uid}). Linking profile...`);
    const existingProfileWithUid = await usersRepository.findByFirebaseUid(authUser.uid);
    if (existingProfileWithUid) {
      console.error(`❌ Bootstrap Aborted: Firebase Auth UID is already linked to another user profile (ID: ${existingProfileWithUid.id}).`);
      process.exit(1);
    }
    if (password) {
      await adminAuth.updateUser(authUser.uid, { password });
      console.log('[BOOTSTRAP] Updated password on existing Firebase Auth account.');
    }
  } catch (err: any) {
    if (err?.code === 'auth/user-not-found') {
      authUser = await adminAuth.createUser({
        email,
        displayName: name,
        password: password || undefined,
        emailVerified: true,
      });
      authUserCreated = true;
      console.log(`[BOOTSTRAP] Created new Firebase Auth account (UID: ${authUser.uid}).`);
    } else {
      console.error(`❌ Error querying Firebase Auth: ${err?.message}`);
      process.exit(1);
    }
  }

  // 3. Generate password setup link if no password was supplied
  let setupLink: string | undefined = undefined;
  if (!password) {
    try {
      setupLink = await adminAuth.generatePasswordResetLink(email);
      console.log('[BOOTSTRAP] Generated initial password setup link via Firebase Auth.');
    } catch (err: any) {
      console.warn(`[BOOTSTRAP] Notice: Could not generate setup link: ${err?.message}`);
    }
  }

  // 4. Save administrator profile in Cloud Firestore
  console.log('[BOOTSTRAP] Creating administrator profile in Cloud Firestore...');
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

  try {
    const created = await usersRepository.appendRecord(adminProfile);
    await auditLogRepository.logAction(created.id, created.name, 'FIRST_ADMIN_BOOTSTRAPPED', 'SYSTEM', created.id, {
      email: created.email,
      firebaseUid: authUser.uid,
    });
    console.log(`✓ [BOOTSTRAP] Successfully provisioned administrator (ID: ${created.id}).`);
  } catch (err: any) {
    console.error(`❌ Failed to save administrator to Firestore: ${err?.message}`);
    if (authUserCreated) {
      try {
        await adminAuth.deleteUser(authUser.uid);
        console.log('[BOOTSTRAP] Rolled back created Firebase Auth user.');
      } catch (cleanupErr: any) {
        console.error(`[BOOTSTRAP] Cleanup warning: ${cleanupErr?.message}`);
      }
    }
    process.exit(1);
  }

  console.log('\n============================================================');
  console.log('✓ ADMINISTRATOR PROVISIONING COMPLETE');
  console.log('============================================================');
  console.log(`ID:           ${id}`);
  console.log(`Email:        ${email}`);
  console.log(`Role:         ${UserRole.ADMIN}`);
  console.log(`Firebase UID: ${authUser.uid}`);

  if (setupLink) {
    console.log(`\nPassword Setup Link:\n${setupLink}\n`);
    console.log('Provide this secure link to the administrator to set their password.');
  } else {
    console.log('\nPassword: Set as provided during invocation.');
  }

  process.exit(0);
}

runBootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
