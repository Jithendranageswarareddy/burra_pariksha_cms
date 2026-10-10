/**
 * BURRA PARIKSHA CMS — Audit Log & Users Repository
 * Authoritative Firestore persistence
 */

import { BaseRepository } from './base.repository';
import { AuditLog, User } from '../../types';

export class AuditLogRepository extends BaseRepository<AuditLog> {
  private static instance: AuditLogRepository | null = null;

  private constructor() {
    super('audit_logs', 'AUD-');
  }

  public static getInstance(): AuditLogRepository {
    if (!AuditLogRepository.instance) {
      AuditLogRepository.instance = new AuditLogRepository();
    }
    return AuditLogRepository.instance;
  }

  public async findByEntity(entityTypeOrId: string, entityId?: string): Promise<AuditLog[]> {
    const all = await this.findAll();
    if (entityId) {
      return all.filter((l) => (l.entityType === entityTypeOrId && l.entityId === entityId) || l.entityId === entityId);
    }
    return all.filter((l) => l.entityId === entityTypeOrId || l.entityType === entityTypeOrId);
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
    arg1: string,
    arg2: string,
    arg3: string,
    arg4: string,
    arg5?: string | Record<string, any>,
    arg6?: string | Record<string, any>
  ): Promise<AuditLog> {
    let action: string;
    let entityId: string;
    let actorId: string;
    let actorName: string;
    let details: string | Record<string, any> | undefined;

    if (arg6 !== undefined || arguments.length >= 6) {
      // Style: (actorId, actorName, action, entityType, entityId, details)
      actorId = arg1;
      actorName = arg2;
      action = arg3;
      entityId = (arg5 as string) || '';
      details = arg6;
    } else {
      // Style: (action, entityType, entityId, userId, details)
      action = arg1;
      entityId = arg3;
      actorId = arg4;
      actorName = arg4;
      details = arg5;
    }

    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : String(details || '');
    return this.logEvent(action, entityId, actorId, actorName, detailsStr, 1);
  }
}

export interface UserSessionState {
  userId?: string;
  sessionVersion: number;
  isActive: boolean;
  role: string;
  roles?: string[];
  dataScope?: string;
  updatedAt?: string;
}

export class UsersRepository extends BaseRepository<User> {
  private static instance: UsersRepository | null = null;
  private userSessionVersions: Map<string, number> = new Map();
  private userSessionStates: Map<string, UserSessionState> = new Map();

  private constructor() {
    super('users', 'USR-');
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

  public async getAuthoritativeUserSessionState(userId: string): Promise<UserSessionState | null> {
    const cached = this.userSessionStates.get(userId);
    if (cached) return cached;
    const user = await this.findById(userId);
    if (!user) return null;
    const state: UserSessionState = {
      userId: user.id,
      sessionVersion: user.sessionVersion || 1,
      role: user.role,
      roles: user.roles || [user.role],
      isActive: user.isActive !== false,
      dataScope: user.dataScope,
      updatedAt: user.updatedAt || new Date().toISOString(),
    };
    this.userSessionStates.set(userId, state);
    this.userSessionVersions.set(userId, state.sessionVersion);
    return state;
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

  public incrementSessionVersion(userId: string): number {
    const current = this.getUserSessionVersion(userId);
    const next = current + 1;
    this.userSessionVersions.set(userId, next);
    const state = this.userSessionStates.get(userId);
    if (state) state.sessionVersion = next;
    return next;
  }

  public async incrementSessionVersionPersistent(userId: string): Promise<number> {
    return this.incrementUserSessionVersion(userId);
  }

  public async findByEmail(email: string): Promise<User | null> {
    const all = await this.findAll();
    return all.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }
}

export const auditLogRepository = AuditLogRepository.getInstance();
export const usersRepository = UsersRepository.getInstance();
