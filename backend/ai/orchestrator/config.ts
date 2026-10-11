/**
 * BURRA PARIKSHA CMS - Centralized AI Configuration
 * Phase 6: AI Provider / Multi-Model Orchestration
 */

export interface AIConfiguration {
  defaultProvider: string;
  defaultModel: string;
  fallbackProviders: string[];
  allowedGeminiModels: string[];
  maxRetriesPerModel: number;
  maxTotalAttempts: number;
  timeoutMs: number;
  quotaRetryable: boolean;
  transientRetryable: boolean;
  backoffMs: number;
}

const envModel = process.env.GEMINI_MODEL;
const activeDefaultModel = (!envModel || envModel === 'gemini-3.7-flash')
  ? 'gemini-3.1-flash-lite'
  : envModel;

export const DEFAULT_AI_CONFIG: AIConfiguration = {
  defaultProvider: process.env.AI_DEFAULT_PROVIDER || 'gemini',
  defaultModel: activeDefaultModel,
  fallbackProviders: process.env.AI_FALLBACK_PROVIDERS ? process.env.AI_FALLBACK_PROVIDERS.split(',').map(s => s.trim()) : [],
  allowedGeminiModels: [
    'gemini-3.1-flash-lite',
    activeDefaultModel,
    'gemini-3.8-flash',
    'gemini-flash-latest',
  ].filter((m, idx, arr) => m && arr.indexOf(m) === idx),
  maxRetriesPerModel: 1, // Bounded: at most 1 retry per model
  maxTotalAttempts: 2,   // Bounded: at most 2 total attempts across candidate models
  timeoutMs: 30000,
  quotaRetryable: false, // Quota exhaustion must NOT cause rapid repeated calls to the same model
  transientRetryable: true,
  backoffMs: 500,
};
