/**
 * BURRA PARIKSHA CMS - Centralized Server-Side Google Sheets Client
 * Phase 2: Google Sheets Database Architecture & Persistence
 * 
 * Manages service account JWT authentication and high-level Sheets API operations.
 * Credentials are NEVER exposed to browser code.
 */

import { google, sheets_v4 } from 'googleapis';
import {
  classifyError,
  GoogleAuthError,
  GoogleSheetsApiError,
  RateLimitError,
  RequestTimeoutError,
  SpreadsheetNotFoundError,
  TransientGoogleSheetsError,
  WorksheetNotFoundError,
} from './errors';
import { colIndexToA1Letter } from './helpers';
import { deletionSafetyService, DirectDeleteBypassError, VerifiedDeletionToken } from '../services/deletion-safety.service';

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  clientEmail: string;
  privateKey: string;
}

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  timeoutMs?: number;
}

export interface OperationalTelemetry {
  lastSuccessfulOperation: string | null;
  lastFailedOperation: string | null;
  lastFailureCategory: string | null;
  totalRetries: number;
  lastLatencyMs: number | null;
  lastSuccessTimestamp: string | null;
  lastFailureTimestamp: string | null;
  rateLimiter?: {
    queuedRequests: number;
    activeRequests: number;
    availableTokens: number;
    throttledRequests: number;
    rateLimitHits: number;
    globalCooldownActive: boolean;
  };
}

export interface RateLimiterConfig {
  bucketCapacity: number;
  refillRatePerSecond: number;
  maxConcurrentRequests: number;
  minIntervalMs: number;
  rateLimitBackoffBaseMs: number;
  rateLimitBackoffMaxMs: number;
  enabled: boolean;
}

export interface RateLimiterStats {
  availableTokens: number;
  activeRequests: number;
  queuedRequests: number;
  totalThrottledRequests: number;
  rateLimitHits: number;
  globalCooldownActive: boolean;
  globalCooldownRemainingMs: number;
}

export function isRateLimitError(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof RateLimitError) return true;
  const anyErr = err as any;
  const status = Number(anyErr?.statusCode || anyErr?.status || anyErr?.code);
  if (status === 429) return true;
  const msg = String(anyErr?.message || anyErr || '').toLowerCase();
  return (
    msg.includes('rate limit') ||
    msg.includes('quota exceeded') ||
    msg.includes('user rate limit exceeded') ||
    msg.includes('resource_exhausted')
  );
}

/**
 * P-02 HARDENING: Proactive Outgoing Request Pressure & Burst Protection
 * Manages token bucket pacing, concurrency serialization, and global 429 circuit breaking.
 */
export class RequestPressureLimiter {
  private config: RateLimiterConfig;
  private tokens: number;
  private lastRefillTimestamp: number;
  private activeRequests: number = 0;
  private lastDispatchTimestamp: number = 0;
  private globalCooldownUntil: number = 0;
  private globalRateLimitStreak: number = 0;
  private totalThrottledRequests: number = 0;
  private rateLimitHits: number = 0;
  private queue: Array<{
    resolve: () => void;
    opName: string;
    enqueuedAt: number;
  }> = [];
  private scheduledTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(initialConfig?: Partial<RateLimiterConfig>) {
    this.config = {
      bucketCapacity: initialConfig?.bucketCapacity ?? 10,
      refillRatePerSecond: initialConfig?.refillRatePerSecond ?? 2,
      maxConcurrentRequests: initialConfig?.maxConcurrentRequests ?? 4,
      minIntervalMs: initialConfig?.minIntervalMs ?? 50,
      rateLimitBackoffBaseMs: initialConfig?.rateLimitBackoffBaseMs ?? 1500,
      rateLimitBackoffMaxMs: initialConfig?.rateLimitBackoffMaxMs ?? 15000,
      enabled: initialConfig?.enabled ?? true,
    };
    this.tokens = this.config.bucketCapacity;
    this.lastRefillTimestamp = Date.now();
  }

