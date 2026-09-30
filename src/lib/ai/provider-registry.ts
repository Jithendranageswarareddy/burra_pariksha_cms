/**
 * BURRA PARIKSHA CMS - Multi-AI Provider Registry
 * Central registry holding metadata and capabilities for all 8 AI providers.
 */

import {
  AIProviderId,
  AIProviderMetadata,
  AITaskType,
  IAIProvider,
} from '../../types/ai';
import { GeminiProviderAdapter } from './providers/gemini.adapter';
import { OpenRouterProviderAdapter } from './providers/openrouter.adapter';
import { GroqProviderAdapter } from './providers/groq.adapter';
import { MistralProviderAdapter } from './providers/mistral.adapter';
import { CohereProviderAdapter } from './providers/cohere.adapter';
import { HuggingFaceProviderAdapter } from './providers/huggingface.adapter';
import { CerebrasProviderAdapter } from './providers/cerebras.adapter';
import { ExperimentalLabsProviderAdapter } from './providers/experimental-labs.adapter';

export class MultiAIProviderRegistry {
  private providers: Map<string, IAIProvider> = new Map();

  constructor() {
    this.registerDefaultProviders();
  }

  private registerDefaultProviders(): void {
    this.registerProvider(new GeminiProviderAdapter());
    this.registerProvider(new OpenRouterProviderAdapter());
    this.registerProvider(new GroqProviderAdapter());
    this.registerProvider(new MistralProviderAdapter());
    this.registerProvider(new CohereProviderAdapter());
    this.registerProvider(new HuggingFaceProviderAdapter());
    this.registerProvider(new CerebrasProviderAdapter());
    this.registerProvider(new ExperimentalLabsProviderAdapter());
  }

  public registerProvider(provider: IAIProvider): void {
    if (!provider || !provider.providerId) {
      throw new Error('Invalid provider: providerId is required.');
    }
    this.providers.set(provider.providerId.toUpperCase(), provider);
  }

  public getProvider(providerId: string): IAIProvider | undefined {
    if (!providerId) return undefined;
    return this.providers.get(providerId.toUpperCase());
  }

  public getAllProviders(): IAIProvider[] {
    return Array.from(this.providers.values());
  }

  public getAllMetadata(): AIProviderMetadata[] {
    return this.getAllProviders().map((p) => p.getMetadata());
  }

  public getConfiguredProviders(): IAIProvider[] {
    return this.getAllProviders().filter((p) => p.isConfigured() && p.isEnabled);
  }

  public getEligibleProvidersForTask(task: AITaskType, customPriorities?: string[]): IAIProvider[] {
    const all = this.getAllProviders();

    let sorted: IAIProvider[] = [];
    if (customPriorities && customPriorities.length > 0) {
      const priorityMap = new Map<string, number>();
      customPriorities.forEach((id, index) => priorityMap.set(id.toUpperCase(), index));

      sorted = [...all].sort((a, b) => {
        const pA = priorityMap.has(a.providerId.toUpperCase()) ? priorityMap.get(a.providerId.toUpperCase())! : 999;
        const pB = priorityMap.has(b.providerId.toUpperCase()) ? priorityMap.get(b.providerId.toUpperCase())! : 999;
        if (pA !== pB) return pA - pB;
        return a.getMetadata().priority - b.getMetadata().priority;
      });
    } else {
      sorted = [...all].sort((a, b) => a.getMetadata().priority - b.getMetadata().priority);
    }

    return sorted.filter((p) => {
      if (!p.isEnabled) return false;
      if (!p.supportsCapability(task)) return false;
      const meta = p.getMetadata();
      if (!meta.isConfigured) return false;
      if (meta.healthState === 'UNAVAILABLE') return false;
      if (meta.healthState === 'RATE_LIMITED') return false;
      return true;
    });
  }

  public clear(): void {
    this.providers.clear();
  }

  public resetToDefaults(): void {
    this.clear();
    this.registerDefaultProviders();
  }
}

export const multiAIProviderRegistry = new MultiAIProviderRegistry();
export const phase24ProviderRegistry = multiAIProviderRegistry;
export type Phase24ProviderRegistry = MultiAIProviderRegistry;
