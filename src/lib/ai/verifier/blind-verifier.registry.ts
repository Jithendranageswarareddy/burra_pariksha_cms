/**
 * BURRA PARIKSHA CMS - Blind Verifier Registry
 * Phase 22.3: Blind Independent Verifier Architecture (Option C)
 * 
 * Minimal provider-neutral registry for blind verifier providers.
 * Decoupled from AIProviderRegistry and QuestionValidatorProvider.
 */

import { BlindVerifierProvider } from './types';
import { geminiBlindVerifier } from './gemini-blind-verifier';
import { DEFAULT_AI_CONFIG } from '../config';
import { ProviderStatus, ProviderChainResolution } from '../registry';

export class BlindVerifierRegistry {
  private providers: Map<string, BlindVerifierProvider> = new Map();
  private defaultProviderId: string = DEFAULT_AI_CONFIG.defaultVerifierProvider || 'gemini-blind-verifier';

  constructor() {
    this.registerDefaultProviders();
  }

  private registerDefaultProviders(): void {
    this.registerProvider(geminiBlindVerifier);
  }

  public registerProvider(provider: BlindVerifierProvider): void {
    if (!provider || !provider.providerId) {
      throw new Error('Invalid provider: providerId is required.');
    }
    this.providers.set(provider.providerId.toLowerCase(), provider);
  }

  public getProvider(providerId?: string): BlindVerifierProvider | undefined {
    if (!providerId) {
      return this.providers.get(this.defaultProviderId.toLowerCase());
    }
    return this.providers.get(providerId.toLowerCase());
  }

  public getRequiredProvider(providerId: string): BlindVerifierProvider {
    const provider = this.getProvider(providerId);
    if (!provider) {
      throw new Error(`BlindVerifierProvider '${providerId}' is not registered.`);
    }
    return provider;
  }

  public isProviderConfigured(providerId: string): boolean {
    const provider = this.getProvider(providerId);
    return !!(provider && provider.isConfigured());
  }

  public getDefaultProvider(): BlindVerifierProvider {
    const provider = this.getProvider(this.defaultProviderId);
    if (provider) return provider;
    const all = Array.from(this.providers.values());
    if (all.length > 0) return all[0];
    throw new Error('No BlindVerifierProviders registered in BlindVerifierRegistry.');
  }

  public getDefaultConfiguredProvider(): BlindVerifierProvider | undefined {
    const provider = this.getProvider(this.defaultProviderId);
    if (provider && provider.isConfigured()) {
      return provider;
    }
    const enabled = this.getEnabledProviders();
    return enabled.length > 0 ? enabled[0] : undefined;
  }

  public getDefaultProviderId(): string {
    return this.defaultProviderId;
  }

  public getEnabledProviders(): BlindVerifierProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.isConfigured());
  }

  public setDefaultProvider(providerId: string): void {
    this.defaultProviderId = providerId.toLowerCase();
  }

  public listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

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
      modelId: provider.modelId,
    };
  }

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
      modelId: p.modelId,
    }));
    const totalConfigured = statuses.filter((s) => s.isConfigured).length;
    return {
      totalRegistered: statuses.length,
      totalConfigured,
      hasConfiguredProviders: totalConfigured > 0,
      providers: statuses,
    };
  }

  public resolveVerifierChain(
    primaryId?: string,
    fallbackIds?: string[]
  ): ProviderChainResolution<BlindVerifierProvider> {
    const primary = (primaryId || this.defaultProviderId).toLowerCase();
    const fallbacks = (fallbackIds || DEFAULT_AI_CONFIG.fallbackVerifierProviders || []).map((f) => f.toLowerCase());
    
    // Ordered deduplicated list: [primary, ...fallbacks]
    const fullChain = [primary, ...fallbacks].filter(
      (id, idx, arr) => id && arr.indexOf(id) === idx
    );

    const availableProviders: BlindVerifierProvider[] = [];
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

  public clear(): void {
    this.providers.clear();
    this.defaultProviderId = DEFAULT_AI_CONFIG.defaultVerifierProvider || 'gemini-blind-verifier';
  }

  public reset(): void {
    this.clear();
    this.registerDefaultProviders();
  }
}

export const blindVerifierRegistry = new BlindVerifierRegistry();
