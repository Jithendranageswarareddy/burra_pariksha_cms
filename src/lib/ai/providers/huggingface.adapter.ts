/**
 * BURRA PARIKSHA CMS - Phase 24 Hugging Face Provider Adapter
 */

import { AIProviderId, AIRequest } from '../../../types/ai';
import { BaseAIProviderAdapter } from './base.adapter';

export class HuggingFaceProviderAdapter extends BaseAIProviderAdapter {
  public readonly providerId: AIProviderId = 'HUGGING_FACE';
  public readonly displayName: string = 'Hugging Face Inference';

  protected supportedModels = [
    'meta-llama/Llama-3.2-3B-Instruct',
    'mistralai/Mistral-7B-Instruct-v0.3',
  ];
  protected defaultModelId = 'meta-llama/Llama-3.2-3B-Instruct';
  protected priority = 6;

  public isConfigured(): boolean {
    const key = process.env.HUGGING_FACE_API_KEY;
    return Boolean(key && key.trim().length > 0);
  }

  protected async executeProviderCall(request: AIRequest, modelId: string): Promise<{ text: string; data?: any }> {
    const apiKey = process.env.HUGGING_FACE_API_KEY;
    if (!apiKey) {
      throw new Error('HUGGING_FACE_API_KEY is missing from server environment');
    }

    const targetModel = modelId || this.defaultModelId;
    const url = `https://api-inference.huggingface.co/models/${targetModel}`;

    const promptText = request.systemInstruction
      ? `${request.systemInstruction}\n\n${request.prompt}`
      : request.prompt;

    const payload: any = {
      inputs: promptText,
      parameters: {
        temperature: request.temperature ?? 0.2,
        max_new_tokens: request.maxTokens || 1024,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HuggingFace HTTP ${res.status}: ${this.sanitizeSecret(errText)}`);
    }

    const json = await res.json();
    let text = '';
    if (Array.isArray(json) && json[0]?.generated_text) {
      text = json[0].generated_text;
    } else if (typeof json === 'object' && json.generated_text) {
      text = json.generated_text;
    } else {
      text = typeof json === 'string' ? json : JSON.stringify(json);
    }

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