  public configure(options?: Partial<RateLimiterConfig>): void {
    if (!options) return;
    this.config = { ...this.config, ...options };
    if (this.tokens > this.config.bucketCapacity) {
      this.tokens = this.config.bucketCapacity;
    }
    this.scheduleNext();
  }

  public reset(): void {
    if (this.scheduledTimer) {
      clearTimeout(this.scheduledTimer);
      this.scheduledTimer = null;
    }
    this.tokens = this.config.bucketCapacity;
    this.lastRefillTimestamp = Date.now();
    this.activeRequests = 0;
    this.lastDispatchTimestamp = 0;
    this.globalCooldownUntil = 0;
    this.globalRateLimitStreak = 0;
    this.totalThrottledRequests = 0;
    this.rateLimitHits = 0;
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      item?.resolve();
    }
  }

  public getStats(): RateLimiterStats {
    this.refillTokens();
    const now = Date.now();
    return {
      availableTokens: Math.floor(this.tokens * 100) / 100,
      activeRequests: this.activeRequests,
      queuedRequests: this.queue.length,
      totalThrottledRequests: this.totalThrottledRequests,
      rateLimitHits: this.rateLimitHits,
      globalCooldownActive: now < this.globalCooldownUntil,
      globalCooldownRemainingMs: Math.max(0, this.globalCooldownUntil - now),
    };
  }

  private refillTokens(): void {
    const now = Date.now();
    const elapsedSec = (now - this.lastRefillTimestamp) / 1000;
    if (elapsedSec > 0) {
      this.tokens = Math.min(this.config.bucketCapacity, this.tokens + elapsedSec * this.config.refillRatePerSecond);
      this.lastRefillTimestamp = now;
    }
  }

  public async acquireSlot(opName: string): Promise<void> {
    if (!this.config.enabled) {
      this.activeRequests++;
      return;
    }

    this.refillTokens();
    const now = Date.now();

    const notInCooldown = now >= this.globalCooldownUntil;
    const underConcurrency = this.activeRequests < this.config.maxConcurrentRequests;
    const hasToken = this.tokens >= 1;
    const intervalSatisfied = (now - this.lastDispatchTimestamp) >= this.config.minIntervalMs;

    if (this.queue.length === 0 && notInCooldown && underConcurrency && hasToken && intervalSatisfied) {
      this.tokens -= 1;
      this.activeRequests++;
      this.lastDispatchTimestamp = Date.now();
      return;
    }

    this.totalThrottledRequests++;
    return new Promise<void>((resolve) => {
      this.queue.push({
        resolve,
        opName,
        enqueuedAt: Date.now(),
      });
      this.scheduleNext();
    });
  }

  public releaseSlot(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    this.scheduleNext();
  }

  public notifyRateLimitHit(err?: unknown): void {
    this.rateLimitHits++;
    this.globalRateLimitStreak++;
    const streak = this.globalRateLimitStreak;
    const backoff = calculateBackoffDelay(streak - 1, {
      initialDelayMs: this.config.rateLimitBackoffBaseMs,
      maxDelayMs: this.config.rateLimitBackoffMaxMs,
      backoffMultiplier: 2,
      jitter: true,
    });
    this.globalCooldownUntil = Math.max(this.globalCooldownUntil, Date.now() + backoff);
    this.scheduleNext();
  }

  public notifySuccess(): void {
    if (this.globalRateLimitStreak > 0) {
      this.globalRateLimitStreak = Math.max(0, this.globalRateLimitStreak - 1);
    }
  }

  private scheduleNext(): void {
    if (this.queue.length === 0) {
      if (this.scheduledTimer) {
        clearTimeout(this.scheduledTimer);
        this.scheduledTimer = null;
      }
      return;
    }

    if (this.scheduledTimer) {
      return;
    }

    const now = Date.now();
    let waitMs = 0;

    if (now < this.globalCooldownUntil) {
      waitMs = Math.max(waitMs, this.globalCooldownUntil - now);
    }

    if (this.activeRequests >= this.config.maxConcurrentRequests) {
      return;
    }

    this.refillTokens();
    if (this.tokens < 1) {
      const needed = 1 - this.tokens;
      const refillMs = Math.ceil((needed / this.config.refillRatePerSecond) * 1000);
      waitMs = Math.max(waitMs, refillMs);
    }

    const elapsed = now - this.lastDispatchTimestamp;
    if (elapsed < this.config.minIntervalMs) {
      waitMs = Math.max(waitMs, this.config.minIntervalMs - elapsed);
    }

    this.scheduledTimer = setTimeout(() => {
      this.scheduledTimer = null;
      this.drainOne();
    }, waitMs);
  }

  private drainOne(): void {
    if (this.queue.length === 0) return;

    const now = Date.now();
    if (now < this.globalCooldownUntil) {
      this.scheduleNext();
      return;
    }

    if (this.activeRequests >= this.config.maxConcurrentRequests) {
      return;
    }

    this.refillTokens();
    if (this.tokens < 1) {
      this.scheduleNext();
      return;
    }

    const elapsed = now - this.lastDispatchTimestamp;
    if (elapsed < this.config.minIntervalMs) {
      this.scheduleNext();
      return;
    }

    const item = this.queue.shift();
    if (item) {
      this.tokens -= 1;
      this.activeRequests++;
      this.lastDispatchTimestamp = Date.now();
      item.resolve();
    }

    if (this.queue.length > 0) {
      this.scheduleNext();
    }
  }
}

