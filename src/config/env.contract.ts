/**
 * BURRA PARIKSHA CMS — Authoritative Environment Contract & Validator
 *
 * Single Source of Truth for Application Runtime Environment Architecture:
 * - Canonical 8 Production Secrets & Variables for Google AI Studio & Local Dev
 * - Zero Secret Logging Invariant
 * - Fail-closed validation for mandatory production secrets
 * - Graceful degradation for feature-scoped capabilities
 */

import './env';

export interface EnvVariableDef {
  name: string;
  isSecret: boolean;
  requiredInProduction: boolean;
  featureScope: 'CORE_AUTH' | 'DATABASE' | 'AI' | 'MEDIA_DRIVE' | 'RUNTIME_OPTIONAL' | 'TEST' | 'LEGACY';
  description: string;
  safePlaceholder: string;
}

/**
 * THE CANONICAL 8 PRODUCTION SECRETS & CONFIGURATION VARIABLES
 * These are the EXACT variables that Google AI Studio requests from operators.
 */
export const CANONICAL_PRODUCTION_VARS: EnvVariableDef[] = [
  {
    name: 'SESSION_SECRET',
    isSecret: true,
    requiredInProduction: true,
    featureScope: 'CORE_AUTH',
    description: 'HMAC-SHA256 signature key for bp_session authentication cookies',
    safePlaceholder: '<generate-secure-64-char-random-string>',
  },
  {
    name: 'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    isSecret: false,
    requiredInProduction: false, // Optional if ambient GCP ADC is active
    featureScope: 'DATABASE',
    description: 'GCP Service Account email for privileged Firebase Admin SDK Firestore access',
    safePlaceholder: '<service-account@project-id.iam.gserviceaccount.com>',
  },
  {
    name: 'GOOGLE_PRIVATE_KEY',
    isSecret: true,
    requiredInProduction: false, // Optional if ambient GCP ADC is active
    featureScope: 'DATABASE',
    description: 'GCP Service Account RSA private key (PEM format) for Firebase Admin SDK',
    safePlaceholder: '"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"',
  },
  {
    name: 'GEMINI_API_KEY',
    isSecret: true,
    requiredInProduction: true,
    featureScope: 'AI',
    description: 'Google Gemini API key for Question Studio, scripting, and multi-layer verification',
    safePlaceholder: '<gemini-api-key>',
  },
  {
    name: 'GOOGLE_DRIVE_ROOT_FOLDER_ID',
    isSecret: false,
    requiredInProduction: true,
    featureScope: 'MEDIA_DRIVE',
    description: 'Google Drive root folder ID for video takes, master cuts, and thumbnail binaries',
    safePlaceholder: '<drive-folder-id>',
  },
  {
    name: 'GOOGLE_CLIENT_ID',
    isSecret: false,
    requiredInProduction: true,
    featureScope: 'MEDIA_DRIVE',
    description: 'Google OAuth 2.0 Client ID for Drive media upload delegation',
    safePlaceholder: '<client-id.apps.googleusercontent.com>',
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    isSecret: true,
    requiredInProduction: true,
    featureScope: 'MEDIA_DRIVE',
    description: 'Google OAuth 2.0 Client Secret for Drive media upload delegation',
    safePlaceholder: '<oauth-client-secret>',
  },
  {
    name: 'GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN',
    isSecret: true,
    requiredInProduction: true,
    featureScope: 'MEDIA_DRIVE',
    description: 'Persistent Google OAuth 2.0 refresh token for headless Drive operations',
    safePlaceholder: '<oauth-refresh-token>',
  },
];

/**
 * OPTIONAL RUNTIME CONFIGURATION (Built-in sensible defaults)
 */
