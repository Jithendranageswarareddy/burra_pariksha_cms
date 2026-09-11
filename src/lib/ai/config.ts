/**
 * BURRA PARIKSHA CMS - Centralized AI Configuration
 * Phase 6: AI Provider / Multi-Model Orchestration
 */

export interface AIConfiguration {
  defaultProvider: string;
  defaultModel: string;
  fallbackProviders: string[];
  defaultVerifierProvider: string;
  fallbackVerifierProviders: string[];
  allowedGeminiModels: string[];
  maxRetriesPerModel: number;
  maxTotalAttempts: number;
  timeoutMs: number;
  quotaRetryable: boolean;
  transientRetryable: boolean;
  backoffMs: number;
}

/**
 * Safely parses comma-separated provider lists from environment variables,
 * trimming whitespace, normalizing to lowercase, filtering empty values, and removing duplicates.
 */
export function parseProviderList(raw?: string): string[] {
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s, idx, arr) => s.length > 0 && arr.indexOf(s) === idx);
}

const envModel = process.env.GEMINI_MODEL;
const activeDefaultModel = (!envModel || envModel === 'gemini-3.7-flash')
  ? 'gemini-3.1-flash-lite'
  : envModel;

export const DEFAULT_AI_CONFIG: AIConfiguration = {
  defaultProvider: (process.env.AI_DEFAULT_PROVIDER || 'gemini').trim().toLowerCase(),
  defaultModel: activeDefaultModel,
  fallbackProviders: parseProviderList(process.env.AI_FALLBACK_PROVIDERS),
  defaultVerifierProvider: (process.env.AI_DEFAULT_VERIFIER_PROVIDER || 'gemini-blind-verifier').trim().toLowerCase(),
  fallbackVerifierProviders: parseProviderList(process.env.AI_FALLBACK_VERIFIER_PROVIDERS),
  allowedGeminiModels: [
    'gemini-3.1-flash-lite',
    activeDefaultModel,
    'gemini-flash-latest',
  ].filter((m, idx, arr) => m && arr.indexOf(m) === idx),
  maxRetriesPerModel: 1, // Bounded: at most 1 retry per model
  maxTotalAttempts: 2,   // Bounded: at most 2 total attempts across candidate models
  timeoutMs: 30000,
  quotaRetryable: false, // Quota exhaustion must NOT cause rapid repeated calls to the same model
  transientRetryable: true,
  backoffMs: 500,
};

export const DEFAULT_XAI_MODEL = process.env.XAI_MODEL || 'grok-4.6';
export const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
