/**
 * BURRA PARIKSHA CMS - AI Observability Quota Configuration
 * Phase 23: AI Quota Tracking & Daily Usage Observability
 * 
 * Configurable application-level quota ceilings.
 * Ceilings default to null (unbounded). Vendor limits are NOT hardcoded.
 */

import { ProviderQuotaEvaluation, QuotaStatus } from './types';

/**
 * Retrieves the configured daily physical attempt ceiling for a given provider.
 * Looks up environment variable pattern: AI_{PROVIDER_UPPER}_DAILY_LIMIT
 * Returns null if unbounded, unconfigured, or invalid.
 */
export function getProviderDailyLimit(providerId: string): number | null {
  if (!providerId || typeof providerId !== 'string') return null;
  const envKey = `AI_${providerId.trim().toUpperCase()}_DAILY_LIMIT`;
  const rawVal = process.env[envKey];
  if (!rawVal || typeof rawVal !== 'string') return null;

  const parsed = parseInt(rawVal.trim(), 10);
  if (isNaN(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

/**
 * Evaluates provider quota status against configured ceiling.
 * Thresholds:
 * - NORMAL: < 80% of limit
 * - WARNING: >= 80% and < 100% of limit
 * - EXHAUSTED: >= 100% of limit
 * - UNBOUNDED: limit is null
 */
export function evaluateProviderQuota(
  providerId: string,
  currentRequests: number,
  customLimit?: number | null
): ProviderQuotaEvaluation {
  const normalizedId = providerId.trim().toLowerCase();
  const dailyLimit = customLimit !== undefined ? customLimit : getProviderDailyLimit(normalizedId);

  if (dailyLimit === null || dailyLimit <= 0) {
    return {
      providerId: normalizedId,
      dailyLimit: null,
      currentRequests,
      usagePercentage: null,
      status: 'UNBOUNDED',
    };
  }

  const usageRatio = currentRequests / dailyLimit;
  const usagePercentage = Math.round(usageRatio * 1000) / 10; // 1 decimal place

  let status: QuotaStatus = 'NORMAL';
  if (usageRatio >= 1.0) {
    status = 'EXHAUSTED';
  } else if (usageRatio >= 0.8) {
    status = 'WARNING';
  }

  return {
    providerId: normalizedId,
    dailyLimit,
    currentRequests,
    usagePercentage,
    status,
  };
}
