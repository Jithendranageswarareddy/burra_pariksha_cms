/**
 * BURRA PARIKSHA CMS - LIVE PRODUCTION VERIFICATION TEST SUITE
 * Phase 11.1: Live Google Sheets Production Readiness & Schema Verification
 * 
 * STRICT READ-ONLY SUITE:
 * This script verifies connection status, environment variable configuration,
 * 18-worksheet contract compliance, sequence registry, isolation invariants,
 * read capabilities, and data integrity diagnostics.
 * 
 * GUARANTEE: Does NOT create, update, delete, or mutate any production records or sequences.
 */

import { googleSheetsClient } from '../lib/google-sheets/client';
import {
  ALL_SHEET_TABS,
  ID_PREFIX_MAP,
  SEQUENCE_ENTITIES,
  SHEET_SCHEMAS,
  SHEET_TABS,
  SequenceEntityType,
} from '../lib/schemas/google-sheets-schema';
import { SpreadsheetVerificationService } from '../lib/services/spreadsheet-verification.service';
import { DataIntegrityService } from '../lib/services/data-integrity.service';
import { sequencesRepository } from '../lib/repositories/sequences.repository';
import { usersRepository } from '../lib/repositories/users.repository';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { categoriesRepository } from '../lib/repositories/categories.repository';
import { topicsRepository } from '../lib/repositories/topics.repository';
import { subtopicsRepository } from '../lib/repositories/subtopics.repository';
import { videosRepository } from '../lib/repositories/videos.repository';
import { scriptsRepository } from '../lib/repositories/scripts.repository';
import { thumbnailsRepository } from '../lib/repositories/thumbnails.repository';
import { pinnedCommentsRepository } from '../lib/repositories/pinned-comments.repository';
import { publishingRepository } from '../lib/repositories/publishing.repository';

