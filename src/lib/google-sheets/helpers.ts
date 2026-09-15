/**
 * BURRA PARIKSHA CMS - Google Sheets Helper Utilities
 * Phase 2: Google Sheets Database Architecture & Persistence
 * 
 * Provides robust, header-based row-to-object and object-to-row mapping.
 * Avoids hardcoded column index assumptions.
 */

import { ColumnDefinition, SheetSchemaContract } from '../schemas/google-sheets-schema';
import { SchemaMismatchError } from './errors';

/**
 * Converts a 0-indexed column number to an A1-style column letter (0 -> A, 25 -> Z, 26 -> AA).
 */
export function colIndexToA1Letter(colIndex: number): string {
  let temp = colIndex + 1;
  let letter = '';
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}

/**
 * Sanitizes a string value to prevent Google Sheets Formula Injection (CSV/Sheet Injection).
 * Dangerous formula triggers include =, +, -, @, \t, \r.
 * Prefixing formula-like strings with a single quote (') prevents spreadsheet execution
 * while allowing application data to be stored and reconstructed accurately.
 */
export function sanitizeSpreadsheetCellValue(val: string): string {
  if (!val || typeof val !== 'string') return val;
  const trimmed = val.trim();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return "'" + val;
  }
  return val;
}

export function unescapeSpreadsheetCellValue(val: string): string {
  if (typeof val === 'string' && val.startsWith("'") && /^[=+\-@\t\r]/.test(val.slice(1).trim())) {
    return val.slice(1);
  }
  return val;
}

/**
 * Parses raw cell value into typed TypeScript property according to ColumnDefinition.
 */
export function parseCellValue(rawValue: unknown, colDef: ColumnDefinition): unknown {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    if (colDef.type === 'boolean') {
      if (colDef.name.toLowerCase().includes('active') || colDef.propertyKey === 'isActive') {
        return true;
      }
      return false;
    }
    if (colDef.type === 'number') return undefined;
    if (colDef.type === 'json') return undefined;
    return undefined;
  }

  const strVal = String(rawValue).trim();

  switch (colDef.type) {
    case 'number': {
      const num = Number(strVal);
      return isNaN(num) ? undefined : num;
    }
    case 'boolean': {
      const lower = strVal.toLowerCase();
      return lower === 'true' || lower === '1' || lower === 'yes';
    }
    case 'json': {
      try {
        return JSON.parse(strVal);
      } catch {
        return strVal;
      }
    }
    case 'date': {
      // Validate or return ISO 8601 string
      try {
        const d = new Date(strVal);
        return isNaN(d.getTime()) ? strVal : d.toISOString();
      } catch {
        return strVal;
      }
    }
    case 'string':
    default:
      return unescapeSpreadsheetCellValue(strVal);
  }
}

/**
 * Formats typed TypeScript property into a string or primitive suitable for Google Sheets cell.
 */
export function formatCellValue(value: unknown, colDef: ColumnDefinition): string | number | boolean {
  if (value === undefined || value === null) {
    return '';
  }

  switch (colDef.type) {
    case 'number':
      return typeof value === 'number' ? value : Number(value) || 0;
    case 'boolean':
      return Boolean(value);
    case 'json':
      return typeof value === 'string' ? value : JSON.stringify(value);
    case 'date':
      if (value instanceof Date) return value.toISOString();
      if (typeof value === 'string') {
        const d = new Date(value);
        return isNaN(d.getTime()) ? value : d.toISOString();
      }
      return String(value);
    case 'string':
    default:
      return sanitizeSpreadsheetCellValue(String(value));
  }
}

/**
 * Maps a single Google Sheet row array to an entity object using the sheet's current headers.
 */