/**
 * Calculates exponential backoff delay with bounded cap and optional jitter.
 */
export function calculateBackoffDelay(
  attempt: number,
  options?: Pick<RetryOptions, 'initialDelayMs' | 'maxDelayMs' | 'backoffMultiplier' | 'jitter'>
): number {
  const initial = options?.initialDelayMs ?? 1200;
  const maxDelay = options?.maxDelayMs ?? 10000;
  const multiplier = options?.backoffMultiplier ?? 2;
  const useJitter = options?.jitter ?? true;

  const exponential = initial * Math.pow(multiplier, attempt);
  const capped = Math.min(exponential, maxDelay);
  const jitterOffset = useJitter ? Math.floor(Math.random() * 300) : 0;

  return capped + jitterOffset;
}

export class GoogleSheetsClient {
  private static instance: GoogleSheetsClient | null = null;
  private sheetsApi: sheets_v4.Sheets | null = null;
  private spreadsheetId: string = '';
  private isAuthInitialized = false;

  // Short-lived row cache to prevent rapid API exhaustion
  private rowCache = new Map<string, { data: { headers: string[]; rows: (string | number | boolean)[][] }; timestamp: number }>();
  private readonly ROW_CACHE_TTL_MS = 2500;

  // In-flight read deduplication map to coalesce concurrent requests
  private inFlightReads = new Map<string, Promise<{ headers: string[]; rows: (string | number | boolean)[][] }>>();

  // In-flight header deduplication map to coalesce concurrent requests
  private inFlightHeaders = new Map<string, Promise<string[]>>();

  // P-02: Request pressure limiter (token bucket + concurrency + 429 global circuit breaker)
  private rateLimiter: RequestPressureLimiter;

  // Operational telemetry
  private lastSuccessfulOp: string | null = null;
  private lastFailedOp: string | null = null;
  private lastFailureCategory: string | null = null;
  private totalRetries: number = 0;
  private lastLatencyMs: number | null = null;
  private lastSuccessTimestamp: string | null = null;
  private lastFailureTimestamp: string | null = null;

  private constructor() {
    // Production defaults
    this.rateLimiter = new RequestPressureLimiter({
      bucketCapacity: 10,
      refillRatePerSecond: 2,
      maxConcurrentRequests: 4,
      minIntervalMs: 50,
      rateLimitBackoffBaseMs: 1500,
      rateLimitBackoffMaxMs: 15000,
      enabled: true,
    });
  }

  public static getInstance(): GoogleSheetsClient {
    if (!GoogleSheetsClient.instance) {
      GoogleSheetsClient.instance = new GoogleSheetsClient();
    }
    return GoogleSheetsClient.instance;
  }

