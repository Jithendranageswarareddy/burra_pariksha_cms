/**
 * BURRA PARIKSHA CMS - Groq Client Wrapper
 * Phase 22.6D: Groq Secondary Generator Provider Integration
 * 
 * Uses native Node fetch to interact with the Groq Chat Completions API
 * (POST https://api.groq.com/openai/v1/chat/completions).
 * Strictly server-side execution. Never leaks, echoes, or logs GROQ_API_KEY.
 */

import { sanitizeKeyInMessage, classifyAIError, AIProviderError } from '../error';

export interface GroqMessageItem {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqJsonSchemaFormat {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: boolean;
    schema: Record<string, any>;
  };
}

export interface GroqChatCompletionRequestPayload {
  model: string;
  messages: GroqMessageItem[];
  response_format?: GroqJsonSchemaFormat;
  temperature?: number;
}

export interface GroqClientOptions {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export class GroqClient {
  private customApiKey?: string;
  private baseUrl: string;

  constructor(options?: GroqClientOptions) {
    this.customApiKey = options?.apiKey;
    this.baseUrl = options?.baseUrl || 'https://api.groq.com/openai/v1';
  }

  public getApiKey(): string | undefined {
    return this.customApiKey !== undefined ? this.customApiKey : process.env.GROQ_API_KEY;
  }

  public isConfigured(): boolean {
    const key = this.getApiKey();
    return !!(key && key.trim().length > 0);
  }

  public getModelName(fallbackModel: string = 'openai/gpt-oss-120b'): string {
    return process.env.GROQ_MODEL || fallbackModel;
  }

  /**
   * Invokes POST https://api.groq.com/openai/v1/chat/completions with native fetch and AbortController.
   */
  public async generateChatCompletion(
    payload: GroqChatCompletionRequestPayload,
    options?: { timeoutMs?: number }
  ): Promise<any> {
    const key = this.getApiKey();
    if (!key || !key.trim()) {
      throw new AIProviderError(
        'Groq API key is missing or not configured',
        'groq',
        payload.model,
        'AUTH_ERROR',
        false,
        401
      );
    }

    const timeoutMs = options?.timeoutMs || 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const endpoint = `${this.baseUrl}/chat/completions`;

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
          message: `Groq API call failed (HTTP ${response.status}): ${sanitizedMsg}`,
        };
        const classified = classifyAIError(errObj);

        throw new AIProviderError(
          classified.sanitizedMessage,
          'groq',
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
        const timeoutErr = new Error(`Groq API call timed out after ${timeoutMs}ms`);
        const classified = classifyAIError(timeoutErr);
        throw new AIProviderError(
          classified.sanitizedMessage,
          'groq',
          payload.model,
          classified.classification,
          classified.isRetryable,
          504
        );
      }

      const classified = classifyAIError(err);
      throw new AIProviderError(
        classified.sanitizedMessage,
        'groq',
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

export const groqClient = new GroqClient();
