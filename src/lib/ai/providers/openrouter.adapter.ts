/**
 * BURRA PARIKSHA CMS - Phase 24 OpenRouter Provider Adapter
 */

import { AIProviderId, AIRequest } from '../../../types/ai';
import { BaseAIProviderAdapter } from './base.adapter';

export class OpenRouterProviderAdapter extends BaseAIProviderAdapter {
  public readonly providerId: AIProviderId = 'OPENROUTER';
  public readonly displayName: string = 'OpenRouter AI';

  protected supportedModels = [
    'anthropic/claude-3.5-sonnet',
    'meta-llama/llama-3.3-70b-instruct',
    'google/gemini-2.0-flash-001',
  ];
  protected defaultModelId = 'meta-llama/llama-3.3-70b-instruct';
  protected priority = 2;

  public isConfigured(): boolean {
    const key = process.env.OPENROUTER_API_KEY;
    return Boolean(key && key.trim().length > 0);
  }

  protected async executeProviderCall(request: AIRequest, modelId: string): Promise<{ text: string; data?: any }> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is missing from server environment');
    }

    const messages = [];
    if (request.systemInstruction) {
      messages.push({ role: 'system', content: request.systemInstruction });
    }
    messages.push({ role: 'user', content: request.prompt });

    const payload: any = {
      model: modelId || this.defaultModelId,
      messages,
      temperature: request.temperature ?? 0.2,
    };

    if (request.maxTokens) {
      payload.max_tokens = request.maxTokens;
    }

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://burrapariksha.app',
        'X-Title': 'Burra Pariksha CMS',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter HTTP ${res.status}: ${this.sanitizeSecret(errText)}`);
    }

    const json = await res.json();
    const text = json.choices?.[0]?.message?.content || '';
    let data: any = undefined;

    if (request.responseSchema || text.trim().startsWith('{') || text.trim().startsWith('[')) {
      try {
        data = JSON.parse(text);
      } catch {
        // Fallback to raw text
      }
    }

    return { text, data };
  }
}
