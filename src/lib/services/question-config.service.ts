/**
 * BURRA PARIKSHA CMS - Question Configuration Service
 * Question Studio Production Configuration Infrastructure
 * 
 * Provides validated, cached, real-time access to creator-managed configuration
 * (Real-Life Contexts and Question Styles) backed by the QUESTION_CONFIG Google Sheet.
 */

import { questionConfigRepository, QuestionConfigRepository } from '../repositories/question-config.repository';
import { GroupedQuestionConfig, QuestionConfigDimension, QuestionConfigEntry } from '../../types';
import { QuestionConfigEntryZodSchema } from '../schemas/google-sheets-schema';

export class QuestionConfigError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string = 'QUESTION_CONFIG_ERROR',
    statusCode: number = 400,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'QuestionConfigError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class QuestionConfigService {
  private static instance: QuestionConfigService | null = null;
  private readonly repository: QuestionConfigRepository;

  // In-memory cache to prevent N+1 sheet reads (standard 60-second TTL)
  private configCache: QuestionConfigEntry[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL_MS = 60000; // 1 minute TTL

  private constructor(repository?: QuestionConfigRepository) {
    this.repository = repository || questionConfigRepository;
  }

  public static getInstance(repository?: QuestionConfigRepository): QuestionConfigService {
    if (!QuestionConfigService.instance) {
      QuestionConfigService.instance = new QuestionConfigService(repository);
    }
    return QuestionConfigService.instance;
  }

  /**
   * Resets the singleton instance (useful for testing).
   */
  public static resetInstance(): void {
    QuestionConfigService.instance = null;
  }

  /**
   * Explicitly invalidates the in-memory configuration cache.
   */
  public invalidateCache(): void {
    this.configCache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Validates a single configuration entry from Google Sheets.
   * Throws QuestionConfigError if any required field is missing or malformed.
   */
  public validateEntry(raw: unknown, index?: number): QuestionConfigEntry {
    const prefix = index !== undefined ? `Row ${index + 1}: ` : '';

    if (!raw || typeof raw !== 'object') {
      throw new QuestionConfigError(
        `${prefix}Configuration entry is null or not an object.`,
        'MALFORMED_ENTRY',
        400,
        { index, raw }
      );
    }

    const entry = raw as Record<string, any>;

    // Strict validation of primary fields
    if (!entry.id || typeof entry.id !== 'string' || entry.id.trim() === '') {
      throw new QuestionConfigError(
        `${prefix}Configuration entry missing required 'id'.`,
        'MISSING_REQUIRED_FIELD',
        400,
        { field: 'id', entry }
      );
    }

    if (!entry.dimension || typeof entry.dimension !== 'string' || entry.dimension.trim() === '') {
      throw new QuestionConfigError(
        `${prefix}Configuration entry '${entry.id}' missing required 'dimension'.`,
        'MISSING_REQUIRED_FIELD',
        400,
        { id: entry.id, field: 'dimension', entry }
      );
    }

    const normalizedDimension = entry.dimension.trim().toUpperCase();
    if (normalizedDimension !== 'REAL_LIFE_CONTEXT' && normalizedDimension !== 'QUESTION_STYLE') {
      throw new QuestionConfigError(
        `${prefix}Configuration entry '${entry.id}' has unsupported dimension '${entry.dimension}'. Allowed dimensions: 'REAL_LIFE_CONTEXT', 'QUESTION_STYLE'.`,
        'UNSUPPORTED_DIMENSION',
        400,
        { id: entry.id, dimension: entry.dimension }
      );
    }

    if (!entry.code || typeof entry.code !== 'string' || entry.code.trim() === '') {
      throw new QuestionConfigError(
        `${prefix}Configuration entry '${entry.id}' missing required 'code'.`,
        'MISSING_REQUIRED_FIELD',
        400,
        { id: entry.id, field: 'code', entry }
      );
    }

    if (!entry.displayLabel || typeof entry.displayLabel !== 'string' || entry.displayLabel.trim() === '') {
      throw new QuestionConfigError(
        `${prefix}Configuration entry '${entry.id}' missing required 'display_label'.`,
        'MISSING_REQUIRED_FIELD',
        400,
        { id: entry.id, field: 'displayLabel', entry }
      );
    }

    // Parse sortOrder safely
    const sortOrder = typeof entry.sortOrder === 'number'
      ? entry.sortOrder
      : (isNaN(Number(entry.sortOrder)) ? 0 : Number(entry.sortOrder));

    // Parse boolean flags safely
    const isActive = typeof entry.isActive === 'boolean'
      ? entry.isActive
      : String(entry.isActive).toLowerCase() === 'true';

    const isDefault = typeof entry.isDefault === 'boolean'
      ? entry.isDefault
      : String(entry.isDefault).toLowerCase() === 'true';

    // Validate using Zod schema contract as secondary assurance
    const zodResult = QuestionConfigEntryZodSchema.safeParse({
      id: entry.id.trim(),
      dimension: normalizedDimension,
      code: entry.code.trim(),
      displayLabel: entry.displayLabel.trim(),
      description: entry.description ? String(entry.description).trim() : undefined,
      aiPromptGuidance: entry.aiPromptGuidance ? String(entry.aiPromptGuidance).trim() : undefined,
      sortOrder,
      isActive,
      isDefault,
      updatedAt: entry.updatedAt ? String(entry.updatedAt) : undefined,
    });

    if (!zodResult.success) {
      throw new QuestionConfigError(
        `${prefix}Entry '${entry.id}' failed schema validation: ${zodResult.error.issues.map((i) => i.message).join('; ')}`,
        'SCHEMA_VALIDATION_FAILED',
        400,
        { id: entry.id, issues: zodResult.error.issues }
      );
    }

    return zodResult.data as QuestionConfigEntry;
  }

  /**
   * Loads all configuration rows from Google Sheets, applies schema validation,
   * and caches the result for 60 seconds.
   * 
   * Throws a QuestionConfigError if the worksheet is empty or malformed.
   */
  public async loadAllConfig(forceRefresh: boolean = false): Promise<QuestionConfigEntry[]> {
    const now = Date.now();

    if (!forceRefresh && this.configCache && (now - this.cacheTimestamp < this.CACHE_TTL_MS)) {
      return this.configCache;
    }

    const rawRecords = await this.repository.findAll();

    if (!rawRecords || rawRecords.length === 0) {
      throw new QuestionConfigError(
        'QUESTION_CONFIG worksheet is empty or contains no records. Real-time production configuration cannot be loaded.',
        'EMPTY_CONFIGURATION',
        404
      );
    }

    const validated: QuestionConfigEntry[] = [];
    for (let i = 0; i < rawRecords.length; i++) {
      const entry = this.validateEntry(rawRecords[i], i);
      validated.push(entry);
    }

    this.configCache = validated;
    this.cacheTimestamp = now;
    return validated;
  }

  /**
   * Retrieves all configuration entries (active and inactive), sorted by sortOrder.
   */
  public async getAllConfig(forceRefresh: boolean = false): Promise<QuestionConfigEntry[]> {
    const all = await this.loadAllConfig(forceRefresh);
    return [...all].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Retrieves all active configuration entries across all dimensions.
   */
  public async getAllActiveConfig(forceRefresh: boolean = false): Promise<QuestionConfigEntry[]> {
    const all = await this.loadAllConfig(forceRefresh);
    return all
      .filter((entry) => entry.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Retrieves entries for a specific dimension.
   * @param dimension 'REAL_LIFE_CONTEXT' or 'QUESTION_STYLE'
   * @param activeOnly If true (default), returns only active entries
   */
  public async getEntriesByDimension(
    dimension: QuestionConfigDimension,
    activeOnly: boolean = true,
    forceRefresh: boolean = false
  ): Promise<QuestionConfigEntry[]> {
    const all = await this.loadAllConfig(forceRefresh);
    const targetDim = dimension.toUpperCase();
    return all
      .filter((entry) => entry.dimension === targetDim && (!activeOnly || entry.isActive))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Exposes active REAL_LIFE_CONTEXT configuration catalogue.
   */
  public async getRealLifeContexts(activeOnly: boolean = true, forceRefresh: boolean = false): Promise<QuestionConfigEntry[]> {
    return this.getEntriesByDimension('REAL_LIFE_CONTEXT', activeOnly, forceRefresh);
  }

  /**
   * Exposes active QUESTION_STYLE configuration catalogue.
   */
  public async getQuestionStyles(activeOnly: boolean = true, forceRefresh: boolean = false): Promise<QuestionConfigEntry[]> {
    return this.getEntriesByDimension('QUESTION_STYLE', activeOnly, forceRefresh);
  }

  /**
   * Identifies the configured default entry for a dimension.
   * Logic:
   * 1. Check active entries in dimension with isDefault === true.
   * 2. If multiple have isDefault === true, pick lowest sortOrder.
   * 3. If none have isDefault === true, fall back to first active entry by sortOrder.
   * 4. If dimension has no active entries, return null.
   */
  public async getDefault(
    dimension: QuestionConfigDimension,
    forceRefresh: boolean = false
  ): Promise<QuestionConfigEntry | null> {
    const entries = await this.getEntriesByDimension(dimension, true, forceRefresh);
    if (entries.length === 0) return null;

    const explicitDefault = entries.find((e) => e.isDefault);
    return explicitDefault || entries[0];
  }

  /**
   * Retrieves the configured default REAL_LIFE_CONTEXT.
   */
  public async getDefaultRealLifeContext(forceRefresh: boolean = false): Promise<QuestionConfigEntry | null> {
    return this.getDefault('REAL_LIFE_CONTEXT', forceRefresh);
  }

  /**
   * Retrieves the configured default QUESTION_STYLE.
   */
  public async getDefaultQuestionStyle(forceRefresh: boolean = false): Promise<QuestionConfigEntry | null> {
    return this.getDefault('QUESTION_STYLE', forceRefresh);
  }

  /**
   * Finds a configuration entry by dimension and code.
   */
  public async getByCode(
    dimension: QuestionConfigDimension,
    code: string,
    forceRefresh: boolean = false
  ): Promise<QuestionConfigEntry | null> {
    const entries = await this.getEntriesByDimension(dimension, false, forceRefresh);
    const cleanCode = (code || '').trim().toUpperCase();
    return entries.find((e) => e.code.toUpperCase() === cleanCode) || null;
  }

  /**
   * Finds a configuration entry by its stable primary ID (e.g. CFG-STY-001).
   */
  public async getById(id: string, forceRefresh: boolean = false): Promise<QuestionConfigEntry | null> {
    const all = await this.loadAllConfig(forceRefresh);
    const cleanId = (id || '').trim();
    return all.find((e) => e.id === cleanId) || null;
  }

  /**
   * Returns complete grouped active configuration payload for Question Studio API consumption.
   */
  public async getGroupedActiveConfig(forceRefresh: boolean = false): Promise<GroupedQuestionConfig> {
    const [realLifeContexts, questionStyles] = await Promise.all([
      this.getRealLifeContexts(true, forceRefresh),
      this.getQuestionStyles(true, forceRefresh),
    ]);

    const defaultRealLifeContext = realLifeContexts.find((e) => e.isDefault) || realLifeContexts[0] || null;
    const defaultQuestionStyle = questionStyles.find((e) => e.isDefault) || questionStyles[0] || null;

    return {
      realLifeContexts,
      questionStyles,
      defaultRealLifeContext,
      defaultQuestionStyle,
    };
  }

  /**
   * Checks if a real-life context is active, inactive, or not configured in QUESTION_CONFIG.
   */
  public async checkContextStatus(context: string): Promise<'ACTIVE' | 'INACTIVE' | 'NOT_CONFIGURED'> {
    if (!context || !context.trim()) return 'NOT_CONFIGURED';
    const clean = context.trim().toUpperCase();
    const allContexts = await this.getRealLifeContexts(false);
    const match = allContexts.find(
      (c) => c.code.toUpperCase() === clean || c.displayLabel.toUpperCase() === clean
    );
    if (!match) return 'NOT_CONFIGURED';
    return match.isActive ? 'ACTIVE' : 'INACTIVE';
  }
}

export const questionConfigService = QuestionConfigService.getInstance();
