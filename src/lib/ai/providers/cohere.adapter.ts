/**
 * BURRA PARIKSHA CMS - Phase 24 Cohere Provider Adapter
 */

import { AIProviderId, AIRequest } from '../../../types/phase24-ai';
import { BaseAIProviderAdapter } from './base.adapter';

export class CohereProviderAdapter extends BaseAIProviderAdapter {
  public readonly providerId: AIProviderId = 'COHERE';
  public readonly displayName: string = 'Cohere AI';

  protected supportedModels = [
    'command-r-plus',
    'command-r',
    'command-light',
  ];
  protected defaultModelId = 'command-r-plus';
  protected priority = 5;

  public isConfigured(): boolean {
    const key = process.env.COHERE_API_KEY;
    return Boolean(key && key.trim().length > 0);
  }

  protected async executeProviderCall(request: AIRequest, modelId: string): Promise<{ text: string; data?: any }> {
    const apiKey = process.env.COHERE_API_KEY;
    if (!apiKey) {
      throw new Error('COHERE_API_KEY is missing from server environment');
    }

    const payload: any = {
      model: modelId || this.defaultModelId,
      messages: [
        {
          role: 'user',
          content: request.systemInstruction
            ? `${request.systemInstruction}\n\n${request.prompt}`
            : request.prompt,
        },
      ],
      temperature: request.temperature ?? 0.2,
    };

    if (request.maxTokens) {
      payload.max_tokens = request.maxTokens;
    }

    const res = await fetch('https://api.cohere.com/v2/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Cohere HTTP ${res.status}: ${this.sanitizeSecret(errText)}`);
    }

    const json = await res.json();
    const text = json.message?.content?.[0]?.text || json.text || '';
    let data: any = undefined;

    if (request.responseSchema || text.trim().startsWith('{') || text.trim().startsWith('[')) {
      try {
        data = JSON.parse(text);
      } catch {
        // Fallback
      }
    }

    return { text, data };
  }
}
