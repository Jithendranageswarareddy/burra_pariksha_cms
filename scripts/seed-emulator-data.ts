/**
 * BURRA PARIKSHA CMS — Safe Local Emulator Seeding Script
 * 
 * Provisions isolated test data into the local Firestore Emulator:
 * 1. Strictly guards against production: Aborts immediately if targeting Cloud Firestore.
 * 2. Verifies Firestore Emulator is running and responsive on 127.0.0.1:8080.
 * 3. Seeds 2-Tier Taxonomy: Exactly 2 Topics (Aptitude, Reasoning) & 36 Subtopics.
 * 4. Seeds Canonical Question Configs: Style, Context, and Guidance entries.
 * 5. Seeds Local Test Accounts:
 *    - jithendrareddy629@gmail.com (Admin) / Password: Admin@123456
 *    - admin@burrapariksha.local (Admin) / Password: Admin@123456
 *    - creator@burrapariksha.local (Content Creator) / Password: Admin@123456
 *    - reviewer@burrapariksha.local (Reviewer for GAR-02) / Password: Admin@123456
 * 6. Seeds Baseline Question Challenge Short Draft for immediate local workflow testing.
 */

import '../src/config/env';
import { assertDatastoreSafe, assertEmulatorAlive } from '../src/config/datastore-guard';
import { getAdminFirestore } from '../database/firestore/adapter/admin';
import {
  topicsRepository,
  subtopicsRepository,
  usersRepository,
  questionConfigRepository,
  questionDraftsRepository,
} from '../database/firestore/repositories';
import { PRODUCTION_TOPICS, PRODUCTION_SUBTOPICS } from '../src/lib/data/production-taxonomy';
import { authService } from '../backend/infrastructure/auth/services/auth.service';
import { UserRole } from '../shared';

