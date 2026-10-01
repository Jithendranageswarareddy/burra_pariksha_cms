/**
 * BURRA PARIKSHA CMS - Phase 24 Base AI Provider Adapter
 * Encapsulates common state, health tracking, secret protection, retry logic, and error sanitization.
 */

import {
  AIFailureCategory,
  AINormalizedResponse,
  AIProviderHealth,
  AIProviderHealthState,
  AIProviderId,
  AIProviderMetadata,
  AIRateLimitState,
  AIRetryPolicy,
  AIRequest,
  AITaskType,
  IAIProvider,
} from '../../../types/ai';

export abstract class BaseAIProviderAdapter implements IAIProvider {
  public abstract readonly providerId: AIProviderId;
  public abstract readonly displayName: string;
  public isEnabled: boolean = true;

  protected supportedCapabilities: AITaskType[] = ['GENERATION', 'VERIFICATION', 'ANALYSIS', 'REFINEMENT'];
  protected supportedModels: string[] = [];
  protected defaultModelId: string = 'default-model';
  protected priority: number = 10;
  protected timeoutMs: number = 10000;
  protected retryPolicy: AIRetryPolicy = {
    maxRetries: 2,
    initialBackoffMs: 300,
    backoffFactor: 2,
  };

  protected healthState: AIProviderHealthState = 'UNCONFIGURED';
  protected rateLimitState: AIRateLimitState = { isRateLimited: false };
  protected lastSuccessAt?: string;
  protected lastFailureAt?: string;
  protected lastErrorClassification?: AIFailureCategory;
  protected consecutiveFailures: number = 0;
  protected latencyHistoryMs: number[] = [];

  public abstract isConfigured(): boolean;
  protected abstract executeProviderCall(request: AIRequest, modelId: string): Promise<{ text: string; data?: any }>;

  public supportsCapability(task: AITaskType): boolean {
    return this.supportedCapabilities.includes(task);
  }

  public getMetadata(): AIProviderMetadata {
    const configured = this.isConfigured();
    let currentHealth = this.healthState;

    if (!configured) {
      currentHealth = 'UNCONFIGURED';
    } else if (this.rateLimitState.isRateLimited) {
      if (this.rateLimitState.rateLimitResetAt && new Date().toISOString() > this.rateLimitState.rateLimitResetAt) {
        this.rateLimitState.isRateLimited = false;
        currentHealth = 'HEALTHY';
      } else {
        currentHealth = 'RATE_LIMITED';
      }
    } else if (this.consecutiveFailures >= 3) {
      currentHealth = 'UNAVAILABLE';
    } else if (this.consecutiveFailures > 0) {
      currentHealth = 'DEGRADED';
    } else {
      currentHealth = 'HEALTHY';
    }

    const avgLatency =
      this.latencyHistoryMs.length > 0
        ? Math.round(this.latencyHistoryMs.reduce((a, b) => a + b, 0) / this.latencyHistoryMs.length)
        : undefined;

    return {
      providerId: this.providerId,
      displayName: this.displayName,
      isEnabled: this.isEnabled,
      isConfigured: configured,
      supportedCapabilities: [...this.supportedCapabilities],
      supportedModels: [...this.supportedModels],
      defaultModelId: this.defaultModelId,
      healthState: currentHealth,
      priority: this.priority,
      timeoutMs: this.timeoutMs,
      retryPolicy: { ...this.retryPolicy },
      rateLimitState: { ...this.rateLimitState },
      lastSuccessAt: this.lastSuccessAt,
      lastFailureAt: this.lastFailureAt,
      lastErrorClassification: this.lastErrorClassification,
      consecutiveFailures: this.consecutiveFailures,
      avgLatencyMs: avgLatency,
    };
  }

  public async checkHealth(): Promise<AIProviderHealth> {
    const meta = this.getMetadata();
    return {
      providerId: this.providerId,
      healthState: meta.healthState,
      isConfigured: meta.isConfigured,
      latencyMs: meta.avgLatencyMs,
      lastCheckedAt: new Date().toISOString(),
      message: meta.isConfigured
        ? `Provider ${this.displayName} is in state ${meta.healthState}`
        : `Provider ${this.displayName} is UNCONFIGURED (missing environment API key)`,
    };
  }

  public recordSuccess(latencyMs: number): void {
    this.consecutiveFailures = 0;
    this.lastSuccessAt = new Date().toISOString();
    this.healthState = 'HEALTHY';
    this.rateLimitState = { isRateLimited: false };
    this.latencyHistoryMs.push(latencyMs);
    if (this.latencyHistoryMs.length > 10) {
      this.latencyHistoryMs.shift();
    }
  }

  public recordFailure(category: AIFailureCategory, errorMsg: string, retryAfterMs?: number): void {
    this.consecutiveFailures += 1;
    this.lastFailureAt = new Date().toISOString();
    this.lastErrorClassification = category;

    if (category === 'RATE_LIMITED' || category === 'QUOTA_EXCEEDED') {
      const cooldownMs = retryAfterMs || 30000;
      this.rateLimitState = {
        isRateLimited: true,
        retryAfterMs: cooldownMs,
        rateLimitResetAt: new Date(Date.now() + cooldownMs).toISOString(),
      };
      this.healthState = 'RATE_LIMITED';
    } else if (category === 'AUTH_ERROR' || category === 'UNCONFIGURED') {
      this.healthState = 'UNCONFIGURED';
    } else if (this.consecutiveFailures >= 3) {
      this.healthState = 'UNAVAILABLE';
    } else {
      this.healthState = 'DEGRADED';
    }
  }

