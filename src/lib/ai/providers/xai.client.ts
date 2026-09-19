/**
 * BURRA PARIKSHA CMS - xAI / Grok REST API Client Wrapper
 * Implements the official OpenAI-compatible xAI REST API.
 */

export interface XAIClientConfig {
  apiKey?: string;
  baseUrl?: string;
}

export class XAIClientWrapper {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: XAIClientConfig = {}) {
    this.baseUrl = config.baseUrl || 'https://api.x.ai/v1';
    this.apiKey = config.apiKey || process.env.XAI_API_KEY || '';
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async createChatCompletion(payload: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    max_tokens?: number;
    [key: string]: any;
  }): Promise<any> {
    if (!this.apiKey) {
      throw new Error('XAI_API_KEY is missing from server environment');
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`xAI HTTP ${response.status}: ${errText}`);
    }

    return await response.json();
  }
}

export const xaiClient = new XAIClientWrapper();
