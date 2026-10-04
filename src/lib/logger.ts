/**
 * BURRA PARIKSHA CMS — Structured Cloud Logging Subsystem
 * Stage 27 Feature Contract: FC-004 (Audit Ledger & Observability)
 * Stage 21 Architectural Specification: BP-ARCH-21-AUDIT-OBSERVABILITY (Section 10)
 *
 * Implements structured JSON logging adhering to Google Cloud Logging specification:
 * - Standard severity levels: DEBUG, INFO, WARN, ERROR, CRITICAL
 * - Mandatory correlation fields: requestId, traceId, timestamp, service
 * - Automatic recursive sensitive-data redaction
 * - Subsystem error capture with sanitized client output
 */

import { redactSensitiveData } from '../types/audit';

export type LogSeverity = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface HttpRequestLogContext {
  requestMethod: string;
  requestUrl: string;
  status?: number;
  userAgent?: string;
  remoteIp?: string;
  latency?: string;
}

export interface LogContext {
  requestId?: string;
  traceId?: string;
  actorId?: string;
  operation?: string;
  resource?: string;
  durationMs?: number;
  httpRequest?: HttpRequestLogContext;
  labels?: Record<string, string>;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface StructuredLogEntry {
  severity: LogSeverity;
  timestamp: string;
  service: string;
  environment: string;
  message: string;
  requestId?: string;
  traceId?: string;
  actorId?: string;
  operation?: string;
  resource?: string;
  durationMs?: number;
  httpRequest?: HttpRequestLogContext;
  labels?: Record<string, string>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  metadata?: Record<string, unknown>;
}

export type LogOutputHandler = (entry: StructuredLogEntry, formattedJson: string) => void;

export class StructuredLogger {
  private static instance: StructuredLogger | null = null;
  private readonly service = 'bp-cms-api';
  private readonly environment: string;
  private minSeverity: LogSeverity = 'INFO';
  private capturedLogs: StructuredLogEntry[] = [];
  private outputHandlers: LogOutputHandler[] = [];

  private readonly severityRanks: Record<LogSeverity, number> = {
    DEBUG: 10,
    INFO: 20,
    WARN: 30,
    ERROR: 40,
    CRITICAL: 50,
  };

  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    const envLevel = (process.env.LOG_LEVEL || '').toUpperCase();
    if (envLevel in this.severityRanks) {
      this.minSeverity = envLevel as LogSeverity;
    } else if (this.environment === 'test') {
      this.minSeverity = 'DEBUG';
    }
  }

  public static getInstance(): StructuredLogger {
    if (!StructuredLogger.instance) {
      StructuredLogger.instance = new StructuredLogger();
    }
    return StructuredLogger.instance;
  }

  public setMinSeverity(severity: LogSeverity): void {
    this.minSeverity = severity;
  }

  public addOutputHandler(handler: LogOutputHandler): void {
    this.outputHandlers.push(handler);
  }

  public clearCapturedLogs(): void {
    this.capturedLogs = [];
  }

  public getCapturedLogs(): StructuredLogEntry[] {
    return [...this.capturedLogs];
  }

  private shouldLog(severity: LogSeverity): boolean {
    return this.severityRanks[severity] >= this.severityRanks[this.minSeverity];
  }

  private formatEntry(
    severity: LogSeverity,
    message: string,
    context?: LogContext,
    err?: Error | unknown
  ): StructuredLogEntry {
    const sanitizedContext = context ? redactSensitiveData(context) : {};

    const entry: StructuredLogEntry = {
      severity,
      timestamp: new Date().toISOString(),
      service: this.service,
      environment: this.environment,
      message,
    };

    if (sanitizedContext.requestId) entry.requestId = sanitizedContext.requestId;
    if (sanitizedContext.traceId) entry.traceId = sanitizedContext.traceId;
    if (sanitizedContext.actorId) entry.actorId = sanitizedContext.actorId;
    if (sanitizedContext.operation) entry.operation = sanitizedContext.operation;
    if (sanitizedContext.resource) entry.resource = sanitizedContext.resource;
    if (sanitizedContext.durationMs !== undefined) entry.durationMs = sanitizedContext.durationMs;
    if (sanitizedContext.httpRequest) entry.httpRequest = sanitizedContext.httpRequest;
    if (sanitizedContext.labels) entry.labels = sanitizedContext.labels;
    if (sanitizedContext.metadata) entry.metadata = sanitizedContext.metadata;

    if (err) {
      if (err instanceof Error) {
        entry.error = {
          name: err.name,
          message: err.message,
          stack: err.stack,
          code: (err as any).code || (err as any).statusCode ? String((err as any).code || (err as any).statusCode) : undefined,
        };
      } else {
        entry.error = {
          name: 'UnknownError',
          message: String(err),
        };
      }
    }

    return entry;
  }

  private writeLog(entry: StructuredLogEntry): void {
    this.capturedLogs.push(entry);

    const json = JSON.stringify(entry);

    if (this.outputHandlers.length > 0) {
      for (const handler of this.outputHandlers) {
        handler(entry, json);
      }
    }

    // Default console outputs in non-test mode or when desired
    if (process.env.NODE_ENV !== 'test') {
      if (entry.severity === 'ERROR' || entry.severity === 'CRITICAL') {
        process.stderr.write(json + '\n');
      } else {
        process.stdout.write(json + '\n');
      }
    }
  }

  public debug(message: string, context?: LogContext): void {
    if (this.shouldLog('DEBUG')) {
      const entry = this.formatEntry('DEBUG', message, context);
      this.writeLog(entry);
    }
  }

  public info(message: string, context?: LogContext): void {
    if (this.shouldLog('INFO')) {
      const entry = this.formatEntry('INFO', message, context);
      this.writeLog(entry);
    }
  }

  public warn(message: string, context?: LogContext): void {
    if (this.shouldLog('WARN')) {
      const entry = this.formatEntry('WARN', message, context);
      this.writeLog(entry);
    }
  }

  public error(message: string, err?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('ERROR')) {
      const entry = this.formatEntry('ERROR', message, context, err);
      this.writeLog(entry);
    }
  }

  public critical(message: string, err?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('CRITICAL')) {
      const entry = this.formatEntry('CRITICAL', message, context, err);
      this.writeLog(entry);
    }
  }
}

export const logger = StructuredLogger.getInstance();
