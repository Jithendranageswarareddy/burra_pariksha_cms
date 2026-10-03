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

  public incrementSessionVersion(userId: string): number {
    const next = this.getUserSessionVersion(userId) + 1;
    this.userSessionVersions.set(userId, next);
    const existing = this.getUserSessionState(userId);
    if (existing) {
      existing.sessionVersion = next;
      this.userSessionStates.set(userId, existing);
    }
    return next;
  }

  public async incrementSessionVersionPersistent(userId: string): Promise<number> {
    const user = await this.findById(userId);
    const currentVersion = user?.sessionVersion ?? this.getUserSessionVersion(userId);
    const nextVersion = currentVersion + 1;
    this.userSessionVersions.set(userId, nextVersion);
    await this.updateRecord(userId, { sessionVersion: nextVersion });
    return nextVersion;
  }

  public invalidateUserSessions(userId: string): number {
    return this.incrementSessionVersion(userId);
  }

  public async invalidateUserSessionsPersistent(userId: string): Promise<number> {
    return this.incrementSessionVersionPersistent(userId);
  }

  public setUserSessionState(userId: string, state: Partial<UserSessionState>): void {
    const current = this.getUserSessionState(userId) || {
      sessionVersion: this.getUserSessionVersion(userId),
      isActive: true,
      role: '',
      roles: [],
    };
    const updated: UserSessionState = {
      ...current,
      ...state,
    };
    if (state.sessionVersion !== undefined) {
      this.userSessionVersions.set(userId, state.sessionVersion);
    }
    this.userSessionStates.set(userId, updated);
  }

  public getUserSessionState(userId: string): UserSessionState | null {
    return this.userSessionStates.get(userId) || null;
  }

  public async getAuthoritativeUserSessionState(userId: string): Promise<UserSessionState | null> {
    if (!this.userSessionStates.has(userId)) {
      const user = await this.findById(userId);
      if (!user) return null;
      return this.userSessionStates.get(userId) || null;
    }
    return this.userSessionStates.get(userId) || null;
  }

  public override async appendRecord(record: User): Promise<User> {
    const result = await super.appendRecord(record);
    const version = record.sessionVersion ?? 1;
    this.userSessionVersions.set(record.id, version);
    const rolesList: string[] = [];
    if (Array.isArray(record.roles)) {
      rolesList.push(...record.roles.map((r) => String(r).trim()));
    } else if (record.role) {
      rolesList.push(String(record.role).trim());
    }
    this.setUserSessionState(record.id, {
      sessionVersion: version,
      isActive: record.isActive !== false,
      role: String(record.role || rolesList[0] || ''),
      roles: rolesList,
    });
    return result;
  }

  public override async updateRecord(id: string, updates: Partial<User>): Promise<User | null> {
    const existing = await this.findById(id);
    let shouldInvalidate = false;

    if (existing) {
      // 1. Role changed (downgraded, upgraded, or altered)
      if (updates.role !== undefined && String(updates.role).trim() !== String(existing.role).trim()) {
        shouldInvalidate = true;
      }
      // 2. Roles array changed
      if (updates.roles !== undefined) {
        const existingRoles = (Array.isArray(existing.roles) ? existing.roles : [existing.role || ''])
          .map((r) => String(r).trim())
          .filter(Boolean)
          .sort()
          .join(',');
        const newRoles = updates.roles
          .map((r) => String(r).trim())
          .filter(Boolean)
          .sort()
          .join(',');
        if (existingRoles !== newRoles) {
          shouldInvalidate = true;
        }
      }
      // 3. Deactivated (is_active=false)
      if (updates.isActive !== undefined && updates.isActive === false && existing.isActive !== false) {
        shouldInvalidate = true;
      }
      // 4. Reactivated (invalidates sessions issued prior to deactivation)
      if (updates.isActive !== undefined && updates.isActive === true && existing.isActive === false) {
        shouldInvalidate = true;
      }
      // 5. Explicit session version increment
      if (updates.sessionVersion !== undefined) {
        const currentVersion = this.getUserSessionVersion(id);
        if (updates.sessionVersion > currentVersion) {
          shouldInvalidate = true;
        }
      }
    }

    if (shouldInvalidate) {
      const currentVersion = existing?.sessionVersion ?? this.getUserSessionVersion(id);
      const nextVersion = currentVersion + 1;
      this.userSessionVersions.set(id, nextVersion);
      updates.sessionVersion = nextVersion;
    }

    const updated = await super.updateRecord(id, updates);

    if (updated) {
      const version = updated.sessionVersion ?? this.getUserSessionVersion(id);
      this.userSessionVersions.set(id, version);
      const rolesList: string[] = [];
      if (Array.isArray(updated.roles)) {
        rolesList.push(...updated.roles.map((r) => String(r).trim()));
      } else if (updated.role) {
        rolesList.push(String(updated.role).trim());
      }
      this.setUserSessionState(id, {
        sessionVersion: version,
        isActive: updated.isActive !== false,
        role: updated.role,
        roles: rolesList,
      });
    }

    return updated;
  }

  public override async findById(id: string): Promise<User | null> {
    const user = await super.findById(id);
    if (user) {
      if (user.role && typeof user.role === 'string' && user.role.includes(',')) {
        const parts = user.role.split(',').map((r) => r.trim()).filter(Boolean);
        user.role = parts[0];
        if (!user.roles || user.roles.length === 0) {
          user.roles = parts;
        }
      }
      const version = user.sessionVersion ?? this.userSessionVersions.get(user.id) ?? 1;
      this.userSessionVersions.set(user.id, version);
      const rolesList: string[] = [];
      if (Array.isArray(user.roles)) {
        rolesList.push(...user.roles.map((r) => String(r).trim()));
      } else if (user.role) {
        rolesList.push(String(user.role).trim());
      }
      this.setUserSessionState(user.id, {
        sessionVersion: version,
        isActive: user.isActive !== false,
        role: String(user.role || rolesList[0] || ''),
        roles: rolesList,
      });
    }
    return user;
  }

  public override async findAll(): Promise<User[]> {
    const users = await super.findAll();
    for (const user of users) {
      if (user.role && typeof user.role === 'string' && user.role.includes(',')) {
        const parts = user.role.split(',').map((r) => r.trim()).filter(Boolean);
        user.role = parts[0];
        if (!user.roles || user.roles.length === 0) {
          user.roles = parts;
        }
      }
      const version = user.sessionVersion ?? this.userSessionVersions.get(user.id) ?? 1;
      this.userSessionVersions.set(user.id, version);
      const rolesList: string[] = [];
      if (Array.isArray(user.roles)) {
        rolesList.push(...user.roles.map((r) => String(r).trim()));
      } else if (user.role) {
        rolesList.push(String(user.role).trim());
      }
      this.setUserSessionState(user.id, {
        sessionVersion: version,
        isActive: user.isActive !== false,
        role: String(user.role || rolesList[0] || ''),
        roles: rolesList,
      });
    }
    return users;
  }

  public async findByEmail(email: string): Promise<User | null> {
    const all = await this.findAll();
    return all.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }
}

export const auditLogRepository = AuditLogRepository.getInstance();
export const usersRepository = UsersRepository.getInstance();
