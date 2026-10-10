/**
 * BURRA PARIKSHA CMS — Safe Local Environment Configuration Status Tool
 *
 * Scans process.env (after loading .env.local via src/config/env) and reports
 * the configuration status against the Authoritative Environment Contract:
 * - 1. CANONICAL PRODUCTION SECRETS (The 8 requested by Google AI Studio)
 * - 2. RUNTIME NETWORKING & OPERATIONAL CONFIGURATION
 * - 3. OPTIONAL / LEGACY SUPPORT SERVICES
 *
 * CRITICAL SECURITY INVARIANT:
 * - Reports ONLY: VARIABLE_NAME = PRESENT or VARIABLE_NAME = MISSING
 * - NEVER prints or logs actual values, credentials, tokens, or lengths.
 */

import '../src/config/env';
import fs from 'fs';
import path from 'path';
import {
  CANONICAL_PRODUCTION_VARS,
  OPTIONAL_RUNTIME_VARS,
  isVariableConfigured,
  validateEnvironmentRuntime,
} from '../src/config/env.contract';

function runCheck(): void {
  const cwd = process.cwd();
  const envLocalExists = fs.existsSync(path.resolve(cwd, '.env.local'));
  const envExists = fs.existsSync(path.resolve(cwd, '.env'));
  const envLocalExampleExists = fs.existsSync(path.resolve(cwd, '.env.local.example'));
  const envExampleExists = fs.existsSync(path.resolve(cwd, '.env.example'));

  console.log('==================================================================');
  console.log('BURRA PARIKSHA CMS — AUTHORITATIVE ENVIRONMENT STATUS REPORT');
  console.log('==================================================================');
  console.log('Local Configuration Files:');
  console.log(`  .env.local         : ${envLocalExists ? 'PRESENT (Active local secrets)' : 'MISSING'}`);
  console.log(`  .env               : ${envExists ? 'PRESENT (Local baseline)' : 'NOT PRESENT'}`);
  console.log(`  .env.example       : ${envExampleExists ? 'PRESENT (Authoritative AI Studio template)' : 'MISSING'}`);
  console.log(`  .env.local.example : ${envLocalExampleExists ? 'PRESENT (Local developer template)' : 'MISSING'}`);
  console.log('==================================================================\n');

  // 1. CANONICAL PRODUCTION SECRETS
  console.log('[1. CANONICAL PRODUCTION SECRETS (Required by Google AI Studio)]');
  let canonicalConfigured = 0;
  for (const v of CANONICAL_PRODUCTION_VARS) {
    const val = process.env[v.name];
    const configured = isVariableConfigured(val);
    if (configured) {
      canonicalConfigured++;
      console.log(`  ✓ ${v.name.padEnd(35)} = PRESENT (${v.isSecret ? 'SECRET' : 'CONFIG'})`);
    } else {
      console.log(`  ✗ ${v.name.padEnd(35)} = MISSING [${v.description}]`);
    }
  }
  console.log(`  Summary: ${canonicalConfigured}/${CANONICAL_PRODUCTION_VARS.length} canonical variables configured.\n`);

  // 2. RUNTIME NETWORKING & OPERATIONAL OVERRIDES
  console.log('[2. RUNTIME NETWORKING & OPERATIONAL CONFIGURATION (Built-in defaults)]');
  for (const v of OPTIONAL_RUNTIME_VARS) {
    const val = process.env[v.name];
    const configured = isVariableConfigured(val);
    if (configured) {
      console.log(`  ✓ ${v.name.padEnd(35)} = CONFIGURED (OVERRIDE)`);
    } else {
      console.log(`  - ${v.name.padEnd(35)} = DEFAULT ACTIVE (${v.safePlaceholder})`);
    }
  }
  console.log('');

  // 3. RUNTIME VALIDATION EVALUATION
  console.log('==================================================================');
  const report = validateEnvironmentRuntime();
  console.log(`RUNTIME VALIDATION (${report.isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} MODE):`);
  if (report.isValid) {
    console.log('  STATUS: PASSED — Core mandatory secrets are satisfied.');
  } else {
    console.log('  STATUS: FAILED — Missing required production secrets:');
    for (const err of report.errors) {
      console.log(`    - ${err}`);
    }
  }

  if (report.warnings.length > 0) {
    console.log('  OBSERVATIONS:');
    for (const warn of report.warnings) {
      console.log(`    - ${warn}`);
    }
  }

  console.log('==================================================================');
  console.log('SECURITY AUDIT: Zero secret values exposed or logged.');
  console.log('==================================================================');
}

runCheck();