  public sanitizeSecret(message: string): string {
    if (!message) return '';
    return message
      .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_KEY]')
      .replace(/sk-[0-9A-Za-z-_]{20,}/g, '[REDACTED_KEY]')
      .replace(/gsk_[0-9A-Za-z-_]{20,}/g, '[REDACTED_KEY]')
      .replace(/hf_[0-9A-Za-z-_]{20,}/g, '[REDACTED_KEY]')
      .replace(/csk-[0-9A-Za-z-_]{20,}/g, '[REDACTED_KEY]')
      .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED_TOKEN]');
  }

  public classifyError(err: any): { category: AIFailureCategory; isRetryable: boolean; message: string } {
    const rawMsg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err || 'Unknown error'));
    const message = this.sanitizeSecret(rawMsg);
    const errStr = (message + ' ' + (err?.status || '') + ' ' + (err?.code || '')).toLowerCase();

    if (errStr.includes('timeout') || errStr.includes('timed out') || errStr.includes('abort')) {
      return { category: 'TIMEOUT', isRetryable: true, message };
    }
    if (errStr.includes('429') || errStr.includes('rate limit') || errStr.includes('too many requests')) {
      return { category: 'RATE_LIMITED', isRetryable: true, message };
    }
    if (errStr.includes('quota') || errStr.includes('resource_exhausted') || errStr.includes('insufficient_quota')) {
      return { category: 'QUOTA_EXCEEDED', isRetryable: false, message };
    }
    if (
      errStr.includes('401') ||
      errStr.includes('403') ||
      errStr.includes('unauthorized') ||
      errStr.includes('forbidden') ||
      errStr.includes('invalid api key') ||
      errStr.includes('invalid key') ||
      errStr.includes('unconfigured')
    ) {
      return { category: 'AUTH_ERROR', isRetryable: false, message };
    }
    if (errStr.includes('400') || errStr.includes('bad request') || errStr.includes('invalid_argument')) {
      return { category: 'INVALID_REQUEST', isRetryable: false, message };
    }
    if (errStr.includes('404') || errStr.includes('model not found') || errStr.includes('model_unavailable')) {
      return { category: 'MODEL_UNAVAILABLE', isRetryable: false, message };
    }
    if (errStr.includes('fetch failed') || errStr.includes('econnrefused') || errStr.includes('network')) {
      return { category: 'NETWORK_ERROR', isRetryable: true, message };
    }
    if (errStr.includes('500') || errStr.includes('502') || errStr.includes('503') || errStr.includes('504')) {
      return { category: 'PROVIDER_ERROR', isRetryable: true, message };
    }

    return { category: 'UNKNOWN', isRetryable: false, message };
  }

  public async executeTask(request: AIRequest): Promise<AINormalizedResponse> {
    const startTime = Date.now();
    const modelId = request.preferredModel || this.defaultModelId;
    const effectiveTimeoutMs = request.timeoutMs || this.timeoutMs;

    if (!this.isConfigured()) {
      const errCat: AIFailureCategory = 'UNCONFIGURED';
      const msg = `Provider ${this.displayName} is UNCONFIGURED (missing environment API key)`;
      this.recordFailure(errCat, msg);
      return {
        status: 'FAILED',
        text: '',
        error: msg,
        failureCategory: errCat,
        provenance: {
          provider: this.providerId,
          model: modelId,
          task: request.task,
          generationSource: this.providerId as any,
          timestamp: new Date().toISOString(),
          fallbackUsed: false,
          attempts: [
            {
              providerId: this.providerId,
              modelId,
              success: false,
              latencyMs: Date.now() - startTime,
              errorClassification: errCat,
              errorMessage: msg,
              timestamp: new Date().toISOString(),
            },
          ],
        },
      };
    }

    let lastErrorMsg = '';
    let lastCategory: AIFailureCategory = 'UNKNOWN';
    let currentBackoff = this.retryPolicy.initialBackoffMs;

    for (let attempt = 0; attempt <= this.retryPolicy.maxRetries; attempt++) {
      const attemptStart = Date.now();
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Provider ${this.displayName} request timed out after ${effectiveTimeoutMs}ms`)), effectiveTimeoutMs)
        );

        const callPromise = this.executeProviderCall(request, modelId);
        const result = await Promise.race([callPromise, timeoutPromise]);
        const latency = Date.now() - attemptStart;
        this.recordSuccess(latency);

        return {
          status: 'SUCCESS',
          text: result.text,
          data: result.data,
          provenance: {
            provider: this.providerId,
            model: modelId,
            task: request.task,
            generationSource: this.providerId as any,
            timestamp: new Date().toISOString(),
            fallbackUsed: false,
            attempts: [
              {
                providerId: this.providerId,
                modelId,
                success: true,
                latencyMs: latency,
                timestamp: new Date().toISOString(),
              },
            ],
          },
        };
      } catch (err: any) {
        const latency = Date.now() - attemptStart;
        const classified = this.classifyError(err);
        lastErrorMsg = classified.message;
        lastCategory = classified.category;

        this.recordFailure(classified.category, classified.message);

        if (!classified.isRetryable || attempt === this.retryPolicy.maxRetries) {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, currentBackoff));
        currentBackoff *= this.retryPolicy.backoffFactor;
      }
    }

    return {
      status: 'FAILED',
      text: '',
      error: lastErrorMsg,
      failureCategory: lastCategory,
      provenance: {
        provider: this.providerId,
        model: modelId,
        task: request.task,
        generationSource: this.providerId as any,
        timestamp: new Date().toISOString(),
        fallbackUsed: false,
        attempts: [
          {
            providerId: this.providerId,
            modelId,
            success: false,
            latencyMs: Date.now() - startTime,
            errorClassification: lastCategory,
            errorMessage: lastErrorMsg,
            timestamp: new Date().toISOString(),
          },
        ],
      },
    };
  }
}
