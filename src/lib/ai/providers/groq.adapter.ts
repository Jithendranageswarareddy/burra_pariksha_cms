/**
 * BURRA PARIKSHA CMS - Phase 24 Groq Provider Adapter
 */

import { AIProviderId, AIRequest } from '../../../types/ai';
import { BaseAIProviderAdapter } from './base.adapter';

export class GroqProviderAdapter extends BaseAIProviderAdapter {
  public readonly providerId: AIProviderId = 'GROQ';
  public readonly displayName: string = 'Groq AI';

  protected supportedModels = [
    'llama-3.3-70b-versatile',
    'mixtral-8x7b-32768',
    'gemma2-9b-it',
  ];
  protected defaultModelId = 'llama-3.3-70b-versatile';
  protected priority = 3;

  public isConfigured(): boolean {
    const key = process.env.GROQ_API_KEY;
    return Boolean(key && key.trim().length > 0);
  }

  protected async executeProviderCall(request: AIRequest, modelId: string): Promise<{ text: string; data?: any }> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is missing from server environment');
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

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq HTTP ${res.status}: ${this.sanitizeSecret(errText)}`);
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
