/**
 * BURRA PARIKSHA CMS - xAI / Grok Client Wrapper
 * Phase 22.6B: Grok Secondary Generator Provider Integration
 * 
 * Uses native Node fetch to interact with the xAI Responses API (POST /v1/responses).
 * Strictly server-side execution. Never leaks, echoes, or logs XAI_API_KEY.
 */

import { sanitizeKeyInMessage, classifyAIError, AIProviderError } from '../error';

export interface XaiMessageItem {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface XaiTextFormat {
  type: 'json_schema';
  name: string;
  strict?: boolean;
  schema: Record<string, any>;
}

export interface XaiResponsesRequestPayload {
  model: string;
  input: XaiMessageItem[] | string;
  text?: {
    format: XaiTextFormat;
  };
  temperature?: number;
}

export interface XaiClientOptions {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export class XaiClient {
  private customApiKey?: string;
  private baseUrl: string;

  constructor(options?: XaiClientOptions) {
    this.customApiKey = options?.apiKey;
    this.baseUrl = options?.baseUrl || 'https://api.x.ai/v1';
  }

  public getApiKey(): string | undefined {
    return this.customApiKey !== undefined ? this.customApiKey : process.env.XAI_API_KEY;
  }

  public isConfigured(): boolean {
    const key = this.getApiKey();
    return !!(key && key.trim().length > 0);
  }

  public getModelName(fallbackModel: string = 'grok-4.6'): string {
    return process.env.XAI_MODEL || fallbackModel;
  }

  /**
   * Invokes POST https://api.x.ai/v1/responses with native fetch and AbortController.
   */
  public async generateResponse(
    payload: XaiResponsesRequestPayload,
    options?: { timeoutMs?: number }
  ): Promise<any> {
    const key = this.getApiKey();
    if (!key || !key.trim()) {
      throw new AIProviderError(
        'xAI API key is missing or not configured',
        'grok',
        payload.model,
        'AUTH_ERROR',
        false,
        401
      );
    }

    const timeoutMs = options?.timeoutMs || 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const endpoint = `${this.baseUrl}/responses`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key.trim()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorBodyText = '';
        try {
          errorBodyText = await response.text();
        } catch {
          errorBodyText = response.statusText;
        }

        const sanitizedMsg = sanitizeKeyInMessage(errorBodyText);
        const errObj = {
          status: response.status,
          message: `xAI API call failed (HTTP ${response.status}): ${sanitizedMsg}`,
        };
        const classified = classifyAIError(errObj);

        throw new AIProviderError(
          classified.sanitizedMessage,
          'grok',
          payload.model,
          classified.classification,
          classified.isRetryable,
          classified.statusCode || response.status
        );
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      if (err instanceof AIProviderError) {
        throw err;
      }

      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        const timeoutErr = new Error(`xAI API call timed out after ${timeoutMs}ms`);
        const classified = classifyAIError(timeoutErr);
        throw new AIProviderError(
          classified.sanitizedMessage,
          'grok',
          payload.model,
          classified.classification,
          classified.isRetryable,
          504
        );
      }

      const classified = classifyAIError(err);
      throw new AIProviderError(
        classified.sanitizedMessage,
        'grok',
        payload.model,
        classified.classification,
        classified.isRetryable,
        classified.statusCode || 500
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export const xaiClient = new XaiClient();
