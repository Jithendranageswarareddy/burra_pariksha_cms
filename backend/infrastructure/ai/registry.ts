/**
 * BURRA PARIKSHA CMS - AI Provider Registry
 * Phase 6: AI Provider / Multi-Model Orchestration
 */

import { AIProvider } from './types';
import { DEFAULT_AI_CONFIG } from './config';

export class AIProviderRegistry {
  private providers: Map<string, AIProvider> = new Map();
  private defaultProviderId: string = DEFAULT_AI_CONFIG.defaultProvider;

  /**
   * Registers an AI provider with the registry.
   */
  public registerProvider(provider: AIProvider): void {
    if (!provider || !provider.providerId) {
      throw new Error('Invalid provider: providerId is required.');
    }
    this.providers.set(provider.providerId.toLowerCase(), provider);
  }

  /**
   * Retrieves a registered provider by ID, returning undefined if not found.
   */
  public getProvider(providerId: string): AIProvider | undefined {
    if (!providerId) return undefined;
    return this.providers.get(providerId.toLowerCase());
  }

  /**
   * Retrieves a registered provider by ID, throwing a clear error if not found.
   */
  public getRequiredProvider(providerId: string): AIProvider {
    const provider = this.getProvider(providerId);
    if (!provider) {
      throw new Error(`AI provider '${providerId}' is not registered in AIProviderRegistry.`);
    }
    return provider;
  }

  /**
   * Lists all registered provider IDs.
   */
  public listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Returns all registered providers that report isConfigured() === true.
   */
  public getEnabledProviders(): AIProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.isConfigured());
  }

  /**
   * Returns the default configured provider or falls back to the first available enabled provider.
   */
  public getDefaultProvider(): AIProvider {
    const provider = this.getProvider(this.defaultProviderId);
    if (provider) {
      return provider;
    }
    const enabled = this.getEnabledProviders();
    if (enabled.length > 0) {
      return enabled[0];
    }
    const all = Array.from(this.providers.values());
    if (all.length > 0) {
      return all[0];
    }
    throw new Error(`No AI providers registered in AIProviderRegistry.`);
  }

  /**
   * Sets the default provider ID.
   */
  public setDefaultProvider(providerId: string): void {
    this.defaultProviderId = providerId;
  }

  /**
   * Clears all registered providers (primarily for unit testing / resetting).
   */
  public clear(): void {
    this.providers.clear();
    this.defaultProviderId = DEFAULT_AI_CONFIG.defaultProvider;
  }
}

export const aiProviderRegistry = new AIProviderRegistry();
