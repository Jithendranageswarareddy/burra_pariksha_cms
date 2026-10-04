/**
 * BURRA PARIKSHA CMS — Safe Local Environment Configuration Status Tool
 *
 * Scans process.env (after loading .env.local via src/config/env) and reports
 * the configuration status for all 44 application variables.
 *
 * CRITICAL SECURITY INVARIANT:
 * - Reports ONLY: VARIABLE_NAME = PRESENT or VARIABLE_NAME = MISSING
 * - NEVER prints or logs actual values, credentials, tokens, or lengths.
 */

import '../src/config/env';
import fs from 'fs';
import path from 'path';

interface VariableGroup {
  groupName: string;
  variables: { name: string; required: boolean; description: string }[];
}

const VARIABLE_GROUPS: VariableGroup[] = [
  {
    groupName: '1. CORE RUNTIME & NETWORKING',
    variables: [
      { name: 'NODE_ENV', required: false, description: 'Runtime mode (development/production)' },
      { name: 'PORT', required: false, description: 'Express server port' },
      { name: 'HOST', required: false, description: 'Server host interface binding' },
      { name: 'LOG_LEVEL', required: false, description: 'Structured logger verbosity' },
      { name: 'DISABLE_HMR', required: false, description: 'Vite Hot Module Reloading toggle' },
    ],
  },
  {
    groupName: '2. AUTHENTICATION & SECURITY',
    variables: [
      { name: 'SESSION_SECRET', required: true, description: 'HMAC-SHA256 session token signature secret' },
      { name: 'INITIAL_ADMIN_PASSWORD', required: false, description: 'Default administrator bootstrap password' },
      { name: 'BOOTSTRAP_SECRET', required: false, description: 'Secret for /api/sheets/initialize endpoint' },
    ],
  },
  {
    groupName: '3. GOOGLE SHEETS PRIMARY DATABASE',
    variables: [
      { name: 'GOOGLE_SHEETS_ID', required: true, description: 'Primary 25-tab Google Spreadsheet ID' },
      { name: 'GOOGLE_SERVICE_ACCOUNT_EMAIL', required: true, description: 'GCP Service Account email' },
      { name: 'GOOGLE_PRIVATE_KEY', required: true, description: 'GCP Service Account RSA Private Key' },
      { name: 'SKIP_SHEETS_SYNC', required: false, description: 'Bypass Sheets sync toggle' },
    ],
  },
  {
    groupName: '4. GOOGLE DRIVE MEDIA INFRASTRUCTURE',
    variables: [
      { name: 'GOOGLE_DRIVE_ROOT_FOLDER_ID', required: true, description: 'Root folder ID for takes & media' },
      { name: 'GOOGLE_CLIENT_ID', required: false, description: 'OAuth 2.0 Client ID for Drive delegation' },
      { name: 'GOOGLE_CLIENT_SECRET', required: false, description: 'OAuth 2.0 Client Secret for Drive delegation' },
      { name: 'GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN', required: false, description: 'Persistent OAuth 2.0 refresh token' },
      { name: 'GOOGLE_REDIRECT_URI', required: false, description: 'OAuth callback URL' },
      { name: 'SKIP_DRIVE_SYNC', required: false, description: 'Bypass Drive media sync toggle' },
    ],
  },
  {
    groupName: '5. GOOGLE GEMINI AI (PRIMARY ASSISTIVE ENGINE)',
    variables: [
      { name: 'GEMINI_API_KEY', required: true, description: 'Google Gemini AI Studio API key' },
      { name: 'GEMINI_MODEL', required: false, description: 'Gemini model identifier' },
    ],
  },
  {
    groupName: '6. ISOLATED SOCIAL ANALYTICS WORKBOOK',
    variables: [
      { name: 'ANALYTICS_SPREADSHEET_ID', required: false, description: 'Dedicated analytics spreadsheet ID' },
    ],
  },
  {
    groupName: '7. DISASTER RECOVERY & SNAPSHOT ARCHIVE (GCS)',
    variables: [
      { name: 'GCS_SNAPSHOT_BUCKET', required: false, description: 'GCS bucket name for snapshot archives' },
      { name: 'GCS_SNAPSHOT_ENABLED', required: false, description: 'Snapshot archiving enabled toggle' },
      { name: 'GCS_SNAPSHOT_RETENTION_DAYS', required: false, description: 'Snapshot retention duration in days' },
      { name: 'GCS_SNAPSHOT_SCHEDULE_ENABLED', required: false, description: 'Automated periodic snapshot toggle' },
      { name: 'GCS_SNAPSHOT_INTERVAL_HOURS', required: false, description: 'Interval in hours between snapshots' },
      { name: 'GCS_SNAPSHOT_RETENTION_CLEANUP_ENABLED', required: false, description: 'Auto-cleanup expired snapshots' },
      { name: 'GCS_SNAPSHOT_MIN_KEEP_COUNT', required: false, description: 'Minimum snapshots protected from cleanup' },
    ],
  },
  {
    groupName: '8. GOOGLE CLOUD PLATFORM & FIRESTORE NATIVE',
    variables: [
      { name: 'GCP_PROJECT_ID', required: false, description: 'Google Cloud Project ID' },
      { name: 'GOOGLE_CLOUD_PROJECT', required: false, description: 'Alternative GCP Project ID' },
      { name: 'FIRESTORE_DATABASE_ID', required: false, description: 'Firestore native database ID' },
    ],
  },
  {
    groupName: '9. MEDIA UPLOAD LIMITS',
    variables: [
      { name: 'MAX_THUMBNAIL_SIZE_BYTES', required: false, description: 'Maximum thumbnail size in bytes' },
      { name: 'MAX_VIDEO_SIZE_BYTES', required: false, description: 'Maximum video file size in bytes' },
    ],
  },
  {
    groupName: '10. MULTI-PROVIDER AI CONFIGURATION (OPTIONAL)',
    variables: [
      { name: 'AI_DEFAULT_PROVIDER', required: false, description: 'Default AI provider selection' },
      { name: 'AI_FALLBACK_PROVIDERS', required: false, description: 'Fallback AI providers' },
      { name: 'GROQ_API_KEY', required: false, description: 'Groq API key' },
      { name: 'MISTRAL_API_KEY', required: false, description: 'Mistral API key' },
      { name: 'CEREBRAS_API_KEY', required: false, description: 'Cerebras API key' },
      { name: 'COHERE_API_KEY', required: false, description: 'Cohere API key' },
      { name: 'OPENROUTER_API_KEY', required: false, description: 'OpenRouter API key' },
      { name: 'XAI_API_KEY', required: false, description: 'xAI API key' },
      { name: 'HUGGING_FACE_API_KEY', required: false, description: 'Hugging Face API key' },
      { name: 'EXPERIMENTAL_LABS_API_KEY', required: false, description: 'Experimental Labs key' },
      { name: 'EXPERIMENTAL_LABS_ENDPOINT_URL', required: false, description: 'Experimental Labs endpoint' },
    ],
  },
];