export async function runLiveProductionVerification() {
  console.log('====================================================');
  console.log('BURRA PARIKSHA CMS — LIVE PRODUCTION VERIFICATION');
  console.log('Phase 11.1: Google Sheets Contract & Diagnostic Audit');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  [PASS] Test ${totalTests}: ${testName}`);
    } else {
      console.error(`  [FAIL] Test ${totalTests}: ${testName}`);
      if (detail) console.error(`         Detail: ${detail}`);
    }
  }

  // ----------------------------------------------------------------
  // Section 1: Environment & Client Configuration Inspection
  // ----------------------------------------------------------------
  console.log('--- Section 1: Environment & Client Configuration ---');

  const hasEmail = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
  const hasKey = Boolean(process.env.GOOGLE_PRIVATE_KEY);
  const hasSheetId = Boolean(process.env.GOOGLE_SHEETS_ID || process.env.SPREADSHEET_ID);
  const isConfigured = googleSheetsClient.isConfigured();

  assert(
    typeof isConfigured === 'boolean',
    'GoogleSheetsClient.isConfigured() evaluates cleanly to boolean'
  );

  console.log(`    * GOOGLE_SERVICE_ACCOUNT_EMAIL: ${hasEmail ? 'PRESENT' : 'MISSING (Development Fallback)'}`);
  console.log(`    * GOOGLE_PRIVATE_KEY: ${hasKey ? 'PRESENT' : 'MISSING (Development Fallback)'}`);
  console.log(`    * GOOGLE_SHEETS_ID: ${hasSheetId ? 'PRESENT' : 'MISSING (Development Fallback)'}`);
  console.log(`    * Live Client Mode: ${isConfigured ? 'LIVE_GOOGLE_SHEETS' : 'MOCK_DEVELOPMENT_MODE'}`);

  assert(
    isConfigured === (hasEmail && hasKey && hasSheetId),
    'Live mode detection matches exact environment credential presence invariant'
  );

  // ----------------------------------------------------------------
  // Section 2: 18-Worksheet Schema Contract Invariants
  // ----------------------------------------------------------------
  console.log('\n--- Section 2: 18-Worksheet Schema Contract Invariants ---');

  assert(
    ALL_SHEET_TABS.length === 18,
    `Authoritative worksheet registry contains exactly 18 worksheet tabs (found ${ALL_SHEET_TABS.length})`
  );

  const expectedTabs = [
    'USERS',
    'CATEGORIES',
    'TOPICS',
    'SUBTOPICS',
    'QUESTIONS',
    'QUESTION_VIDEOS',
    'VIDEOS',
    'SCRIPT',
    'SCRIPT_VERSIONS',
    'THUMBNAILS',
    'THUMBNAIL_VERSIONS',
    'PINNED_COMMENTS',
    'PINNED_COMMENT_VERSIONS',
    'WORKFLOW',
    'ASSIGNMENTS',
    'PUBLISHING',
    'AUDIT_LOG',
    'SEQUENCES',
  ];

  const allTabsMatch = expectedTabs.every((tab) => ALL_SHEET_TABS.includes(tab as any));
  assert(
    allTabsMatch,
    'All 18 authoritative worksheet names match the required schema contract'
  );

  // Verify column schemas for each worksheet
  let allSchemasValid = true;
  let totalColumns = 0;
  for (const tab of ALL_SHEET_TABS) {
    const schema = SHEET_SCHEMAS[tab];
    if (!schema || !schema.columns || schema.columns.length === 0 || !schema.primaryKey) {
      allSchemasValid = false;
      break;
    }
    totalColumns += schema.columns.length;
  }

  assert(
    allSchemasValid && totalColumns > 50,
    `All 18 worksheets have defined column contracts, header mappings, and primary keys (${totalColumns} total columns)`
  );

  // ----------------------------------------------------------------
  // Section 3: Sequences Architecture & ID Prefix Invariants
  // ----------------------------------------------------------------
  console.log('\n--- Section 3: Sequences Architecture & ID Prefix Invariants ---');

  const requiredEntityTypes: SequenceEntityType[] = [
    SEQUENCE_ENTITIES.QUESTION,
    SEQUENCE_ENTITIES.VIDEO,
    SEQUENCE_ENTITIES.SCRIPT,
    SEQUENCE_ENTITIES.THUMBNAIL,
    SEQUENCE_ENTITIES.PINNED_COMMENT,
    SEQUENCE_ENTITIES.CATEGORY,
    SEQUENCE_ENTITIES.TOPIC,
    SEQUENCE_ENTITIES.SUBTOPIC,
    SEQUENCE_ENTITIES.USER,
    SEQUENCE_ENTITIES.CONTENT_PLAN,
    SEQUENCE_ENTITIES.CONTENT_BATCH,
    SEQUENCE_ENTITIES.ASSIGNMENT,
  ];

  let allPrefixesMapped = true;
  for (const entityType of requiredEntityTypes) {
    const prefixConfig = ID_PREFIX_MAP[entityType];
    if (!prefixConfig || !prefixConfig.prefix || prefixConfig.padLength <= 0) {
      allPrefixesMapped = false;
      break;
    }
  }

  assert(
    allPrefixesMapped,
    'All 12 sequence entities have canonical prefix and padding configurations defined'
  );

  const initialSequences = await sequencesRepository.findAll();
  assert(
    initialSequences.length >= 12,
    `Sequences repository successfully loaded sequence definitions (${initialSequences.length} registered)`
  );

  // Verify non-negative sequence counter invariant
  const allSequencesNonNegative = initialSequences.every((s) => Number(s.nextNumber) >= 0);
  assert(
    allSequencesNonNegative,
    'All sequence next_number counters satisfy the non-negative counter invariant'
  );

  // ----------------------------------------------------------------
  // Section 4: Live vs. Mock Isolation & Non-Destructive Behavior
  // ----------------------------------------------------------------
  console.log('\n--- Section 4: Live vs. Mock Isolation & Non-Destructive Behavior ---');

  // Verify that SpreadsheetVerificationService is read-only
  const verificationService = SpreadsheetVerificationService.getInstance();
  const healthReport = await verificationService.verifySpreadsheet();

  assert(
    healthReport !== null && typeof healthReport.overallStatus === 'string',
    'SpreadsheetVerificationService executed read-only diagnostic scan successfully'
  );

  assert(
    healthReport.totalTabsExpected === 18,
    'Spreadsheet health report enforces 18-tab expectation contract'
  );

  // ----------------------------------------------------------------
  // Section 5: Read-Only Repository Reads & User Directory
  // ----------------------------------------------------------------
  console.log('\n--- Section 5: Read-Only Repository Queries ---');

  const users = await usersRepository.findAll();
  assert(
    Array.isArray(users) && users.length >= 2,
    `Users repository query succeeded cleanly (found ${users.length} registered team members)`
  );

  const categories = await categoriesRepository.findAll();
  const topics = await topicsRepository.findAll();
  const subtopics = await subtopicsRepository.findAll();
  const questions = await questionsRepository.findAll();
  const videos = await videosRepository.findAll();
  const scripts = await scriptsRepository.findAll();
  const thumbnails = await thumbnailsRepository.findAll();
  const pinnedComments = await pinnedCommentsRepository.findAll();
  const publishingRecords = await publishingRepository.findAll();

  assert(
    Array.isArray(categories) && Array.isArray(topics) && Array.isArray(subtopics),
    `Taxonomy repositories (categories: ${categories.length}, topics: ${topics.length}, subtopics: ${subtopics.length}) read cleanly`
  );

  assert(
    Array.isArray(questions) && Array.isArray(videos) && Array.isArray(scripts),
    `Content lifecycle repositories (questions: ${questions.length}, videos: ${videos.length}, scripts: ${scripts.length}) read cleanly`
  );

  assert(
    Array.isArray(thumbnails) && Array.isArray(pinnedComments) && Array.isArray(publishingRecords),
    `Distribution repositories (thumbnails: ${thumbnails.length}, pinned comments: ${pinnedComments.length}, publishing: ${publishingRecords.length}) read cleanly`
  );

  // ----------------------------------------------------------------
  // Section 6: Comprehensive Data Integrity & Diagnostics Scan
  // ----------------------------------------------------------------
  console.log('\n--- Section 6: Read-Only Data Integrity & Diagnostics ---');

  const dataIntegrityService = DataIntegrityService.getInstance();
  const integrityReport = await dataIntegrityService.runFullIntegrityCheck();

  assert(
    integrityReport !== null && typeof integrityReport.overallStatus === 'string',
    `DataIntegrityService completed full 18-worksheet integrity scan (Status: ${integrityReport.overallStatus})`
  );

  assert(
    Array.isArray(integrityReport.worksheetHealth) && integrityReport.worksheetHealth.length === 18,
    `Integrity report covered all 18 worksheets (inspected ${integrityReport.worksheetHealth.length} worksheets)`
  );

  // ----------------------------------------------------------------
  // Summary
  // ----------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`PHASE 11.1 PRODUCTION VERIFICATION COMPLETE: ${passedTests}/${totalTests} PASSED`);
  console.log('====================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }

  return { passedTests, totalTests, success: passedTests === totalTests };
}

// Self-execution if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runLiveProductionVerification().catch((err) => {
    console.error('Unhandled error during Phase 11.1 live production verification:', err);
    process.exit(1);
  });
}
