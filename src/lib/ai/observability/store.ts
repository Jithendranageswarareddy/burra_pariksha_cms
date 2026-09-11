/**
 * BURRA PARIKSHA CMS - AI Usage In-Memory Store
 * Phase 23: AI Quota Tracking & Daily Usage Observability
 * 
 * High-performance, in-memory circular event buffer and rolling 7-day daily accumulator.
 * Boundaries are strictly calculated in Asia/Kolkata (IST, UTC+5:30).
 * 
 * LIMITATION (PHASE 23):
 * Process restart discards telemetry. All data resides in Node.js memory.
 * No external Sheets, database, or filesystem writes.
 */

import {
  AIUsageEvent,
  AIUsageOperation,
  AIDailyUsageAggregate,
  ProviderModelAggregate,
  OperationLogicalMetrics,
  SanitizedAIFailure,
  AIUsageSummary,
} from './types';
import { evaluateProviderQuota } from './config';

/** Maximum recent granular events kept in ring buffer */
const MAX_RECENT_EVENTS = 100;
/** Maximum rolling daily aggregate history kept in memory */
const MAX_DAILY_RETENTION_DAYS = 7;

/**
 * Safely formats a given Date/timestamp into an IST YYYY-MM-DD string.
 */
export function getKolkataDateString(dateInput?: Date | string | number): string {
  const d = dateInput instanceof Date
    ? dateInput
    : (dateInput !== undefined && dateInput !== null ? new Date(dateInput) : new Date());
  
  if (isNaN(d.getTime())) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export class AIUsageStore {
  private recentEvents: AIUsageEvent[] = [];
  private dailyAggregates: Map<string, AIDailyUsageAggregate> = new Map();

  /**
   * Initializes empty provider-model aggregate object.
   */
  private createEmptyProviderModelAggregate(): ProviderModelAggregate {
    return {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      retryAttempts: 0,
      fallbackInvocations: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      averageLatencyMs: 0,
      errorCounts: {},
    };
  }

  /**
   * Initializes empty operation logical metrics.
   */
  private createEmptyLogicalMetrics(): OperationLogicalMetrics {
    return {
      logicalRequests: 0,
      logicalSuccesses: 0,
      logicalFailures: 0,
    };
  }

  /**
   * Gets or initializes the daily aggregate for a specific IST date.
   */
  private getOrCreateDailyAggregate(istDate: string): AIDailyUsageAggregate {
    let aggregate = this.dailyAggregates.get(istDate);
    if (!aggregate) {
      aggregate = {
        date: istDate,
        operations: {
          GENERATION: this.createEmptyLogicalMetrics(),
          VERIFICATION: this.createEmptyLogicalMetrics(),
        },
        providers: {},
      };
      this.dailyAggregates.set(istDate, aggregate);
      this.pruneOldDailyAggregates();
    }
    return aggregate;
  }

  /**
   * Enforces rolling 7-day retention policy.
   * Evicts oldest dates when distinct days exceed MAX_DAILY_RETENTION_DAYS.
   */
  private pruneOldDailyAggregates(): void {
    if (this.dailyAggregates.size <= MAX_DAILY_RETENTION_DAYS) {
      return;
    }

    const sortedDates = Array.from(this.dailyAggregates.keys()).sort();
    while (sortedDates.length > MAX_DAILY_RETENTION_DAYS) {
      const oldest = sortedDates.shift();
      if (oldest) {
        this.dailyAggregates.delete(oldest);
      }
    }
  }

  /**
   * Records a single physical upstream attempt event.
   * Updates FIFO ring buffer (max 100) and daily rolling aggregate.
   */
  public recordEvent(event: AIUsageEvent): void {
    if (!event || typeof event !== 'object') return;

    // 1. Append to recent events ring buffer (enforce bounded capacity)
    this.recentEvents.push({ ...event });
    if (this.recentEvents.length > MAX_RECENT_EVENTS) {
      this.recentEvents.splice(0, this.recentEvents.length - MAX_RECENT_EVENTS);
    }

    // 2. Aggregate into appropriate IST day
    const istDate = getKolkataDateString(event.timestamp);
    const daily = this.getOrCreateDailyAggregate(istDate);

    const providerId = (event.providerId || 'unknown').toLowerCase();
    const modelId = event.modelId || 'unknown';

    if (!daily.providers[providerId]) {
      daily.providers[providerId] = {};
    }
    if (!daily.providers[providerId][modelId]) {
      daily.providers[providerId][modelId] = this.createEmptyProviderModelAggregate();
    }

    const agg = daily.providers[providerId][modelId];

    // Physical attempt accounting
    const prevAttempts = agg.totalAttempts;
    agg.totalAttempts += 1;

    if (event.success) {
      agg.successfulAttempts += 1;
    } else {
      agg.failedAttempts += 1;
      if (event.errorCategory) {
        agg.errorCounts[event.errorCategory] = (agg.errorCounts[event.errorCategory] || 0) + 1;
      }
    }

    // Retry attempts: 1-based attemptNumber > 1 within same provider
    if (event.attemptNumber > 1) {
      agg.retryAttempts += 1;
    }

    // Fallback invocations
    if (event.fallbackUsed) {
      agg.fallbackInvocations += 1;
    }

    // Cumulative Latency average
    agg.averageLatencyMs = Math.round(
      (agg.averageLatencyMs * prevAttempts + event.latencyMs) / agg.totalAttempts
    );

    // Token accounting: never estimate or invent
    if (event.inputTokens !== null && event.inputTokens !== undefined) {
      agg.totalInputTokens += event.inputTokens;
    }
    if (event.outputTokens !== null && event.outputTokens !== undefined) {
      agg.totalOutputTokens += event.outputTokens;
    }
    if (event.totalTokens !== null && event.totalTokens !== undefined) {
      agg.totalTokens += event.totalTokens;
    }
  }

  /**
   * Records an operation-level logical request.
   * Prevents multi-provider failover chains from double-counting logical requests.
   */
  public recordLogicalRequest(
    operation: AIUsageOperation,
    success: boolean,
    requestId?: string | null,
    timestamp?: string
  ): void {
    const istDate = getKolkataDateString(timestamp || new Date().toISOString());
    const daily = this.getOrCreateDailyAggregate(istDate);

    const opMetrics = daily.operations[operation] || this.createEmptyLogicalMetrics();
    daily.operations[operation] = opMetrics;

    opMetrics.logicalRequests += 1;
    if (success) {
      opMetrics.logicalSuccesses += 1;
    } else {
      opMetrics.logicalFailures += 1;
    }
  }

  /**
   * Retrieves up to `limit` recent granular events (newest last).
   */
  public getRecentEvents(limit: number = MAX_RECENT_EVENTS): AIUsageEvent[] {
    const safeLimit = Math.min(Math.max(1, limit), MAX_RECENT_EVENTS);
    return this.recentEvents.slice(-safeLimit);
  }

  /**
   * Extracts sanitized failure representations from recent events.
   * Strictly avoids storing/exposing raw prompts, credentials, or payloads.
   */
  public getRecentFailures(limit: number = 20): SanitizedAIFailure[] {
    const failures: SanitizedAIFailure[] = [];
    for (let i = this.recentEvents.length - 1; i >= 0; i--) {
      const evt = this.recentEvents[i];
      if (!evt.success) {
        failures.push({
          timestamp: evt.timestamp,
          requestId: evt.requestId || null,
          operation: evt.operation,
          providerId: evt.providerId,
          modelId: evt.modelId,
          attemptNumber: evt.attemptNumber,
          fallbackUsed: evt.fallbackUsed,
          success: false,
          httpStatus: evt.httpStatus || null,
          errorCategory: evt.errorCategory || null,
          latencyMs: evt.latencyMs,
        });
        if (failures.length >= limit) break;
      }
    }
    return failures;
  }

  /**
   * Retrieves daily aggregates optionally filtered by start and end IST date strings.
   */
  public getDailyAggregates(startDate?: string, endDate?: string): AIDailyUsageAggregate[] {
    const sorted = Array.from(this.dailyAggregates.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return sorted.filter((item) => {
      if (startDate && item.date < startDate) return false;
      if (endDate && item.date > endDate) return false;
      return true;
    });
  }

  /**
   * Produces a comprehensive summary for today (or specified IST date).
   */
  public getTodaySummary(customDate?: string): AIUsageSummary {
    const targetDate = customDate || getKolkataDateString();
    const daily = this.dailyAggregates.get(targetDate) || {
      date: targetDate,
      operations: {
        GENERATION: this.createEmptyLogicalMetrics(),
        VERIFICATION: this.createEmptyLogicalMetrics(),
      },
      providers: {},
    };

    const providersSummary: AIUsageSummary['providers'] = {};
    const quotasSummary: AIUsageSummary['quotas'] = {};

    for (const [providerId, models] of Object.entries(daily.providers)) {
      let totalAttempts = 0;
      let successfulAttempts = 0;
      let failedAttempts = 0;
      let retryAttempts = 0;
      let fallbackInvocations = 0;
      let totalTokens = 0;
      let latencySum = 0;

      for (const agg of Object.values(models)) {
        totalAttempts += agg.totalAttempts;
        successfulAttempts += agg.successfulAttempts;
        failedAttempts += agg.failedAttempts;
        retryAttempts += agg.retryAttempts;
        fallbackInvocations += agg.fallbackInvocations;
        totalTokens += agg.totalTokens;
        latencySum += agg.averageLatencyMs * agg.totalAttempts;
      }

      providersSummary[providerId] = {
        totalAttempts,
        successfulAttempts,
        failedAttempts,
        retryAttempts,
        fallbackInvocations,
        totalTokens,
        averageLatencyMs: totalAttempts > 0 ? Math.round(latencySum / totalAttempts) : 0,
        models,
      };

      // Evaluate quota for this provider
      quotasSummary[providerId] = evaluateProviderQuota(providerId, totalAttempts);
    }

    return {
      date: targetDate,
      operations: daily.operations,
      providers: providersSummary,
      quotas: quotasSummary,
      recentFailures: this.getRecentFailures(10),
    };
  }

  /**
   * Resets all internal stores. Used for deterministic testing.
   */
  public clear(): void {
    this.recentEvents = [];
    this.dailyAggregates.clear();
  }
}

export const aiUsageStore = new AIUsageStore();