  public invalidateRowCache(sheetName?: string): void {
    if (sheetName) {
      if (sheetName.includes(':')) {
        this.rowCache.delete(sheetName);
        this.inFlightReads.delete(sheetName);
        this.inFlightHeaders.delete(sheetName);
      } else {
        for (const key of this.rowCache.keys()) {
          if (key === sheetName || key.endsWith(`:${sheetName}`)) {
            this.rowCache.delete(key);
          }
        }
        for (const key of this.inFlightReads.keys()) {
          if (key === sheetName || key.endsWith(`:${sheetName}`)) {
            this.inFlightReads.delete(key);
          }
        }
        for (const key of this.inFlightHeaders.keys()) {
          if (key === sheetName || key.endsWith(`:${sheetName}`)) {
            this.inFlightHeaders.delete(key);
          }
        }
      }
    } else {
      this.rowCache.clear();
      this.inFlightReads.clear();
      this.inFlightHeaders.clear();
    }
  }

  /**
   * Returns operational telemetry metrics for health reporting.
   */
  public getOperationalTelemetry(): OperationalTelemetry {
    const stats = this.rateLimiter.getStats();
    return {
      lastSuccessfulOperation: this.lastSuccessfulOp,
      lastFailedOperation: this.lastFailedOp,
      lastFailureCategory: this.lastFailureCategory,
      totalRetries: this.totalRetries,
      lastLatencyMs: this.lastLatencyMs,
      lastSuccessTimestamp: this.lastSuccessTimestamp,
      lastFailureTimestamp: this.lastFailureTimestamp,
      rateLimiter: {
        queuedRequests: stats.queuedRequests,
        activeRequests: stats.activeRequests,
        availableTokens: stats.availableTokens,
        throttledRequests: stats.totalThrottledRequests,
        rateLimitHits: stats.rateLimitHits,
        globalCooldownActive: stats.globalCooldownActive,
      },
    };
  }

  public getRateLimiterStats(): RateLimiterStats {
    return this.rateLimiter.getStats();
  }

  public configureRateLimiter(options?: Partial<RateLimiterConfig>): void {
    this.rateLimiter.configure(options);
  }

  public resetRateLimiter(): void {
    this.rateLimiter.reset();
  }

  /**
   * Resets or injects mock telemetry for testing.
   */
  public recordTelemetry(success: boolean, opName: string, latencyMs: number, failureCat?: string): void {
    const timestamp = new Date().toISOString();
    this.lastLatencyMs = latencyMs;
    if (success) {
      this.lastSuccessfulOp = opName;
      this.lastSuccessTimestamp = timestamp;
    } else {
      this.lastFailedOp = opName;
      this.lastFailureCategory = failureCat || 'UNKNOWN_ERROR';
      this.lastFailureTimestamp = timestamp;
    }
  }

  /**
   * Checks if Google Service Account credentials and Spreadsheet ID are configured.
   */
  public isConfigured(overrideSpreadsheetId?: string): boolean {
    if (process.env.SKIP_SHEETS_SYNC === 'true') {
      return false;
    }
    if (overrideSpreadsheetId === 'UNCONFIGURED_ANALYTICS_SPREADSHEET') {
      return false;
    }
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_PRIVATE_KEY;
    const sheetId = overrideSpreadsheetId !== undefined ? overrideSpreadsheetId : this.getSpreadsheetId();
    return Boolean(email && key && sheetId);
  }

  /**
   * Initializes the Google Sheets API client with service account credentials.
   */
  private getSheetsApi(): sheets_v4.Sheets {
    if (this.sheetsApi && this.isAuthInitialized) {
      return this.sheetsApi;
    }

    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!email || !privateKey) {
      throw new GoogleAuthError('GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY must be set in server environment.');
    }

