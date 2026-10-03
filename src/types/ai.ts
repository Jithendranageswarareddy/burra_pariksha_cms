/**
 * BURRA PARIKSHA CMS - AI Abstraction & Multi-Provider Contracts
 * Centralized multi-provider AI infrastructure data structures.
 */

export type AIProviderId =
  | 'GEMINI'
  | 'OPENROUTER'
  | 'GROQ'
  | 'MISTRAL'
  | 'COHERE'
  | 'HUGGING_FACE'
  | 'CEREBRAS'
  | 'EXPERIMENTAL_LABS'
  | string;

export type AITaskType = 'GENERATION' | 'VERIFICATION' | 'ANALYSIS' | 'REFINEMENT';

export type AIProviderHealthState =
  | 'HEALTHY'
  | 'DEGRADED'
  | 'UNAVAILABLE'
  | 'UNCONFIGURED'
  | 'RATE_LIMITED';

export type AIFailureCategory =
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'RATE_LIMITED'
  | 'AUTH_ERROR'
  | 'INVALID_REQUEST'
  | 'MODEL_UNAVAILABLE'
  | 'PROVIDER_ERROR'
  | 'QUOTA_EXCEEDED'
  | 'UNCONFIGURED'
  | 'UNKNOWN';

export type AIGenerationSource =
  | 'GEMINI'
  | 'OPENROUTER'
  | 'GROQ'
  | 'MISTRAL'
  | 'COHERE'
  | 'HUGGING_FACE'
  | 'CEREBRAS'
  | 'EXPERIMENTAL_LABS'
  | 'AI_UNAVAILABLE'
  | 'MANUAL';

export interface AIRetryPolicy {
  maxRetries: number;
  initialBackoffMs: number;
  backoffFactor: number;
}

export interface AIRateLimitState {
  isRateLimited: boolean;
  rateLimitResetAt?: string;
  retryAfterMs?: number;
}

export interface AIProviderMetadata {
  providerId: AIProviderId;
  displayName: string;
  isEnabled: boolean;
  isConfigured: boolean;
  supportedCapabilities: AITaskType[];
  supportedModels: string[];
  defaultModelId: string;
  healthState: AIProviderHealthState;
  priority: number;
  timeoutMs: number;
  retryPolicy: AIRetryPolicy;
  rateLimitState: AIRateLimitState;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  lastErrorClassification?: AIFailureCategory;
  consecutiveFailures: number;
  avgLatencyMs?: number;
}

export interface AIRequest {
  task: AITaskType;
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  responseSchema?: any;
  options?: Record<string, any>;
  timeoutMs?: number;
  preferredModel?: string;
}

export interface AIAttemptDetail {
  providerId: string;
  modelId: string;
  success: boolean;
  latencyMs: number;
  errorClassification?: AIFailureCategory;
  errorMessage?: string;
  timestamp: string;
}

export interface AIProvenance {
  provider: string;
  model: string;
  task: AITaskType;
  generationSource: AIGenerationSource;
  timestamp: string;
  fallbackUsed: boolean;
  attempts: AIAttemptDetail[];
}

export interface AINormalizedResponse {
  status: 'SUCCESS' | 'AI_UNAVAILABLE' | 'FAILED';
  text: string;
  data?: any;
  provenance: AIProvenance;
  error?: string;
  failureCategory?: AIFailureCategory;
}

export interface AIProviderHealth {
  providerId: AIProviderId;
  healthState: AIProviderHealthState;
  isConfigured: boolean;
  latencyMs?: number;
  lastCheckedAt: string;
  message?: string;
}

export interface IAIProvider {
  readonly providerId: AIProviderId;
  readonly displayName: string;
  isEnabled: boolean;
  
  getMetadata(): AIProviderMetadata;
  isConfigured(): boolean;
  supportsCapability(task: AITaskType): boolean;
  executeTask(request: AIRequest): Promise<AINormalizedResponse>;
  checkHealth(): Promise<AIProviderHealth>;
  recordSuccess(latencyMs: number): void;
  recordFailure(category: AIFailureCategory, errorMsg: string, retryAfterMs?: number): void;
}

