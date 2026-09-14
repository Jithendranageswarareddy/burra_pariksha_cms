/**
 * BURRA PARIKSHA CMS - Audit Log & Users Repositories
 * Phase 2: Google Sheets Database Architecture & Persistence
 */

import { BaseRepository } from './base.repository';
import { SHEET_SCHEMAS, SHEET_TABS } from '../schemas/google-sheets-schema';
import { AuditLog, User, UserRole } from '../../types';

export class AuditLogRepository extends BaseRepository<AuditLog> {
  private static instance: AuditLogRepository | null = null;
  private static sequenceCounter = 0;

  private constructor() {
    super(SHEET_SCHEMAS[SHEET_TABS.AUDIT_LOG]);
  }

  public static getInstance(): AuditLogRepository {
    if (!AuditLogRepository.instance) {
      AuditLogRepository.instance = new AuditLogRepository();
    }
    return AuditLogRepository.instance;
  }

  private sanitizeDetails(data?: Record<string, unknown>): string {
    if (!data) return '';
    try {
      const sanitized: Record<string, unknown> = {};
      const SENSITIVE_KEYS = /key|secret|token|password|credential|privatekey/i;

      for (const [key, value] of Object.entries(data)) {
        if (SENSITIVE_KEYS.test(key)) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = value;
        }
      }
      return JSON.stringify(sanitized);
    } catch {
      return '';
    }
  }

  public async logAction(
    actorId: string,
    actorName: string,
    action: string,
    entityType: string,
    entityId: string,
    changes?: Record<string, unknown>
  ): Promise<AuditLog> {
    const timestamp = new Date().toISOString();
    AuditLogRepository.sequenceCounter += 1;
    const seq = String(AuditLogRepository.sequenceCounter).padStart(5, '0');
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const id = `LOG-${Date.now()}-${seq}-${randomSuffix}-${entityId}`;
    const record: AuditLog = {
      id,
      timestamp,
      actorId,
      actorName,
      action,
      entityType,
      entityId,
      details: this.sanitizeDetails(changes),
    };

    return this.appendRecord(record);
  }

  public async findByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    const all = await this.findAll();
    return all.filter((l) => l.entityType === entityType && l.entityId === entityId);
  }
}

export class UsersRepository extends BaseRepository<User> {
  private static instance: UsersRepository | null = null;

  private constructor() {
    super(SHEET_SCHEMAS[SHEET_TABS.USERS]);
    if (!this.client.isConfigured(this.getTargetSpreadsheetId())) {
      const now = new Date().toISOString();
      const defaultUsers: User[] = [
        {
          id: 'USR-001',
          name: 'Jithendra',
          email: 'jithendrareddy629@gmail.com',
          role: UserRole.ADMIN,
          roles: [UserRole.ADMIN],
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'USR-002',
          name: 'Surendra Reddy',
          email: 'seelamsurendrareddy999@gmail.com',
          role: UserRole.VIDEO_EDITOR,
          roles: [UserRole.VIDEO_EDITOR],
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      ];
      this.seedFallbackData(defaultUsers);
    }
  }

  public static getInstance(): UsersRepository {
    if (!UsersRepository.instance) {
      UsersRepository.instance = new UsersRepository();
    }
    return UsersRepository.instance;
  }

  public async findByEmail(email: string): Promise<User | null> {
    const all = await this.findAll();
    return all.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }
}

export const auditLogRepository = AuditLogRepository.getInstance();
export const usersRepository = UsersRepository.getInstance();
