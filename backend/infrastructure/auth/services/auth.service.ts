import crypto from 'crypto';
import { usersRepository } from '../../../../database/firestore/repositories/users.repository';
import { auditService } from '../../audit/services/audit.service';
import { getAdminAuth, getAdminApp } from '../../../../database/firestore/adapter/admin';
import firebaseConfig from '../../../../firebase-applet-config.json';
import { User } from '../../../../shared';

export interface SessionPayload {
  userId: string;
  name: string;
  role: string;
  roles?: string[];
  sessionVersion?: number;
  sessionId?: string;
  issuedAt: number;
  expiresAt: number;
}

export type SafeUser = Omit<User, 'password_hash' | 'sessionVersion'>;

export class AuthService {
  private static instance: AuthService;
  private static allowLegacyAuthInTest = false;
  private testEmailSender: ((email: string) => Promise<{ sent: boolean; message: string; error?: string }>) | null = null;
  private readonly defaultTTLHours = 24;
  private revokedTokens: Map<string, number> = new Map();
  private revokedSessions: Map<string, number> = new Map();

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public static enableTestLegacyAuth(enabled: boolean): void {
    AuthService.allowLegacyAuthInTest = enabled;
  }

  public setTestEmailSender(sender: ((email: string) => Promise<{ sent: boolean; message: string; error?: string }>) | null): void {
    this.testEmailSender = sender;
  }

  private getSessionSecret(): string {
    const secret = process.env.SESSION_SECRET;
    if (process.env.NODE_ENV === 'production' && !secret) {
      throw new Error('SESSION_SECRET is strictly required in production environment.');
    }
    return secret || 'burra-pariksha-dev-session-secret-not-for-production';
  }

  public getFirebaseApiKey(): string {
    return (
      process.env.FIREBASE_API_KEY ||
      process.env.VITE_FIREBASE_API_KEY ||
      (firebaseConfig as any)?.apiKey ||
      ''
    );
  }

  /**
   * Acquires Google OAuth2 access token headers using Firebase Admin SDK credential.
   * Authorizes direct server-to-server calls to Identity Toolkit API (sendOobCode, resetPassword, signInWithPassword)
   * under service account authority, independent of client Web API key expiration status.
   */
  public async getGoogleAuthHeaders(): Promise<Record<string, string>> {
    // Fail fast in test or emulator environments without service account credentials
    if (
      process.env.PERSISTENCE_MODE === 'IN_MEMORY_TEST_ONLY' ||
      process.env.FIREBASE_AUTH_EMULATOR_HOST ||
      (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && !process.env.GOOGLE_APPLICATION_CREDENTIALS)
    ) {
      return {};
    }

    try {
      const app = getAdminApp();
      const cred = (app.options as any)?.credential;
      if (cred && typeof cred.getAccessToken === 'function') {
        const tokenObj = await cred.getAccessToken();
        if (tokenObj?.access_token) {
          const headers: Record<string, string> = {
            'Authorization': `Bearer ${tokenObj.access_token}`,
          };
          if (app.options.projectId) {
            headers['X-Goog-User-Project'] = app.options.projectId;
          }
          return headers;
        }
      }
    } catch {
      // In isolated in-memory unit tests or emulator mode, credential may not be initialized.
    }
    return {};
  }

  public getFirebaseAuthRestEndpoint(operation: string, hasBearerToken = false): string {
    const authEmulator = process.env.FIREBASE_AUTH_EMULATOR_HOST;
    const apiKey = this.getFirebaseApiKey();
    if (authEmulator) {
      return `http://${authEmulator}/identitytoolkit.googleapis.com/v1/accounts:${operation}?key=${apiKey || 'fake-api-key'}`;
    }
    if (hasBearerToken) {
      return `https://identitytoolkit.googleapis.com/v1/accounts:${operation}`;
    }
    return `https://identitytoolkit.googleapis.com/v1/accounts:${operation}?key=${apiKey}`;
  }