export function rowToObject<T = Record<string, unknown>>(
  row: (string | number | boolean)[],
  headers: string[],
  schema: SheetSchemaContract
): T {
  const obj: Record<string, unknown> = {};

  // Build header lookup (lowercased for resilience)
  const headerIndices = new Map<string, number>();
  headers.forEach((h, idx) => {
    if (h) headerIndices.set(h.trim().toLowerCase(), idx);
  });

  for (const col of schema.columns) {
    const colNameLower = col.name.trim().toLowerCase();
    const colIdx = headerIndices.get(colNameLower);

    if (colIdx !== undefined && colIdx < row.length) {
      const rawVal = row[colIdx];
      const parsedVal = parseCellValue(rawVal, col);
      if (parsedVal !== undefined) {
        obj[col.propertyKey] = parsedVal;
      }
    }
  }

  // Handle nested options object reconstruction and aliases for Questions if needed
  if (schema.sheetName === 'QUESTIONS') {
    const optA = (obj['optionA'] as string) || '';
    const optB = (obj['optionB'] as string) || '';
    const optC = (obj['optionC'] as string) || '';
    const optD = (obj['optionD'] as string) || '';
    obj['optionA'] = optA;
    obj['optionB'] = optB;
    obj['optionC'] = optC;
    obj['optionD'] = optD;
    obj['options'] = { a: optA, b: optB, c: optC, d: optD };

    // Contract aliases: question <-> questionText
    if (obj['questionText'] && !obj['question']) {
      obj['question'] = obj['questionText'];
    } else if (obj['question'] && !obj['questionText']) {
      obj['questionText'] = obj['question'];
    }

    // Canonical correlation: contentId <-> contentMasterId
    if (obj['contentMasterId'] && !obj['contentId']) {
      obj['contentId'] = obj['contentMasterId'];
    } else if (obj['contentId'] && !obj['contentMasterId']) {
      obj['contentMasterId'] = obj['contentId'];
    }

    // Author: author <-> authorId
    if (obj['authorId'] && !obj['author']) {
      obj['author'] = obj['authorId'];
    } else if (obj['author'] && !obj['authorId']) {
      obj['authorId'] = obj['author'];
    }

    // Real-life context: realLifeContext <-> realWorldContext
    if (obj['realLifeContext'] && !obj['realWorldContext']) {
      obj['realWorldContext'] = obj['realLifeContext'];
    } else if (obj['realWorldContext'] && !obj['realLifeContext']) {
      obj['realLifeContext'] = obj['realWorldContext'];
    }

    // Tags array parsing if stored as comma-separated or JSON
    if (typeof obj['tags'] === 'string') {
      const tagStr = obj['tags'] as string;
      if (tagStr.startsWith('[')) {
        try {
          obj['tags'] = JSON.parse(tagStr);
        } catch {
          obj['tags'] = tagStr.split(',').map((t) => t.trim()).filter(Boolean);
        }
      } else {
        obj['tags'] = tagStr.split(',').map((t) => t.trim()).filter(Boolean);
      }
    } else if (!obj['tags']) {
      obj['tags'] = [];
    }
  }

  // Handle Publishing nested platform objects if needed
  if (schema.sheetName === 'PUBLISHING') {
    obj['youtube'] = {
      status: obj['youtubeStatus'] || 'NOT_STARTED',
      videoUrl: obj['youtubeUrl'] || '',
      publishedAt: obj['youtubePublishedAt'] || undefined,
      scheduledAt: obj['youtubeScheduledAt'] || undefined,
      lastFailureReason: obj['youtubeLastFailureReason'] || undefined,
      retryCount: typeof obj['youtubeRetryCount'] === 'number' ? obj['youtubeRetryCount'] : (obj['youtubeRetryCount'] !== undefined && obj['youtubeRetryCount'] !== '' ? Number(obj['youtubeRetryCount']) : undefined),
      failedAt: obj['youtubeFailedAt'] || undefined,
    };
    obj['instagram'] = {
      status: obj['instagramStatus'] || 'NOT_STARTED',
      postUrl: obj['instagramUrl'] || '',
      publishedAt: obj['instagramPublishedAt'] || undefined,
      scheduledAt: obj['instagramScheduledAt'] || undefined,
      lastFailureReason: obj['instagramLastFailureReason'] || undefined,
      retryCount: typeof obj['instagramRetryCount'] === 'number' ? obj['instagramRetryCount'] : (obj['instagramRetryCount'] !== undefined && obj['instagramRetryCount'] !== '' ? Number(obj['instagramRetryCount']) : undefined),
      failedAt: obj['instagramFailedAt'] || undefined,
    };
    obj['facebook'] = {
      status: obj['facebookStatus'] || 'NOT_STARTED',
      postUrl: obj['facebookUrl'] || '',
      publishedAt: obj['facebookPublishedAt'] || undefined,
      scheduledAt: obj['facebookScheduledAt'] || undefined,
      lastFailureReason: obj['facebookLastFailureReason'] || undefined,
      retryCount: typeof obj['facebookRetryCount'] === 'number' ? obj['facebookRetryCount'] : (obj['facebookRetryCount'] !== undefined && obj['facebookRetryCount'] !== '' ? Number(obj['facebookRetryCount']) : undefined),
      failedAt: obj['facebookFailedAt'] || undefined,
    };
  }

  // Handle USERS multi-role parsing
  if (schema.sheetName === 'USERS') {
    if (obj['role'] && typeof obj['role'] === 'string') {
      const roleStr = obj['role'] as string;
      const parsedRoles = roleStr.split(',').map((r) => r.trim()).filter(Boolean);
      obj['roles'] = parsedRoles.length > 0 ? parsedRoles : [roleStr];
      if (parsedRoles.length > 0) {
        obj['role'] = parsedRoles[0];
      }
    } else if (Array.isArray(obj['roles'])) {
      if (!obj['role'] && (obj['roles'] as string[]).length > 0) {
        obj['role'] = (obj['roles'] as string[])[0];
      }
    } else {
      obj['roles'] = obj['role'] ? [obj['role']] : ['ADMIN'];
    }
  }

  return obj as T;
}

