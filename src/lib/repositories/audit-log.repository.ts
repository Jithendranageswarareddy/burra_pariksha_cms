/**
 * BURRA PARIKSHA CMS — Audit Log & Users Repository
 * Sprint 4: Production Data Layer Migration (Google Sheets to Cloud Firestore)
 */

import { BaseRepository } from './base.repository';
import { SHEET_SCHEMAS, SHEET_TABS } from '../schemas/google-sheets-schema';
import { AuditLog, User } from '../../types';

export class AuditLogRepository extends BaseRepository<AuditLog> {
  private static instance: AuditLogRepository | null = null;

  private constructor() {
    super(SHEET_SCHEMAS[SHEET_TABS.AUDIT_LOG]);
  }

  public static getInstance(): AuditLogRepository {
    if (!AuditLogRepository.instance) {
      AuditLogRepository.instance = new AuditLogRepository();
    }
    return AuditLogRepository.instance;
  }

  public async findByEntity(entityId: string): Promise<AuditLog[]> {
    const all = await this.findAll();
    return all.filter((l) => l.entityId === entityId);
  }

  public async logEvent(
    eventType: string,
    entityId: string,
    actorId: string,
    actorName: string,
    details?: string,
    stageNumber?: number
  ): Promise<AuditLog> {
    const id = `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const log: Partial<AuditLog> = {
      id,
      timestamp: new Date().toISOString(),
      eventType,
      entityId,
      actorId: actorId || 'SYSTEM',
      actorName: actorName || 'System',
      details: details || '',
      stageNumber: stageNumber || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      isDeleted: false,
    };
    return this.appendRecord(log as AuditLog);
  }

  public async logAction(
    action: string,
    entityType: string,
    entityId: string,
    userId: string,
    details?: string | Record<string, any>
  ): Promise<AuditLog> {
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : String(details || '');
    return this.logEvent(action, entityId, userId, userId, detailsStr, 1);
  }
}

export interface UserSessionState {
  sessionVersion: number;
  isActive: boolean;
  role: string;
  roles: string[];
}

export class UsersRepository extends BaseRepository<User> {
  private static instance: UsersRepository | null = null;
  private userSessionVersions: Map<string, number> = new Map();
  private userSessionStates: Map<string, UserSessionState> = new Map();

  private constructor() {
    super(SHEET_SCHEMAS[SHEET_TABS.USERS]);
  }

  public static getInstance(): UsersRepository {
    if (!UsersRepository.instance) {
      UsersRepository.instance = new UsersRepository();
    }
    return UsersRepository.instance;
  }

  public getUserSessionVersion(userId: string): number {
    return this.userSessionVersions.get(userId) ?? 1;
  }

  public getUserSessionState(userId: string): UserSessionState | null {
    return this.userSessionStates.get(userId) || null;
  }

  public setUserSessionState(userId: string, state: UserSessionState): void {
    this.userSessionStates.set(userId, state);
    this.userSessionVersions.set(userId, state.sessionVersion);
  }

  public async incrementUserSessionVersion(userId: string): Promise<number> {
    const user = await this.findById(userId);
    const currentVersion = user?.sessionVersion ?? this.userSessionVersions.get(userId) ?? 1;
    const nextVersion = currentVersion + 1;
    this.userSessionVersions.set(userId, nextVersion);

    if (user) {
      user.sessionVersion = nextVersion;
      await this.updateRecord(userId, { sessionVersion: nextVersion } as any);
    }
    return nextVersion;
  }

  public async findByEmail(email: string): Promise<User | null> {
    const all = await this.findAll();
    return all.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }
}

export const auditLogRepository = AuditLogRepository.getInstance();
export const usersRepository = UsersRepository.getInstance();
