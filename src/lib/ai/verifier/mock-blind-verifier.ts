/**
 * BURRA PARIKSHA CMS - Mock Blind Verifier Provider
 * Phase 22.3: Blind Independent Verifier Architecture (Option C)
 * 
 * In-memory test fake for deterministic, quota-free testing of blind verification.
 */

import {
  BlindVerifierInputDTO,
  BlindVerifierOutputDTO,
  BlindVerifierProvider,
  VerifierProviderOptions,
} from './types';
import { AIProviderError, AIErrorClassification } from '../error';

export interface MockVerifierConfig {
  solvedOption?: 'A' | 'B' | 'C' | 'D' | 'UNSOLVABLE' | 'MULTIPLE';
  derivedValue?: string;
  independentProof?: string;
  confidence?: number;
  isSolvable?: boolean;
  hasMultipleValidOptions?: boolean;
  validOptions?: ('A' | 'B' | 'C' | 'D')[];
  notes?: string;
  simulateError?: {
    classification: AIErrorClassification;
    message: string;
    statusCode?: number;
  };
}

export class MockBlindVerifierProvider implements BlindVerifierProvider {
  public readonly providerId: string;
  public readonly modelId: string;
  public callCount: number = 0;
  public lastReceivedInput: BlindVerifierInputDTO | null = null;
  public config: MockVerifierConfig;

  constructor(
    providerId: string = 'mock-blind-verifier',
    modelId: string = 'mock-verifier-model-v1',
    config: MockVerifierConfig = {}
  ) {
    this.providerId = providerId;
    this.modelId = modelId;
    this.config = {
      solvedOption: 'B',
      derivedValue: '48 km/h',
      independentProof: 'Step 1: Calculate harmonic mean speed = 2*40*60 / (40+60) = 48 km/h. Hence Option B.',
      confidence: 0.95,
      isSolvable: true,
      hasMultipleValidOptions: false,
      ...config,
    };
  }

  public isConfigured(): boolean {
    return true;
  }

  public setOutcome(config: MockVerifierConfig): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  public async verifyCandidateBlind(
    input: BlindVerifierInputDTO,
    options?: VerifierProviderOptions
  ): Promise<BlindVerifierOutputDTO> {
    this.callCount++;
    this.lastReceivedInput = input;

    if (this.config.simulateError) {
      throw new AIProviderError(
        this.config.simulateError.message,
        this.providerId,
        this.modelId,
        this.config.simulateError.classification,
        false,
        this.config.simulateError.statusCode || 500
      );
    }

    return {
      solvedOption: this.config.solvedOption || 'B',
      derivedValue: this.config.derivedValue,
      independentProof: this.config.independentProof || 'Step-by-step verified derivation.',
      confidence: this.config.confidence !== undefined ? this.config.confidence : 0.95,
      isSolvable: this.config.isSolvable !== undefined ? this.config.isSolvable : true,
      hasMultipleValidOptions: Boolean(this.config.hasMultipleValidOptions),
      validOptions: this.config.validOptions,
      notes: this.config.notes,
    };
  }
}
