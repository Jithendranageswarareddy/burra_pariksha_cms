/**
 * BURRA PARIKSHA CMS - Phase 24 Experimental Labs Provider Adapter
 * Safe registry/adapter abstraction for experimental AI endpoints without inventing undocumented external APIs.
 */

import { AIProviderId, AIRequest } from '../../../types/ai';
import { BaseAIProviderAdapter } from './base.adapter';

export class ExperimentalLabsProviderAdapter extends BaseAIProviderAdapter {
  public readonly providerId: AIProviderId = 'EXPERIMENTAL_LABS';
  public readonly displayName: string = 'Experimental Labs';

  protected supportedModels = [
    'experimental-omni-v1',
    'experimental-flash-v1',
  ];
  protected defaultModelId = 'experimental-omni-v1';
  protected priority = 8;

  public isConfigured(): boolean {
    const key = process.env.EXPERIMENTAL_LABS_API_KEY;
    const url = process.env.EXPERIMENTAL_LABS_ENDPOINT_URL;
    return Boolean((key && key.trim().length > 0) || (url && url.trim().length > 0));
  }

  protected async executeProviderCall(request: AIRequest, modelId: string): Promise<{ text: string; data?: any }> {
    const apiKey = process.env.EXPERIMENTAL_LABS_API_KEY;
    const endpointUrl = process.env.EXPERIMENTAL_LABS_ENDPOINT_URL || 'https://api.experimental-labs.internal/v1/generate';

    if (!this.isConfigured()) {
      throw new Error('EXPERIMENTAL_LABS_API_KEY or EXPERIMENTAL_LABS_ENDPOINT_URL is missing from server environment');
    }

    const payload: any = {
      model: modelId || this.defaultModelId,
      task: request.task,
      prompt: request.prompt,
      systemInstruction: request.systemInstruction,
      temperature: request.temperature ?? 0.2,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const res = await fetch(endpointUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`ExperimentalLabs HTTP ${res.status}: ${this.sanitizeSecret(errText)}`);
    }

    const json = await res.json();
    const text = json.text || json.choices?.[0]?.message?.content || JSON.stringify(json);
    let data: any = json.data || undefined;

    if (!data && (request.responseSchema || text.trim().startsWith('{') || text.trim().startsWith('['))) {
      try {
        data = JSON.parse(text);
      } catch {
        // Fallback
      }
    }

    return { text, data };
  }
}