export async function seedEmulatorData(): Promise<void> {
  console.log('============================================================');
  console.log('BURRA PARIKSHA CMS — ISOLATED LOCAL EMULATOR SEEDING');
  console.log('============================================================\n');

  // 1. Enforce Datastore Isolation Guard
  const target = assertDatastoreSafe();
  if (target.mode !== 'LOCAL_FIRESTORE_EMULATOR' || target.isProductionTarget) {
    console.error('[CRITICAL SAFETY ABORT] Target datastore is NOT the local emulator!');
    console.error(`Mode: ${target.mode}, Project: ${target.projectId}, Database: ${target.databaseId}`);
    console.error('Seeding is strictly restricted to the local Firestore Emulator (USE_FIRESTORE_EMULATOR=true).');
    process.exit(1);
  }

  console.log(`[Datastore Safety] Target verified: ${target.mode}`);
  console.log(`- Project: ${target.projectId}`);
  console.log(`- Database: ${target.databaseId}`);
  console.log(`- Host: ${target.emulatorHost}\n`);

  // 2. Verify Emulator Reachability
  await assertEmulatorAlive(target.emulatorHost || undefined);
  console.log(`[Connectivity] Firestore Emulator confirmed alive at ${target.emulatorHost || '127.0.0.1:8080'}.\n`);

  // 3. Seed Taxonomy (Topics & Subtopics)
  console.log('--- 1. Seeding 2-Tier Taxonomy (Aptitude & Reasoning) ---');
  let topicsSeeded = 0;
  for (const topic of PRODUCTION_TOPICS) {
    const existing = await topicsRepository.findById(topic.id);
    if (!existing) {
      await topicsRepository.create(topic);
      topicsSeeded++;
    }
  }

  let subtopicsSeeded = 0;
  for (const subtopic of PRODUCTION_SUBTOPICS) {
    const existing = await subtopicsRepository.findById(subtopic.id);
    if (!existing) {
      await subtopicsRepository.create(subtopic);
      subtopicsSeeded++;
    }
  }
  console.log(`✓ Topics: ${topicsSeeded} created (${PRODUCTION_TOPICS.length} total active).`);
  console.log(`✓ Subtopics: ${subtopicsSeeded} created (${PRODUCTION_SUBTOPICS.length} total active).\n`);

  // 4. Seed Question Configurations
  console.log('--- 2. Seeding Question Configurations ---');
  const nowIso = new Date().toISOString();
  const canonicalConfigs = [
    {
      id: 'CFG-STY-001',
      dimension: 'QUESTION_STYLE',
      code: 'STORY_BASED',
      displayLabel: 'Story-Based Scenario',
      description: 'Narrative problem set in everyday situations with relatable characters',
      aiPromptGuidance: 'Frame the mathematical problem inside an authentic narrative arc.',
      sortOrder: 10,
      isActive: true,
      isDefault: true,
      updatedAt: nowIso,
    },
    {
      id: 'CFG-CTX-001',
      dimension: 'REAL_LIFE_CONTEXT',
      code: 'TELUGU_EVERYDAY',
      displayLabel: 'Telugu Everyday Life',
      description: 'Local cultural references authentic to Telangana and Andhra Pradesh',
      aiPromptGuidance: 'Use authentic Telugu names, festivals, local food, and currency.',
      sortOrder: 10,
      isActive: true,
      isDefault: true,
      updatedAt: nowIso,
    },
    {
      id: 'CFG-FOC-001',
      dimension: 'FOCUS_DIMENSION',
      code: 'CONCEPTUAL_CLARITY',
      displayLabel: 'Conceptual Clarity',
      description: 'Tests fundamental principles rather than rote formula application',
      aiPromptGuidance: 'Require conceptual reasoning to eliminate trap answers.',
      sortOrder: 10,
      isActive: true,
      isDefault: true,
      updatedAt: nowIso,
    },
  ];

  let configsSeeded = 0;
  for (const cfg of canonicalConfigs) {
    const existing = await questionConfigRepository.findById(cfg.id);
    if (!existing) {
      await questionConfigRepository.create(cfg as any);
      configsSeeded++;
    }
  }
  console.log(`✓ Question Configs: ${configsSeeded} created (${canonicalConfigs.length} total).\n`);

  // 5. Seed Local Test Accounts
  console.log('--- 3. Seeding Local Test Accounts ---');
  const defaultPassword = 'Admin@123456';
  const defaultHash = await authService.hashPassword(defaultPassword);

  const localUsers = [
    {
      id: 'USR-001',
      name: 'P J N Reddy',
      email: 'jithendrareddy629@gmail.com',
      role: UserRole.ADMIN,
      roles: [UserRole.ADMIN],
      isActive: true,
      dataScope: 'ALL',
      sessionVersion: 1,
      password_hash: defaultHash,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'USR-LOCAL-ADMIN',
      name: 'Local Admin',
      email: 'admin@burrapariksha.local',
      role: UserRole.ADMIN,
      roles: [UserRole.ADMIN],
      isActive: true,
      dataScope: 'ALL',
      sessionVersion: 1,
      password_hash: defaultHash,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'USR-LOCAL-CREATOR',
      name: 'Question Creator',
      email: 'creator@burrapariksha.local',
      role: UserRole.QUESTION_CREATOR,
      roles: [UserRole.QUESTION_CREATOR],
      isActive: true,
      dataScope: 'ALL',
      sessionVersion: 1,
      password_hash: defaultHash,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'USR-LOCAL-REVIEWER',
      name: 'Quality Reviewer',
      email: 'reviewer@burrapariksha.local',
      role: UserRole.REVIEWER,
      roles: [UserRole.REVIEWER],
      isActive: true,
      dataScope: 'ALL',
      sessionVersion: 1,
      password_hash: defaultHash,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  let usersSeeded = 0;
  for (const user of localUsers) {
    const existing = await usersRepository.findById(user.id);
    if (!existing) {
      await usersRepository.create(user as any);
      usersSeeded++;
    } else {
      await usersRepository.updateRecord(user.id, {
        password_hash: defaultHash,
        isActive: true,
        updatedAt: nowIso,
      });
    }
  }
  console.log(`✓ Local Test Users: ${usersSeeded} created / updated.`);
  console.log(`  - jithendrareddy629@gmail.com (ADMIN) [Password: ${defaultPassword}]`);
  console.log(`  - admin@burrapariksha.local (ADMIN) [Password: ${defaultPassword}]`);
  console.log(`  - creator@burrapariksha.local (QUESTION_CREATOR) [Password: ${defaultPassword}]`);
  console.log(`  - reviewer@burrapariksha.local (REVIEWER) [Password: ${defaultPassword}]\n`);

  // 6. Seed Sample Question Challenge Short Draft
  console.log('--- 4. Seeding Sample Question Challenge Short Draft ---');
  const sampleDraftId = 'DFT-QC-SHORT-LOCAL-001';
  const existingDraft = await questionDraftsRepository.findById(sampleDraftId);
  if (!existingDraft) {
    await questionDraftsRepository.create({
      id: sampleDraftId,
      status: 'DRAFT',
      currentStage: 1,
      productionMode: 'QUESTION_CHALLENGE_SHORT',
      topicId: PRODUCTION_TOPICS[0].id,
      topicName: PRODUCTION_TOPICS[0].name,
      subtopicId: PRODUCTION_SUBTOPICS[0].id,
      subtopicName: PRODUCTION_SUBTOPICS[0].name,
      difficulty: 'MEDIUM',
      language: 'TE',
      questionText: 'ఒక దుకాణదారుడు వస్తువు ధరను 20% పెంచి, తరువాత 10% తగ్గింపు ఇచ్చాడు. అతని లాభం లేదా నష్టం ఎంత శాతం?',
      options: [
        { id: 'opt_a', text: '8% లాభం', isCorrect: true },
        { id: 'opt_b', text: '10% లాభం', isCorrect: false },
        { id: 'opt_c', text: '5% నష్టం', isCorrect: false },
        { id: 'opt_d', text: 'లాభం లేదు, నష్టం లేదు', isCorrect: false },
      ],
      explanation: 'వస్తువు అసలు ధర 100 అనుకుంటే, 20% పెంచిన ధర 120. 120 పై 10% తగ్గింపు = 12 రూపాయలు. అమ్మిన ధర = 108. లాభం = 8%.',
      authorId: 'USR-001',
      authorName: 'P J N Reddy',
      createdAt: nowIso,
      updatedAt: nowIso,
    } as any);
    console.log(`✓ Sample Question Challenge Short draft created: ${sampleDraftId}\n`);
  } else {
    console.log(`✓ Sample Question Challenge Short draft already exists: ${sampleDraftId}\n`);
  }

  console.log('============================================================');
  console.log('EMULATOR SEEDING COMPLETED SUCCESSFULLY!');
  console.log('Local environment is fully primed for Question Challenge Short development.');
  console.log('============================================================');
}

if (process.argv[1]?.endsWith('seed-emulator-data.ts')) {
  seedEmulatorData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal seeding error:', err);
      process.exit(1);
    });
}
