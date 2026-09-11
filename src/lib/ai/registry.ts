/**
 * BURRA PARIKSHA CMS - AI Provider Registry
 * Phase 6: AI Provider / Multi-Model Orchestration
 */

import { AIProvider } from './types';
import { DEFAULT_AI_CONFIG } from './config';

export interface ProviderStatus {
  providerId: string;
  isRegistered: boolean;
  isConfigured: boolean;
  modelId?: string;
}

export interface ProviderChainResolution<T = AIProvider> {
  primaryId: string;
  fallbackIds: string[];
  resolvedChain: string[];
  availableProviders: T[];
  unconfiguredProviders: string[];
  missingProviders: string[];
  hasConfiguredProvider: boolean;
}

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
  public getProvider(providerId?: string): AIProvider | undefined {
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
   * Checks whether a provider is registered AND configured.
   */
  public isProviderConfigured(providerId: string): boolean {
    const provider = this.getProvider(providerId);
    return !!(provider && provider.isConfigured());
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
   * Returns the default configured provider, or first available enabled provider, or undefined if none configured.
   * Does NOT crash on zero configured providers.
   */
  public getDefaultConfiguredProvider(): AIProvider | undefined {
    const provider = this.getProvider(this.defaultProviderId);
    if (provider && provider.isConfigured()) {
      return provider;
    }
    const enabled = this.getEnabledProviders();
    return enabled.length > 0 ? enabled[0] : undefined;
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
   * Returns the current default provider ID.
   */
  public getDefaultProviderId(): string {
    return this.defaultProviderId;
  }

  /**
   * Sets the default provider ID.
   */
  public setDefaultProvider(providerId: string): void {
    this.defaultProviderId = providerId.toLowerCase();
  }

  /**
   * Returns diagnostic status for a specific provider ID across the 4 states:
   * 1. registered + configured
   * 2. registered + unconfigured
   * 3. missing from registry
   */
  public getProviderStatus(providerId: string): ProviderStatus {
    const provider = this.getProvider(providerId);
    if (!provider) {
      return {
        providerId: providerId.toLowerCase(),
        isRegistered: false,
        isConfigured: false,
      };
    }
    return {
      providerId: provider.providerId,
      isRegistered: true,
      isConfigured: provider.isConfigured(),
      modelId: provider.defaultModelId,
    };
  }

  /**
   * Returns health / diagnostic summary across all registered providers.
   * Handles state 4 (zero configured providers) gracefully without throwing.
   */
  public getHealthStatus(): {
    totalRegistered: number;
    totalConfigured: number;
    hasConfiguredProviders: boolean;
    providers: ProviderStatus[];
  } {
    const statuses = Array.from(this.providers.values()).map((p) => ({
      providerId: p.providerId,
      isRegistered: true,
      isConfigured: p.isConfigured(),
      modelId: p.defaultModelId,
    }));
    const totalConfigured = statuses.filter((s) => s.isConfigured).length;
    return {
      totalRegistered: statuses.length,
      totalConfigured,
      hasConfiguredProviders: totalConfigured > 0,
      providers: statuses,
    };
  }

  /**
   * Resolves a provider chain (primary -> fallback_1 -> fallback_2) deterministically.
   * Explicitly categorizes providers into:
   * - available (registered + configured)
   * - unconfigured (registered + unconfigured)
   * - missing (configured in chain but not registered)
   */
  public resolveProviderChain(
    primaryId?: string,
    fallbackIds?: string[]
  ): ProviderChainResolution<AIProvider> {
    const primary = (primaryId || this.defaultProviderId).toLowerCase();
    const fallbacks = (fallbackIds || DEFAULT_AI_CONFIG.fallbackProviders || []).map((f) => f.toLowerCase());

    // Ordered deduplicated list: [primary, ...fallbacks]
    const fullChain = [primary, ...fallbacks].filter(
      (id, idx, arr) => id && arr.indexOf(id) === idx
    );

    const availableProviders: AIProvider[] = [];
    const unconfiguredProviders: string[] = [];
    const missingProviders: string[] = [];

    for (const id of fullChain) {
      const provider = this.getProvider(id);
      if (!provider) {
        missingProviders.push(id);
      } else if (!provider.isConfigured()) {
        unconfiguredProviders.push(id);
      } else {
        availableProviders.push(provider);
      }
    }

    return {
      primaryId: primary,
      fallbackIds: fallbacks,
      resolvedChain: fullChain,
      availableProviders,
      unconfiguredProviders,
      missingProviders,
      hasConfiguredProvider: availableProviders.length > 0,
    };
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