/**
 * Maps an entity object to a row array strictly aligned with the sheet's current headers.
 */
export function objectToRow(
  obj: Record<string, unknown>,
  headers: string[],
  schema: SheetSchemaContract
): (string | number | boolean)[] {
  // Pre-flatten special nested properties if required
  const flatObj = { ...obj };

  if (schema.sheetName === 'USERS') {
    if (Array.isArray(obj['roles']) && obj['roles'].length > 0) {
      flatObj['role'] = (obj['roles'] as string[]).join(', ');
    }
  }

  if (schema.sheetName === 'QUESTIONS') {
    if (obj['options'] && typeof obj['options'] === 'object') {
      const opts = obj['options'] as { a?: string; b?: string; c?: string; d?: string };
      if (opts.a !== undefined) flatObj['optionA'] = opts.a;
      if (opts.b !== undefined) flatObj['optionB'] = opts.b;
      if (opts.c !== undefined) flatObj['optionC'] = opts.c;
      if (opts.d !== undefined) flatObj['optionD'] = opts.d;
    } else if (obj['optionA'] !== undefined || obj['optionB'] !== undefined) {
      flatObj['optionA'] = obj['optionA'] || '';
      flatObj['optionB'] = obj['optionB'] || '';
      flatObj['optionC'] = obj['optionC'] || '';
      flatObj['optionD'] = obj['optionD'] || '';
    }

    if (flatObj['question'] && !flatObj['questionText']) {
      flatObj['questionText'] = flatObj['question'];
    } else if (flatObj['questionText'] && !flatObj['question']) {
      flatObj['question'] = flatObj['questionText'];
    }

    if (flatObj['contentMasterId'] && !flatObj['contentId']) {
      flatObj['contentId'] = flatObj['contentMasterId'];
    } else if (flatObj['contentId'] && !flatObj['contentMasterId']) {
      flatObj['contentMasterId'] = flatObj['contentId'];
    }

    if (flatObj['authorId'] && !flatObj['author']) {
      flatObj['author'] = flatObj['authorId'];
    } else if (flatObj['author'] && !flatObj['authorId']) {
      flatObj['authorId'] = flatObj['author'];
    }

    if (flatObj['realLifeContext'] && !flatObj['realWorldContext']) {
      flatObj['realWorldContext'] = flatObj['realLifeContext'];
    } else if (flatObj['realWorldContext'] && !flatObj['realLifeContext']) {
      flatObj['realLifeContext'] = flatObj['realWorldContext'];
    }
  }

  if (schema.sheetName === 'QUESTIONS' && Array.isArray(obj['tags'])) {
    flatObj['tags'] = (obj['tags'] as string[]).join(', ');
  }

  if (schema.sheetName === 'PUBLISHING') {
    if (obj['youtube'] && typeof obj['youtube'] === 'object') {
      const yt = obj['youtube'] as Record<string, any>;
      flatObj['youtubeStatus'] = yt.status;
      flatObj['youtubeUrl'] = yt.videoUrl;
      flatObj['youtubePublishedAt'] = yt.publishedAt;
      flatObj['youtubeScheduledAt'] = yt.scheduledAt;
      flatObj['youtubeLastFailureReason'] = yt.lastFailureReason;
      flatObj['youtubeRetryCount'] = yt.retryCount;
      flatObj['youtubeFailedAt'] = yt.failedAt;
    }
    if (obj['instagram'] && typeof obj['instagram'] === 'object') {
      const ig = obj['instagram'] as Record<string, any>;
      flatObj['instagramStatus'] = ig.status;
      flatObj['instagramUrl'] = ig.postUrl;
      flatObj['instagramPublishedAt'] = ig.publishedAt;
      flatObj['instagramScheduledAt'] = ig.scheduledAt;
      flatObj['instagramLastFailureReason'] = ig.lastFailureReason;
      flatObj['instagramRetryCount'] = ig.retryCount;
      flatObj['instagramFailedAt'] = ig.failedAt;
    }
    if (obj['facebook'] && typeof obj['facebook'] === 'object') {
      const fb = obj['facebook'] as Record<string, any>;
      flatObj['facebookStatus'] = fb.status;
      flatObj['facebookUrl'] = fb.postUrl;
      flatObj['facebookPublishedAt'] = fb.publishedAt;
      flatObj['facebookScheduledAt'] = fb.scheduledAt;
      flatObj['facebookLastFailureReason'] = fb.lastFailureReason;
      flatObj['facebookRetryCount'] = fb.retryCount;
      flatObj['facebookFailedAt'] = fb.failedAt;
    }
  }

  // Create mapping from column name lower to ColumnDefinition
  const colByName = new Map<string, ColumnDefinition>();
  for (const col of schema.columns) {
    colByName.set(col.name.trim().toLowerCase(), col);
  }

  const rowValues: (string | number | boolean)[] = [];

  for (let i = 0; i < headers.length; i++) {
    const headerName = headers[i]?.trim().toLowerCase();
    const colDef = colByName.get(headerName);

    if (colDef) {
      const val = flatObj[colDef.propertyKey];
      rowValues.push(formatCellValue(val, colDef));
    } else {
      // Unrecognized column - preserve empty or existing
      rowValues.push('');
    }
  }

  return rowValues;
}

/**
 * Validates that required headers exist in the worksheet.
 */
export function validateWorksheetHeaders(
  actualHeaders: string[],
  schema: SheetSchemaContract
): { isValid: boolean; missingHeaders: string[] } {
  const normalizedActual = new Set(actualHeaders.map((h) => h.trim().toLowerCase()));
  const missingHeaders: string[] = [];

  for (const col of schema.columns) {
    if (col.required && !normalizedActual.has(col.name.trim().toLowerCase())) {
      missingHeaders.push(col.name);
    }
  }

  return {
    isValid: missingHeaders.length === 0,
    missingHeaders,
  };
}