    // Fix escaped line breaks in private key
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    try {
      const auth = new google.auth.JWT({
        email,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheetsApi = google.sheets({ version: 'v4', auth });
      this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '';
      this.isAuthInitialized = true;
      return this.sheetsApi;
    } catch (err: any) {
      throw new GoogleAuthError(`Failed to initialize Google Sheets authentication: ${err?.message || 'Unknown auth error'}`);
    }
  }

  public getSpreadsheetId(overrideSpreadsheetId?: string): string {
    if (overrideSpreadsheetId) {
      return overrideSpreadsheetId;
    }
    return process.env.GOOGLE_SHEETS_ID || this.spreadsheetId;
  }

  public resolveTargetSpreadsheetId(overrideSpreadsheetId?: string): string {
    return this.getSpreadsheetId(overrideSpreadsheetId);
  }

  /**
   * Executes a Google Sheets API operation with bounded retries and exponential backoff
   * for transient errors. Never retries non-transient errors.
   */
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    opName: string,
    options?: RetryOptions
  ): Promise<T> {
    const maxRetries = Math.min(options?.maxRetries ?? 5, 8);
    const timeoutMs = options?.timeoutMs ?? 20000;
    let attempt = 0;
    const startTime = Date.now();

    while (true) {
      // P-02: Acquire rate limiter slot (smooths bursts, caps concurrency, awaits global 429 cooldown)
      await this.rateLimiter.acquireSlot(opName);

      try {
        // Execute operation with timeout protection
        const opPromise = operation();
        let timer: any;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            reject(new RequestTimeoutError(timeoutMs, opName));
          }, timeoutMs);
        });

        const result = await Promise.race([opPromise, timeoutPromise]);
        clearTimeout(timer);

        const latency = Date.now() - startTime;
        this.recordTelemetry(true, opName, latency);
        this.rateLimiter.notifySuccess();
        return result;
      } catch (err: any) {
        const latency = Date.now() - startTime;
        const classification = classifyError(err);
        const rateLimitExceeded = isRateLimitError(err);

        if (rateLimitExceeded) {
          this.rateLimiter.notifyRateLimitHit(err);
        }

        // If non-transient or retry limit exhausted, record failure and throw
        if (classification === 'NON_TRANSIENT' || attempt >= maxRetries) {
          this.recordTelemetry(false, opName, latency, classification);
          if (attempt >= maxRetries && classification === 'TRANSIENT') {
            throw new TransientGoogleSheetsError(
              `Google Sheets operation "${opName}" failed after ${attempt} retries: ${err?.message || 'Transient error limit reached'}`,
              err?.statusCode || 503,
              { opName, attempts: attempt, originalError: err?.message }
            );
          }
          throw err;
        }

        // Transient failure, record retry and wait
        attempt++;
        this.totalRetries++;
        const delay = calculateBackoffDelay(attempt - 1, options);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } finally {
        this.rateLimiter.releaseSlot();
      }
    }
  }

  /**
   * Inspects spreadsheet to fetch title and list of existing worksheet tab names.
   */
  public async getSpreadsheetMetadata(overrideSpreadsheetId?: string): Promise<{ title: string; sheetNames: string[] }> {
    return this.executeWithRetry(async () => {
      const sheets = this.getSheetsApi();
      const spreadsheetId = this.getSpreadsheetId(overrideSpreadsheetId);

      try {
        const res = await sheets.spreadsheets.get({
          spreadsheetId,
        });

        const title = res.data.properties?.title || 'Unknown Spreadsheet';
        const sheetNames = (res.data.sheets || [])
          .map((s) => s.properties?.title)
          .filter((t): t is string => Boolean(t));

        return { title, sheetNames };
      } catch (err: any) {
        this.handleApiError(err, 'getSpreadsheetMetadata');
        throw err;
      }
    }, 'getSpreadsheetMetadata');
  }

  /**
   * Retrieves row 1 (headers) of the specified worksheet.
   * Deduplicates concurrent in-flight requests when multiple callers query headers simultaneously.
   */
  public async getHeaders(sheetName: string, overrideSpreadsheetId?: string): Promise<string[]> {
    const spreadsheetId = this.getSpreadsheetId(overrideSpreadsheetId);
    const cacheKey = `${spreadsheetId}:${sheetName}`;

    // Check if an in-flight read for these headers already exists
    const existingInFlight = this.inFlightHeaders.get(cacheKey);
    if (existingInFlight) {
      const sharedResult = await existingInFlight;
      return [...sharedResult];
    }

    const fetchPromise = this.executeWithRetry(async () => {
      const sheets = this.getSheetsApi();

      try {
        const res = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `'${sheetName}'!1:1`,
        });

        const values = res.data.values;
        if (!values || values.length === 0) {
          return [];
        }

        return (values[0] || []).map((v) => String(v).trim());
      } catch (err: any) {
        this.handleApiError(err, `getHeaders(${sheetName})`, sheetName);
        throw err;
      }
    }, `getHeaders(${sheetName})`);

    this.inFlightHeaders.set(cacheKey, fetchPromise);

    try {
      const freshHeaders = await fetchPromise;
      return [...freshHeaders];
    } finally {
      this.inFlightHeaders.delete(cacheKey);
    }
  }

  /**
   * Retrieves all data rows (starting from row 2) for the specified worksheet.
   * Deduplicates concurrent in-flight requests when row cache is cold/expired.
   */
  public async getRows(
    sheetName: string,
    endColLetter?: string,
    overrideSpreadsheetId?: string
  ): Promise<{ headers: string[]; rows: (string | number | boolean)[][] }> {
    const targetSpreadsheetId = this.getSpreadsheetId(overrideSpreadsheetId);
    const cacheKey = `${targetSpreadsheetId}:${sheetName}`;
    const now = Date.now();
    const cached = this.rowCache.get(cacheKey);
    if (cached && now - cached.timestamp < this.ROW_CACHE_TTL_MS) {
      return { headers: [...cached.data.headers], rows: cached.data.rows.map((r) => [...r]) };
    }

    // Check if an in-flight read for this sheet already exists
    const existingInFlight = this.inFlightReads.get(cacheKey);
    if (existingInFlight) {
      const sharedResult = await existingInFlight;
      return { headers: [...sharedResult.headers], rows: sharedResult.rows.map((r) => [...r]) };
    }

    const colBound = endColLetter ? endColLetter.trim().toUpperCase() : 'ZZ';
    const readRange = `'${sheetName}'!A:${colBound}`;

    const readPromise = (async () => {
      return this.executeWithRetry(async () => {
        const sheets = this.getSheetsApi();
        const spreadsheetId = targetSpreadsheetId;

        try {
          const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: readRange,
            valueRenderOption: 'UNFORMATTED_VALUE',
          });

          const values = res.data.values || [];
          if (values.length === 0) {
            const emptyResult = { headers: [], rows: [] };
            this.rowCache.set(cacheKey, { data: emptyResult, timestamp: Date.now() });
            return emptyResult;
          }

          const headers = (values[0] || []).map((v) => String(v).trim());
          const rows = values.slice(1);
          const result = { headers, rows };

          this.rowCache.set(cacheKey, { data: result, timestamp: Date.now() });
          return result;
        } catch (err: any) {
          this.handleApiError(err, `getRows(${sheetName})`, sheetName);
          throw err;
        }
      }, `getRows(${sheetName})`);
    })();

    this.inFlightReads.set(cacheKey, readPromise);

    try {
      const freshResult = await readPromise;
      return { headers: [...freshResult.headers], rows: freshResult.rows.map((r) => [...r]) };
    } finally {
      this.inFlightReads.delete(cacheKey);
    }
  }

  /**
   * Protects string values matching fractional patterns (e.g. "6/8", "12/15")
   * from automatic date interpretation under USER_ENTERED mode by prefixing them with a single quote (').
   */
  private protectFractionalValues(rowValues: (string | number | boolean)[]): (string | number | boolean)[] {
    return rowValues.map((val) => {
      if (typeof val === 'string' && /^\d+\/\d+$/.test(val)) {
        return `'${val}`;
      }
      return val;
    });
  }

  /**
   * Appends a new record row to the worksheet.
   */
  public async appendRow(sheetName: string, rowValues: (string | number | boolean)[], overrideSpreadsheetId?: string): Promise<void> {
    const spreadsheetId = this.getSpreadsheetId(overrideSpreadsheetId);
    this.invalidateRowCache(`${spreadsheetId}:${sheetName}`);
    const protectedValues = this.protectFractionalValues(rowValues);
    return this.executeWithRetry(async () => {
      const sheets = this.getSheetsApi();

      try {
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `'${sheetName}'!A1`,
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
          requestBody: {
            values: [protectedValues],
          },
        });
        this.invalidateRowCache(`${spreadsheetId}:${sheetName}`);
      } catch (err: any) {
        this.handleApiError(err, `appendRow(${sheetName})`, sheetName);
        throw err;
      }
    }, `appendRow(${sheetName})`);
  }

  /**
   * Updates an existing row (1-based sheet row index, where row 1 is header and row 2 is first record).
   */
  public async updateRow(
    sheetName: string,
    sheetRowIndex: number,
    rowValues: (string | number | boolean)[],
    overrideSpreadsheetId?: string
  ): Promise<void> {
    const spreadsheetId = this.getSpreadsheetId(overrideSpreadsheetId);
    this.invalidateRowCache(`${spreadsheetId}:${sheetName}`);
    const protectedValues = this.protectFractionalValues(rowValues);
    return this.executeWithRetry(async () => {
      const sheets = this.getSheetsApi();
      const endColLetter = colIndexToA1Letter(rowValues.length - 1);
      const range = `'${sheetName}'!A${sheetRowIndex}:${endColLetter}${sheetRowIndex}`;

      try {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [protectedValues],
          },
        });
        this.invalidateRowCache(`${spreadsheetId}:${sheetName}`);
      } catch (err: any) {
        this.handleApiError(err, `updateRow(${sheetName}, row ${sheetRowIndex})`, sheetName);
        throw err;
      }
    }, `updateRow(${sheetName}, row ${sheetRowIndex})`);
  }

  /**
   * Deletes a specific row by 1-based sheet row index.
   * STRICT SAFETY GATE: Direct calls to deleteRow() without a valid single-use VerifiedDeletionToken
   * from DeletionSafetyService are strictly prohibited to prevent unbacked sheet mutations.
   */
  public async deleteRow(
    sheetName: string,
    sheetRowIndex: number,
    overrideSpreadsheetId?: string,
    safetyToken?: VerifiedDeletionToken
  ): Promise<void> {
    const spreadsheetId = this.getSpreadsheetId(overrideSpreadsheetId);

    if (!safetyToken || !deletionSafetyService.consumeToken(safetyToken, sheetName, sheetRowIndex)) {
      throw new DirectDeleteBypassError(
        `Direct call to googleSheetsClient.deleteRow('${sheetName}', ${sheetRowIndex}) is blocked. ` +
        `All deletions must pass through BaseRepository.deleteRecord() with mandatory verified backup.`
      );
    }

    this.invalidateRowCache(`${spreadsheetId}:${sheetName}`);
    return this.executeWithRetry(async () => {
      const sheets = this.getSheetsApi();

      try {
        const metadataRes = await sheets.spreadsheets.get({ spreadsheetId });
        const sheet = (metadataRes.data.sheets || []).find(
          (s) => s.properties?.title === sheetName
        );
        const sheetNumericId = sheet?.properties?.sheetId;

        if (sheetNumericId === undefined || sheetNumericId === null) {
          throw new WorksheetNotFoundError(sheetName);
        }

        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                deleteDimension: {
                  range: {
                    sheetId: sheetNumericId,
                    dimension: 'ROWS',
                    startIndex: sheetRowIndex - 1,
                    endIndex: sheetRowIndex,
                  },
                },
              },
            ],
          },
        });
        this.invalidateRowCache(`${spreadsheetId}:${sheetName}`);
      } catch (err: any) {
        this.handleApiError(err, `deleteRow(${sheetName}, row ${sheetRowIndex})`, sheetName);
        throw err;
      }
    }, `deleteRow(${sheetName}, row ${sheetRowIndex})`);
  }

  /**
   * Helper to ensure required worksheets exist with initial headers if authorized.
   */
  public async createWorksheetIfNotExists(sheetName: string, headers: string[], overrideSpreadsheetId?: string): Promise<boolean> {
    const spreadsheetId = this.getSpreadsheetId(overrideSpreadsheetId);
    return this.executeWithRetry(async () => {
      const sheets = this.getSheetsApi();
      const metadata = await this.getSpreadsheetMetadata(overrideSpreadsheetId);

      if (!metadata.sheetNames.includes(sheetName)) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sheetName,
                    gridProperties: {
                      frozenRowCount: 1,
                    },
                  },
                },
              },
            ],
          },
        });

        // Write headers
        const endColLetter = colIndexToA1Letter(headers.length - 1);
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${sheetName}'!A1:${endColLetter}1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [headers],
          },
        });
        return true;
      }
      return false;
    }, `createWorksheetIfNotExists(${sheetName})`);
  }

  /**
   * Clears all data rows in a worksheet below row 1 (headers).
   */
  public async clearDataRows(sheetName: string, overrideSpreadsheetId?: string): Promise<void> {
    const spreadsheetId = this.getSpreadsheetId(overrideSpreadsheetId);
    this.invalidateRowCache(`${spreadsheetId}:${sheetName}`);
    this.invalidateRowCache(sheetName);
    return this.executeWithRetry(async () => {
      const sheets = this.getSheetsApi();
      try {
        await sheets.spreadsheets.values.clear({
          spreadsheetId,
          range: `'${sheetName}'!A2:ZZ10000`,
        });
        this.invalidateRowCache(`${spreadsheetId}:${sheetName}`);
        this.invalidateRowCache(sheetName);
      } catch (err: any) {
        this.handleApiError(err, `clearDataRows(${sheetName})`, sheetName);
        throw err;
      }
    }, `clearDataRows(${sheetName})`);
  }

  /**
   * Overwrites values in a worksheet starting at a specific range (e.g. 'A2').
   */
  public async updateRangeValues(sheetName: string, rangeA1: string, values: (string | number | boolean)[][], overrideSpreadsheetId?: string): Promise<void> {
    const spreadsheetId = this.getSpreadsheetId(overrideSpreadsheetId);
    this.invalidateRowCache(`${spreadsheetId}:${sheetName}`);
    this.invalidateRowCache(sheetName);
    return this.executeWithRetry(async () => {
      const sheets = this.getSheetsApi();
      try {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${sheetName}'!${rangeA1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values,
          },
        });
        this.invalidateRowCache(`${spreadsheetId}:${sheetName}`);
        this.invalidateRowCache(sheetName);
      } catch (err: any) {
        this.handleApiError(err, `updateRangeValues(${sheetName})`, sheetName);
        throw err;
      }
    }, `updateRangeValues(${sheetName})`);
  }

  /**
   * Central error mapper for Google API exceptions.
   */
  private handleApiError(err: any, context: string, sheetName?: string): void {
    const message = err?.message || String(err);
    const status = err?.status || err?.code;

    if (status === 404 || message.includes('Requested entity was not found')) {
      throw new SpreadsheetNotFoundError(this.getSpreadsheetId());
    }

    if (
      sheetName &&
      (message.toLowerCase().includes('unable to parse range') ||
        message.includes(`'${sheetName}'`) ||
        message.includes(`${sheetName}!`) ||
        message.includes('exceeds grid limits'))
    ) {
      throw new WorksheetNotFoundError(sheetName);
    }

    if (status === 429 || message.includes('Rate Limit Exceeded') || message.includes('Quota exceeded')) {
      throw new RateLimitError();
    }

    if (status === 401 || status === 403 || message.includes('The caller does not have permission') || message.includes('invalid_grant')) {
      throw new GoogleAuthError(`Google API Permission Denied in ${context}: Ensure service account has Editor access to spreadsheet.`);
    }

    if (status >= 500 && status <= 504) {
      throw new TransientGoogleSheetsError(`Google Sheets API Error (${status}) in ${context}: ${message}`, status);
    }
  }
}

export const googleSheetsClient = GoogleSheetsClient.getInstance();