function isConfigured(value: string | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed === '') return false;
  if (trimmed.startsWith('REPLACE_WITH_')) return false;
  return true;
}

function runCheck(): void {
  const cwd = process.cwd();
  const envLocalExists = fs.existsSync(path.resolve(cwd, '.env.local'));
  const envExists = fs.existsSync(path.resolve(cwd, '.env'));
  const envLocalExampleExists = fs.existsSync(path.resolve(cwd, '.env.local.example'));

  console.log('==================================================================');
  console.log('BURRA PARIKSHA CMS — LOCAL ENVIRONMENT STATUS REPORT');
  console.log('==================================================================');
  console.log(`Local file detection:`);
  console.log(`  .env.local         : ${envLocalExists ? 'PRESENT (Active local overrides)' : 'MISSING'}`);
  console.log(`  .env               : ${envExists ? 'PRESENT (Baseline)' : 'NOT PRESENT'}`);
  console.log(`  .env.local.example : ${envLocalExampleExists ? 'PRESENT (Committed template)' : 'MISSING'}`);
  console.log('==================================================================\n');

  let totalVariables = 0;
  let presentCount = 0;
  let missingCount = 0;

  for (const group of VARIABLE_GROUPS) {
    console.log(`[${group.groupName}]`);
    for (const v of group.variables) {
      totalVariables++;
      const val = process.env[v.name];
      const configured = isConfigured(val);
      if (configured) {
        presentCount++;
        console.log(`  ${v.name.padEnd(35)} = PRESENT`);
      } else {
        missingCount++;
        console.log(`  ${v.name.padEnd(35)} = MISSING`);
      }
    }
    console.log('');
  }

  console.log('==================================================================');
  console.log(`SUMMARY: ${presentCount} PRESENT, ${missingCount} MISSING (Total: ${totalVariables})`);
  console.log('SECURITY AUDIT: Zero secret values exposed or logged.');
  console.log('==================================================================');
}

runCheck();
