export * from './ai.error';

import { AIErrorClassification, sanitizeKeyInMessage } from './ai.error';

export class GeminiError extends Error {
  public readonly statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(sanitizeKeyInMessage(message));
    this.name = 'GeminiError';
    this.statusCode = statusCode;
  }
}

export class AIValidationError extends Error {
  public readonly validationErrors?: any;
  constructor(message: string, validationErrors?: any) {
    super(sanitizeKeyInMessage(message));
    this.name = 'AIValidationError';
    this.validationErrors = validationErrors;
  }
}

export class AIOrchestrationError extends Error {
  public readonly attemptedProviders?: string[];
  constructor(message: string, attemptedProviders?: string[]) {
    super(sanitizeKeyInMessage(message));
    this.name = 'AIOrchestrationError';
    this.attemptedProviders = attemptedProviders;
  }
}

export class AIConfigurationError extends Error {
  constructor(message: string) {
    super(sanitizeKeyInMessage(message));
    this.name = 'AIConfigurationError';
  }
}

export class AIParsingError extends Error {
  public readonly rawResponse?: string;
  constructor(message: string, rawResponse?: string) {
    super(sanitizeKeyInMessage(message));
    this.name = 'AIParsingError';
    this.rawResponse = rawResponse;
  }
}