export const OPTIONAL_RUNTIME_VARS: EnvVariableDef[] = [
  {
    name: 'NODE_ENV',
    isSecret: false,
    requiredInProduction: false,
    featureScope: 'RUNTIME_OPTIONAL',
    description: 'Runtime environment mode (development/production)',
    safePlaceholder: 'production',
  },
  {
    name: 'PORT',
    isSecret: false,
    requiredInProduction: false,
    featureScope: 'RUNTIME_OPTIONAL',
    description: 'Express HTTP listen port (defaults to 3000)',
    safePlaceholder: '3000',
  },
  {
    name: 'HOST',
    isSecret: false,
    requiredInProduction: false,
    featureScope: 'RUNTIME_OPTIONAL',
    description: 'Network binding host (defaults to 0.0.0.0)',
    safePlaceholder: '0.0.0.0',
  },
  {
    name: 'LOG_LEVEL',
    isSecret: false,
    requiredInProduction: false,
    featureScope: 'RUNTIME_OPTIONAL',
    description: 'Structured logger level (defaults to INFO)',
    safePlaceholder: 'INFO',
  },
  {
    name: 'GEMINI_MODEL',
    isSecret: false,
    requiredInProduction: false,
    featureScope: 'RUNTIME_OPTIONAL',
    description: 'Default Gemini model identifier (defaults to gemini-3.1-flash-lite)',
    safePlaceholder: 'gemini-3.1-flash-lite',
  },
  {
    name: 'GOOGLE_REDIRECT_URI',
    isSecret: false,
    requiredInProduction: false,
    featureScope: 'RUNTIME_OPTIONAL',
    description: 'OAuth redirect callback URI (defaults to http://localhost:3000/api/auth/google/callback)',
    safePlaceholder: 'http://localhost:3000/api/auth/google/callback',
  },
  {
    name: 'GCP_PROJECT_ID',
    isSecret: false,
    requiredInProduction: false,
    featureScope: 'RUNTIME_OPTIONAL',
    description: 'GCP Project ID override (defaults to burra-pariksha-cms from firebase config)',
    safePlaceholder: 'burra-pariksha-cms',
  },
  {
    name: 'FIRESTORE_DATABASE_ID',
    isSecret: false,
    requiredInProduction: false,
    featureScope: 'RUNTIME_OPTIONAL',
    description: 'Firestore named database ID override (defaults to firebase config)',
    safePlaceholder: 'ai-studio-burraparikshacon-f592ca42-39af-4d83-aff2-6870ba939b0e',
  },
  {
    name: 'MAX_THUMBNAIL_SIZE_BYTES',
    isSecret: false,
    requiredInProduction: false,
    featureScope: 'RUNTIME_OPTIONAL',
    description: 'Thumbnail max file size in bytes (defaults to 5242880)',
    safePlaceholder: '5242880',
  },
  {
    name: 'MAX_VIDEO_SIZE_BYTES',
    isSecret: false,
    requiredInProduction: false,
    featureScope: 'RUNTIME_OPTIONAL',
    description: 'Video take max file size in bytes (defaults to 104857600)',
    safePlaceholder: '104857600',
  },
];

export interface ValidationReport {
  isProduction: boolean;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  configuredCanonicalCount: number;
  totalCanonicalCount: number;
}

export function isVariableConfigured(value: string | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed === '') return false;
  if (
    trimmed.startsWith('REPLACE_WITH_') ||
    trimmed.startsWith('<generate-') ||
    trimmed.startsWith('<service-') ||
    trimmed.startsWith('<your-') ||
    trimmed.startsWith('<gemini-') ||
    trimmed.startsWith('<drive-') ||
    trimmed.startsWith('<client-') ||
    trimmed.startsWith('<oauth-')
  ) {
    return false;
  }
  return true;
}

/**
 * Validates application runtime environment against the authoritative contract.
 * Does NOT fail on optional, test, or legacy variables.
 */
export function validateEnvironmentRuntime(): ValidationReport {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors: string[] = [];
  const warnings: string[] = [];

  let configuredCanonicalCount = 0;

  for (const v of CANONICAL_PRODUCTION_VARS) {
    const configured = isVariableConfigured(process.env[v.name]);
    if (configured) {
      configuredCanonicalCount++;
    } else {
      if (isProduction && v.name === 'SESSION_SECRET') {
        errors.push(`MANDATORY: ${v.name} is required in production for secure session signing.`);
      } else if (v.featureScope === 'DATABASE') {
        // Firebase Admin SDK supports ambient ADC fallback in Google Cloud runtimes
        warnings.push(`INFO: ${v.name} is not set; runtime will rely on Application Default Credentials (ADC).`);
      } else if (v.featureScope === 'AI') {
        warnings.push(`FEATURE: ${v.name} is not configured; AI Question Studio features will be disabled.`);
      } else if (v.featureScope === 'MEDIA_DRIVE') {
        warnings.push(`FEATURE: ${v.name} is not configured; Google Drive media uploads will be disabled.`);
      }
    }
  }

  const isValid = errors.length === 0;

  return {
    isProduction,
    isValid,
    errors,
    warnings,
    configuredCanonicalCount,
    totalCanonicalCount: CANONICAL_PRODUCTION_VARS.length,
  };
}
