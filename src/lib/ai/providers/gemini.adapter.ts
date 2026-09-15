/**
 * BURRA PARIKSHA CMS - Phase 24 Gemini Provider Adapter
 */

import { GoogleGenAI } from '@google/genai';
import { AIProviderId, AIRequest } from '../../../types/phase24-ai';
import { BaseAIProviderAdapter } from './base.adapter';

export class GeminiProviderAdapter extends BaseAIProviderAdapter {
  public readonly providerId: AIProviderId = 'GEMINI';
  public readonly displayName: string = 'Google Gemini';

  protected supportedModels = [
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
    'gemini-flash-latest',
  ];
  protected defaultModelId = 'gemini-3.1-flash-lite';
  protected priority = 1;

  public isConfigured(): boolean {
    const key = process.env.GEMINI_API_KEY;
    return Boolean(key && key.trim().length > 0);
  }

  protected async executeProviderCall(request: AIRequest, modelId: string): Promise<{ text: string; data?: any }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is missing from server environment');
    }

    const ai = new GoogleGenAI({ apiKey });
    const promptText = request.systemInstruction
      ? `${request.systemInstruction}\n\nUser Request: ${request.prompt}`
      : request.prompt;

    const config: any = {
      temperature: request.temperature ?? 0.2,
    };

    if (request.maxTokens) {
      config.maxOutputTokens = request.maxTokens;
    }

    if (request.responseSchema) {
      config.responseMimeType = 'application/json';
      config.responseSchema = request.responseSchema;
    }

    const response = await ai.models.generateContent({
      model: modelId || this.defaultModelId,
      contents: promptText,
      config,
    });

    const text = response.text || '';
    let data: any = undefined;

    if (request.responseSchema || text.trim().startsWith('{') || text.trim().startsWith('[')) {
      try {
        data = JSON.parse(text);
      } catch {
        // Text wasn't valid JSON, fallback to raw text
      }
    }

    return { text, data };
  }
}