  /**
   * Hashes password using native Node.js crypto scrypt
   * Format: scrypt$v1$<salt_hex>$<derived_key_hex>
   */
  public async hashPassword(password: string): Promise<string> {
    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    return new Promise<string>((resolve, reject) => {
      crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
        if (err) return reject(err);
        resolve(`scrypt$v1$${salt}$${derivedKey.toString('hex')}`);
      });
    });
  }

  /**
   * Verifies password against stored scrypt hash with timing-safe comparison
   */
  public async verifyPassword(password: string, storedHash?: string): Promise<boolean> {
    if (!password || !storedHash || typeof storedHash !== 'string') {
      return false;
    }

    const parts = storedHash.split('$');
    if (parts.length !== 4 || parts[0] !== 'scrypt' || parts[1] !== 'v1') {
      return false;
    }

    const salt = parts[2];
    const originalKeyHex = parts[3];
    const originalKey = Buffer.from(originalKeyHex, 'hex');

    return new Promise<boolean>((resolve) => {
      crypto.scrypt(password, salt, originalKey.length, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
        if (err) return resolve(false);
        try {
          if (derivedKey.length !== originalKey.length) {
            return resolve(false);
          }
          const match = crypto.timingSafeEqual(derivedKey, originalKey);
          resolve(match);
        } catch {
          resolve(false);
        }
      });
    });
  }

  /**
   * Explicitly revokes a session by token string or sessionId
   */
  public revokeSession(tokenOrSessionId: string): void {
    if (!tokenOrSessionId || typeof tokenOrSessionId !== 'string') return;
    const now = Date.now();
    this.cleanExpiredRevocations();

    if (tokenOrSessionId.includes('.')) {
      const parts = tokenOrSessionId.split('.');
      if (parts.length === 2) {
        this.revokedTokens.set(parts[1], now);
        try {
          const decodedStr = Buffer.from(parts[0], 'base64url').toString('utf8');
          const payload = JSON.parse(decodedStr) as SessionPayload;
          if (payload.sessionId) {
            this.revokedSessions.set(payload.sessionId, now);
          }
        } catch {
          // ignore parsing error
        }
      }
    } else {
      this.revokedSessions.set(tokenOrSessionId, now);
    }
  }

  /**
   * Checks whether a session token or sessionId has been revoked
   */
  public isSessionRevoked(token: string, payload?: SessionPayload): boolean {
    if (!token) return true;
    const parts = token.split('.');
    if (parts.length === 2 && this.revokedTokens.has(parts[1])) {
      return true;
    }
    if (payload?.sessionId && this.revokedSessions.has(payload.sessionId)) {
      return true;
    }
    return false;
  }

  private cleanExpiredRevocations(): void {
    if (this.revokedTokens.size > 5000 || this.revokedSessions.size > 5000) {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      for (const [key, timestamp] of this.revokedTokens.entries()) {
        if (timestamp < cutoff) this.revokedTokens.delete(key);
      }
      for (const [key, timestamp] of this.revokedSessions.entries()) {
        if (timestamp < cutoff) this.revokedSessions.delete(key);
      }
    }
  }

  /**
   * Invalidates all existing sessions for a user by incrementing authoritative session version
   */
  public invalidateUserSessions(userId: string): number {
    return usersRepository.incrementSessionVersion(userId);
  }

  /**
   * Generates a signed stateless session token: base64url(payload).base64url(signature)
   */
  public generateSessionToken(payload: Omit<SessionPayload, 'issuedAt' | 'expiresAt'>, ttlHours = this.defaultTTLHours): string {
    const secret = this.getSessionSecret();
    const now = Math.floor(Date.now() / 1000);
    const sessionVersion =
      payload.sessionVersion !== undefined
        ? payload.sessionVersion
        : usersRepository.getUserSessionVersion(payload.userId);
    const sessionId = payload.sessionId || crypto.randomUUID();

    const fullPayload: SessionPayload = {
      ...payload,
      sessionVersion,
      sessionId,
      issuedAt: now,
      expiresAt: now + ttlHours * 3600,
    };

    const payloadBase64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payloadBase64)
      .digest('base64url');

    return `${payloadBase64}.${signature}`;
  }

  /**
   * Verifies and decodes a session token with cryptographic HMAC verification,
   * expiration checks, session revocation checking, and authoritative user revalidation.
   */
  public verifySessionToken(token: string): SessionPayload | null {
    if (!token || typeof token !== 'string') {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 2) {
      return null;
    }

    const [payloadBase64, signature] = parts;
    const secret = this.getSessionSecret();

    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payloadBase64)
        .digest('base64url');

      if (
        Buffer.byteLength(signature) !== Buffer.byteLength(expectedSignature) ||
        !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
      ) {
        return null;
      }

      const decodedStr = Buffer.from(payloadBase64, 'base64url').toString('utf8');
      const payload = JSON.parse(decodedStr) as SessionPayload;

      if (!payload.userId || !payload.role || !payload.expiresAt) {
        return null;
      }

      const now = Math.floor(Date.now() / 1000);
      if (payload.expiresAt < now) {
        return null;
      }

      // Check revocation registry (e.g. from logout)
      if (this.isSessionRevoked(token, payload)) {
        return null;
      }

      // Revalidate against authoritative user record
      const userState = usersRepository.getUserSessionState(payload.userId);
      if (userState) {
        // Account deactivation: is_active=false invalidates all sessions
        if (!userState.isActive) {
          return null;
        }

        // Session versioning: stale session version invalidates session
        const tokenVersion = payload.sessionVersion ?? 1;
        if (tokenVersion < userState.sessionVersion) {
          return null;
        }
      }

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Authenticates user against Firebase Authentication, resolves authoritative Firestore employee profile,
   * updates last_login_at, and creates or attaches Firebase ID token.
   */
  public async login(userId: string, password: string): Promise<{
    success: boolean;
    token?: string;
    user?: SafeUser;
    error?: string;
  }> {
    try {
      if (!userId || !password) {
        await auditService.log(
          userId || 'UNKNOWN',
          'Anonymous',
          'LOGIN_FAILURE',
          'SYSTEM',
          'AUTH',
          { reason: 'MISSING_CREDENTIALS' }
        );
        return { success: false, error: 'Invalid user credentials.' };
      }

      const trimmedIdentifier = userId.trim();
      let user: User | null = null;
      try {
        user = await usersRepository.findById(trimmedIdentifier);
      } catch {
        // Non-fatal if identifier is email and repository threw
      }
      if (!user) {
        try {
          user = await usersRepository.findByEmail(trimmedIdentifier);
        } catch {
          // Non-fatal
        }
      }

      if (!user) {
        await auditService.log(
          trimmedIdentifier,
          'Unknown User',
          'LOGIN_FAILURE',
          'SYSTEM',
          'AUTH',
          { reason: 'USER_NOT_FOUND' }
        );
        return { success: false, error: 'Invalid user credentials.' };
      }

      if (!user.isActive) {
        await auditService.log(
          user.id,
          user.name,
          'LOGIN_FAILURE',
          'SYSTEM',
          'AUTH',
          { reason: 'ACCOUNT_INACTIVE' }
        );
        return { success: false, error: 'Account is inactive. Please contact administrator.' };
      }

      // Primary Credential Authority: Firebase Authentication
      let firebaseToken: string | undefined = undefined;
      let authenticatedViaFirebase = false;

      const authHeaders = await this.getGoogleAuthHeaders();
      const hasBearerToken = Boolean(authHeaders['Authorization']);
      const apiKey = this.getFirebaseApiKey();
      const hasFirebaseApiKey = Boolean(apiKey && apiKey !== 'FIREBASE_WEB_API_KEY_REDACTED');

      if (hasBearerToken || hasFirebaseApiKey) {
        try {
          const endpoint = this.getFirebaseAuthRestEndpoint('signInWithPassword', hasBearerToken);
          const fbRes = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...authHeaders,
            },
            body: JSON.stringify({
              email: user.email,
              password,
              returnSecureToken: true,
            }),
          });

          const fbData: any = await fbRes.json();

          if (fbRes.ok && fbData.idToken) {
            // Verify token with Firebase Admin SDK to derive authoritative identity
            const decoded = await getAdminAuth().verifyIdToken(fbData.idToken);
            firebaseToken = fbData.idToken;
            authenticatedViaFirebase = true;

            // Safe UID linking: prevent UID collision and profile hijacking
            if (user.firebaseUid !== decoded.uid) {
              if (user.firebaseUid) {
                // Conflict: Firestore profile is already bound to a different Firebase UID!
                await auditService.log(
                  user.id,
                  user.name,
                  'LOGIN_FAILURE',
                  'SYSTEM',
                  'AUTH',
                  { reason: 'IDENTITY_MAPPING_CONFLICT', detail: 'Profile linked to different UID' }
                );
                return { success: false, error: 'Identity conflict: Account credentials mismatch.' };
              }

              // Check if another profile is already linked to this Firebase UID
              const existingWithUid = await usersRepository.findByFirebaseUid(decoded.uid);
              if (existingWithUid && existingWithUid.id !== user.id) {
                await auditService.log(
                  user.id,
                  user.name,
                  'LOGIN_FAILURE',
                  'SYSTEM',
                  'AUTH',
                  { reason: 'IDENTITY_COLLISION', detail: 'Firebase UID already bound to another profile' }
                );
                return { success: false, error: 'Identity conflict: Credentials already bound to another profile.' };
              }

              try {
                await usersRepository.update(user.id, { firebaseUid: decoded.uid } as any);
                user.firebaseUid = decoded.uid;
              } catch {
                return { success: false, error: 'Failed to persist verified identity binding.' };
              }
            }
          } else {
            const errorCode = fbData?.error?.message;
            if (errorCode === 'USER_DISABLED') {
              await auditService.log(
                user.id,
                user.name,
                'LOGIN_FAILURE',
                'SYSTEM',
                'AUTH',
                { reason: 'USER_DISABLED' }
              );
              return { success: false, error: 'Account is inactive. Please contact administrator.' };
            }

            // In production: FAIL CLOSED!
            // Legacy password_hash is ONLY permitted in isolated test runtime with explicit opt-in
            const isTestIsolated = process.env.NODE_ENV === 'test' && AuthService.allowLegacyAuthInTest === true;
            if (!isTestIsolated) {
              await auditService.log(
                user.id,
                user.name,
                'LOGIN_FAILURE',
                'SYSTEM',
                'AUTH',
                { reason: 'INVALID_CREDENTIALS', errorCode }
              );
              return { success: false, error: 'Invalid user credentials.' };
            }

            // Test-only legacy fallback
            if (user.password_hash) {
              const isHashValid = await this.verifyPassword(password, user.password_hash);
              if (!isHashValid) {
                await auditService.log(
                  user.id,
                  user.name,
                  'LOGIN_FAILURE',
                  'SYSTEM',
                  'AUTH',
                  { reason: 'INVALID_CREDENTIALS' }
                );
                return { success: false, error: 'Invalid user credentials.' };
              }
            } else {
              return { success: false, error: 'Invalid user credentials.' };
            }
          }
        } catch {
          // Network exception contacting Firebase
          const isTestIsolated = process.env.NODE_ENV === 'test' && AuthService.allowLegacyAuthInTest === true;
          if (!isTestIsolated) {
            return { success: false, error: 'Authentication service temporarily unavailable.' };
          }
        }
      }

      // If not authenticated via Firebase:
      if (!authenticatedViaFirebase) {
        // In production: FAIL CLOSED. No legacy fallback or default passwords allowed.
        const isTestIsolated = process.env.NODE_ENV === 'test' && AuthService.allowLegacyAuthInTest === true;
        if (!isTestIsolated) {
          return { success: false, error: 'Authentication service unavailable. Please check system configuration.' };
        }

        let isFallbackValid = false;
        if (user.password_hash) {
          isFallbackValid = await this.verifyPassword(password, user.password_hash);
        }

        if (!isFallbackValid) {
          await auditService.log(
            user.id,
            user.name,
            'LOGIN_FAILURE',
            'SYSTEM',
            'AUTH',
            { reason: 'INVALID_CREDENTIALS' }
          );
          return { success: false, error: 'Invalid user credentials.' };
        }
      }

      const nowIso = new Date().toISOString();
      try {
        await usersRepository.update(user.id, { last_login_at: nowIso } as any);
      } catch {
        // Non-blocking in mock/in-memory test isolation
      }

      const userRoles: string[] = [];
      if (Array.isArray(user.roles) && user.roles.length > 0) {
        user.roles.forEach((r) => r && userRoles.push(String(r).trim()));
      } else if (user.role) {
        String(user.role).split(',').forEach((r) => r.trim() && userRoles.push(r.trim()));
      }
      if (userRoles.length === 0) {
        userRoles.push(String(user.role || 'ADMIN'));
      }

      const currentVersion = user.sessionVersion ?? usersRepository.getUserSessionVersion(user.id);

      const sessionToken = this.generateSessionToken({
        userId: user.id,
        name: user.name,
        role: userRoles[0],
        roles: userRoles,
        sessionVersion: currentVersion,
        sessionId: crypto.randomUUID(),
      });

      const tokenToReturn = firebaseToken || sessionToken;

      await auditService.log(
        user.id,
        user.name,
        'LOGIN_SUCCESS',
        'SYSTEM',
        'AUTH',
        { role: user.role, roles: userRoles, provider: authenticatedViaFirebase ? 'FIREBASE_AUTH' : 'TEST_HASH' }
      );

      const safeUser: SafeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        roles: userRoles,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        firebaseUid: user.firebaseUid,
        last_login_at: nowIso,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return {
        success: true,
        token: tokenToReturn,
        user: safeUser,
      };
    } catch {
      return { success: false, error: 'Authentication service error.' };
    }
  }

  /**
   * Dispatches a real password setup / reset email to the user via Firebase Authentication.
   * Calls Firebase's accounts:sendOobCode REST endpoint with requestType: "PASSWORD_RESET",
   * which triggers Firebase's built-in email delivery to the recipient.
   */
  public async dispatchPasswordSetupEmail(
    email: string,
    continueUrl?: string
  ): Promise<{ sent: boolean; message: string; error?: string }> {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return { sent: false, message: 'Invalid email address provided.', error: 'INVALID_EMAIL' };
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check for test-injected email sender (for deterministic isolated unit tests)
    if (this.testEmailSender) {
      return this.testEmailSender(trimmedEmail);
    }

    const authHeaders = await this.getGoogleAuthHeaders();
    const hasBearerToken = Boolean(authHeaders['Authorization']);
    const apiKey = this.getFirebaseApiKey();
    const hasApiKey = Boolean(apiKey && apiKey !== 'FIREBASE_WEB_API_KEY_REDACTED');

    if (!hasBearerToken && !hasApiKey) {
      return {
        sent: false,
        message: 'Firebase credentials are not configured. Email delivery unavailable.',
        error: 'FIREBASE_AUTH_NOT_CONFIGURED',
      };
    }

    try {
      const endpoint = this.getFirebaseAuthRestEndpoint('sendOobCode', hasBearerToken);
      const requestBody: Record<string, any> = {
        requestType: 'PASSWORD_RESET',
        email: trimmedEmail,
      };
      if (continueUrl && typeof continueUrl === 'string') {
        requestBody.continueUrl = continueUrl;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(requestBody),
      });

      const data: any = await res.json();
      if (res.ok) {
        return {
          sent: true,
          message: `Password setup email dispatched to ${trimmedEmail} via Firebase Authentication.`,
        };
      }

      const errMsg = data?.error?.message || 'Firebase email service rejected request.';
      return {
        sent: false,
        message: `Firebase email dispatch failed: ${errMsg}`,
        error: errMsg,
      };
    } catch (err: any) {
      return {
        sent: false,
        message: `Network failure connecting to Firebase email service: ${err?.message}`,
        error: err?.message,
      };
    }
  }

  /**
   * Triggers a password reset link for the given email via Firebase Authentication.
   * Returns a neutral success message regardless of whether the email exists
   * to prevent account enumeration.
   */
  public async sendPasswordReset(email: string, continueUrl?: string): Promise<{ success: boolean; message: string }> {
    const neutralMessage = 'If an account exists for this email address, a password reset link will be sent.';
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return { success: true, message: neutralMessage };
    }

    const trimmedEmail = email.trim().toLowerCase();
    try {
      await this.dispatchPasswordSetupEmail(trimmedEmail, continueUrl);

      await auditService.log(
        'SYSTEM',
        'Security System',
        'PASSWORD_RESET_REQUESTED',
        'AUTH',
        'RECOVERY',
        { status: 'REQUEST_RECEIVED' }
      );
    } catch (err: any) {
      console.warn('[AUTH] Password reset request internal note:', err?.message);
    }

    return { success: true, message: neutralMessage };
  }

  /**
   * Verifies an action code (oobCode) with Firebase Authentication without changing the password.
   */
  public async verifyResetCode(oobCode: string): Promise<{ valid: boolean; email?: string; error?: string }> {
    if (!oobCode || typeof oobCode !== 'string') {
      return { valid: false, error: 'Invalid or missing action code.' };
    }

    const authHeaders = await this.getGoogleAuthHeaders();
    const hasBearerToken = Boolean(authHeaders['Authorization']);
    const apiKey = this.getFirebaseApiKey();
    const hasApiKey = Boolean(apiKey && apiKey !== 'FIREBASE_WEB_API_KEY_REDACTED');

    if (!hasBearerToken && !hasApiKey) {
      if (process.env.NODE_ENV === 'test') {
        return { valid: true }; // Allow in test isolated environment
      }
      return { valid: false, error: 'Password reset service configuration unavailable.' };
    }

    try {
      const endpoint = this.getFirebaseAuthRestEndpoint('resetPassword', hasBearerToken);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ oobCode }),
      });

      const data: any = await res.json();
      if (res.ok && data.email) {
        return { valid: true, email: data.email };
      }

      const errMsg = data?.error?.message;
      if (errMsg === 'EXPIRED_OOB_CODE') {
        return { valid: false, error: 'The password reset link has expired. Please request a new link.' };
      }
      return { valid: false, error: 'The password reset link is invalid or has already been used.' };
    } catch {
      return { valid: false, error: 'Failed to verify action code.' };
    }
  }

  /**
   * Confirms a password reset with Firebase Authentication using the action code (oobCode).
   */
  public async resetPasswordWithCode(
    oobCode: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!oobCode || typeof oobCode !== 'string') {
      return { success: false, error: 'Invalid or missing password reset code.' };
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters long.' };
    }

    const authHeaders = await this.getGoogleAuthHeaders();
    const hasBearerToken = Boolean(authHeaders['Authorization']);
    const apiKey = this.getFirebaseApiKey();
    const hasApiKey = Boolean(apiKey && apiKey !== 'FIREBASE_WEB_API_KEY_REDACTED');
    let email: string | undefined = undefined;

    if (hasBearerToken || hasApiKey) {
      try {
        const endpoint = this.getFirebaseAuthRestEndpoint('resetPassword', hasBearerToken);
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify({ oobCode, newPassword }),
        });

        const data: any = await res.json();
        if (!res.ok) {
          const errMsg = data?.error?.message;
          if (errMsg === 'EXPIRED_OOB_CODE') {
            return { success: false, error: 'The password reset link has expired. Please request a new link.' };
          }
          return { success: false, error: 'The password reset link is invalid or has already been used.' };
        }
        email = data.email;
      } catch {
        return { success: false, error: 'Password reset service is temporarily unavailable.' };
      }
    }

    // Invalidate existing sessions in Firestore for this user and synchronize scrypt password hash
    if (email) {
      const user = await usersRepository.findByEmail(email);
      if (user) {
        const newHash = await this.hashPassword(newPassword);
        const nextSessionVersion = (user.sessionVersion || 1) + 1;
        await usersRepository.updateRecord(user.id, {
          password_hash: newHash,
          sessionVersion: nextSessionVersion,
          updatedAt: new Date().toISOString(),
        });
        await usersRepository.incrementSessionVersionPersistent(user.id);
        await auditService.log(
          user.id,
          user.name,
          'PASSWORD_RESET_SUCCESS',
          'USER',
          user.id,
          { status: 'SUCCESS' }
        );
      }
    }

    return {
      success: true,
      message: 'Password has been reset successfully. You may now sign in with your new password.',
    };
  }

  /**
   * Logs out user session, revokes the current session token if provided,
   * increments persistent session_version to invalidate all issued sessions, and records audit log
   */
  public async logout(actorId?: string, actorName?: string, token?: string): Promise<{ success: boolean }> {
    if (token) {
      this.revokeSession(token);
    }
    if (actorId) {
      // Invalidate persistent session version in Cloud Firestore (restart-safe)
      await usersRepository.incrementSessionVersionPersistent(actorId);
    }
    if (actorId && actorName) {
      await auditService.log(
        actorId,
        actorName,
        'LOGOUT',
        'SYSTEM',
        'AUTH',
        { status: 'SUCCESS' }
      );
    }
    return { success: true };
  }

  /**
   * Safely changes a user password:
   * - Verifies current password against stored scrypt hash
   * - Enforces password policy
   * - Hashes new password with scrypt
   * - Persists new hash to Firestore
   * - Revokes existing session and issues fresh session token
   * - Records audit trail
   */
  public async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    currentToken?: string
  ): Promise<{ success: boolean; error?: string; token?: string }> {
    try {
      if (!userId) {
        return { success: false, error: 'User identifier is required.' };
      }
      if (!currentPassword) {
        return { success: false, error: 'Current password is required.' };
      }
      if (!newPassword) {
        return { success: false, error: 'New password is required.' };
      }
      if (newPassword.length < 8) {
        return { success: false, error: 'New password must be at least 8 characters long.' };
      }
      if (newPassword === currentPassword) {
        return { success: false, error: 'New password cannot be the same as current password.' };
      }

      const user = await usersRepository.findById(userId);
      if (!user || !user.isActive) {
        return { success: false, error: 'User account not found or inactive.' };
      }

      // Verify current password against stored scrypt hash or bootstrap password
      let isCurrentValid = false;
      if (user.password_hash) {
        isCurrentValid = await this.verifyPassword(currentPassword, user.password_hash);
      } else {
        const bootstrapPassword = process.env.INITIAL_ADMIN_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD;
        if (bootstrapPassword) {
          isCurrentValid = (currentPassword === bootstrapPassword);
        }
      }

      if (!isCurrentValid) {
        await auditService.log(
          user.id,
          user.name,
          'PASSWORD_CHANGE_FAILURE',
          'USER',
          user.id,
          { reason: 'INVALID_CURRENT_PASSWORD' }
        );
        return { success: false, error: 'Current password is incorrect.' };
      }

      // Hash the new password using native Node crypto scrypt
      const newHash = await this.hashPassword(newPassword);

      // Increment authoritative session version to revoke any other active sessions
      const nextSessionVersion = (user.sessionVersion || 1) + 1;

      // Persist the new password hash into Firestore
      await usersRepository.updateRecord(user.id, {
        password_hash: newHash,
        sessionVersion: nextSessionVersion,
        updatedAt: new Date().toISOString(),
      });

      // Revoke the old token in memory
      if (currentToken) {
        this.revokeSession(currentToken);
      }

      // Update in-memory session version for user
      usersRepository.setUserSessionState(user.id, {
        userId: user.id,
        role: user.role,
        roles: Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [user.role],
        isActive: true,
        sessionVersion: nextSessionVersion,
      });

      // Generate a fresh session token with updated sessionVersion
      const userRoles = Array.isArray(user.roles) && user.roles.length > 0
        ? user.roles
        : [user.role || 'ADMIN'];

      const freshToken = this.generateSessionToken({
        userId: user.id,
        name: user.name,
        role: userRoles[0],
        roles: userRoles,
        sessionVersion: nextSessionVersion,
        sessionId: crypto.randomUUID(),
      });

      await auditService.log(
        user.id,
        user.name,
        'PASSWORD_CHANGE_SUCCESS',
        'USER',
        user.id,
        { status: 'SUCCESS' }
      );

      return {
        success: true,
        token: freshToken,
      };
    } catch {
      return { success: false, error: 'Password change service error.' };
    }
  }
}

export const authService = AuthService.getInstance();
