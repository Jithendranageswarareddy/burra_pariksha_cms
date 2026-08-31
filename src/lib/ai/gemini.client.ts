/**
 * BURRA PARIKSHA CMS - Server-Side Gemini Client
 * Phase 4: Gemini AI Question Studio
 * 
 * Centralizes GoogleGenAI client initialization using the official @google/genai SDK.
 * All operations remain strictly server-side.
 */

import { GoogleGenAI } from '@google/genai';

class GeminiClientWrapper {
  private client: GoogleGenAI | null = null;
  private isKeyConfigured: boolean = false;

  constructor() {
    this.init();
  }

  private init(): void {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim().length > 0) {
      try {
        this.client = new GoogleGenAI({
          apiKey: apiKey.trim(),
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
        this.isKeyConfigured = true;
      } catch (err) {
        console.error('[GeminiClient] Failed to initialize GoogleGenAI client:', err);
        this.client = null;
        this.isKeyConfigured = false;
      }
    } else {
      this.client = null;
      this.isKeyConfigured = false;
    }
  }

  public getClient(): GoogleGenAI | null {
    if (!this.client && process.env.GEMINI_API_KEY) {
      this.init();
    }
    return this.client;
  }

  public isConfigured(): boolean {
    if (!this.isKeyConfigured && process.env.GEMINI_API_KEY) {
      this.init();
    }
    return this.isKeyConfigured && this.client !== null;
  }

  public getModelName(): string {
    return process.env.GEMINI_MODEL || 'gemini-3.7-flash';
  }
}

export const geminiClient = new GeminiClientWrapper();
