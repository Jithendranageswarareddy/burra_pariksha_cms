import { Request, Response, NextFunction } from 'express';
import { authService } from '../../lib/services/auth.service';
import { usersRepository, UserSessionState } from '../../lib/repositories/users.repository';
import { UserRole } from '../../types';
import { createErrorResponse, ApiErrorCode } from '../../types/api-contracts';
import {
  evaluateAuthorization,
  AuthorizationActor,
  AuthorizationErrorCode,
  TargetResourceContext,
} from '../../lib/auth/rbac-evaluator';
import {
  CapabilityString,
  parseCapability,
  resolveBrownfieldRole,
  CanonicalRbacRole,
} from '../../types/rbac-models';

export interface AuthUserContext {
  id: string;
  name: string;
  role: string;
  roles?: string[];
  isAiAgent?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserContext;
}

/**
 * Extracts session token strictly from cookies or Authorization header
 */
export function extractSessionToken(req: Request): string | null {
  const cookieHeader = req.headers.cookie || '';
  if (cookieHeader) {
    const cookieToken = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('bp_session='))
      ?.split('=')[1];
    if (cookieToken) {
      return cookieToken;
    }
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  return null;
}

/**
 * Middleware: requireAuth
 * Validates bp_session token and attaches payload to req.user (id, name, role only)
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = extractSessionToken(req);
  const requestId = (req.headers['x-request-id'] as string) || `req_${Date.now()}`;

  if (!token) {
    const errEnvelope = createErrorResponse(
      ApiErrorCode.UNAUTHENTICATED,
      'Authentication required. No session provided.',
      requestId
    );
    res.status(401).json({
      ...errEnvelope,
      message: 'Authentication required. No session provided.',
    });
    return;
  }

  const payload = authService.verifySessionToken(token);
  if (!payload) {
    const errEnvelope = createErrorResponse(
      ApiErrorCode.UNAUTHENTICATED,
      'Invalid or expired session.',
      requestId
    );
    res.status(401).json({
      ...errEnvelope,
      message: 'Invalid or expired session.',
    });
    return;
  }

  const completeAuth = (userState: UserSessionState | null) => {
    if (userState) {
      if (!userState.isActive) {
        const errEnvelope = createErrorResponse(
          ApiErrorCode.UNAUTHENTICATED,
          'Invalid or expired session.',
          requestId
        );
        res.status(401).json({
          ...errEnvelope,
          message: 'Invalid or expired session.',
        });
        return;
      }

      // Persistent session version check: token version must match or exceed current persistent session version
      const tokenVersion = payload.sessionVersion ?? 1;
      if (tokenVersion < userState.sessionVersion) {
        const errEnvelope = createErrorResponse(
          ApiErrorCode.UNAUTHENTICATED,
          'Invalid or expired session.',
          requestId
        );
        res.status(401).json({
          ...errEnvelope,
          message: 'Invalid or expired session.',
        });
        return;
      }
    }

    const rolesList: string[] = [];
    if (Array.isArray((payload as any).roles)) {
      (payload as any).roles.forEach((r: any) => r && rolesList.push(String(r).trim()));
    }
    if (rolesList.length === 0 && payload.role) {
      String(payload.role).split(',').forEach((r) => r.trim() && rolesList.push(r.trim()));
    }

    const authoritativeRoles = userState?.roles && userState.roles.length > 0 ? userState.roles : rolesList;
    const authoritativeRole = userState?.role || payload.role || authoritativeRoles[0] || UserRole.ADMIN;

    req.user = {
      id: payload.userId,
      name: payload.name,
      role: authoritativeRole,
      roles: authoritativeRoles.length > 0 ? authoritativeRoles : [authoritativeRole],
      isAiAgent: Boolean(
        (payload as any).isAiAgent ||
        payload.userId.startsWith('AI-') ||
        payload.userId.startsWith('AGENT-') ||
        payload.role === 'AI_AGENT' ||
        payload.role === 'AI_BOT'
      ),
    };
    next();
  };

  const cachedState = usersRepository.getUserSessionState(payload.userId);
  if (cachedState) {
    completeAuth(cachedState);
    return;
  }

  // When cache is cold (e.g. after server restart), fetch authoritative state from persistent repository
  usersRepository.getAuthoritativeUserSessionState(payload.userId).then((authoritativeState) => {
    completeAuth(authoritativeState);
  }).catch(() => {
    const errEnvelope = createErrorResponse(
      ApiErrorCode.UNAUTHENTICATED,
      'Invalid or expired session.',
      requestId
    );
    res.status(401).json({
      ...errEnvelope,
      error: 'Invalid or expired session.',
      message: 'Invalid or expired session.',
    });
  });
}

/**
 * Middleware: requireRole
 * Validates that authenticated user has one of the allowed roles
 */
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const requestId = (req.headers['x-request-id'] as string) || `req_${Date.now()}`;
    if (!req.user) {
      const errEnvelope = createErrorResponse(
        ApiErrorCode.UNAUTHENTICATED,
        'Authentication required.',
        requestId
      );
      res.status(401).json({
        ...errEnvelope,
        message: 'Authentication required.',
      });
      return;
    }

    const userRoles: string[] = [];
    if (Array.isArray(req.user.roles) && req.user.roles.length > 0) {
      req.user.roles.forEach((r) => r && userRoles.push(String(r).trim()));
    }
    if (req.user.role) {
      String(req.user.role).split(',').forEach((r) => r.trim() && !userRoles.includes(r.trim()) && userRoles.push(r.trim()));
    }

    const canonicalUserRoles = userRoles.map((r) => resolveBrownfieldRole(r));
    const canonicalAllowed = allowedRoles.map((r) => resolveBrownfieldRole(r));

    // ADMIN global authority bypass
    const isAdmin = canonicalUserRoles.includes(CanonicalRbacRole.ADMIN) || userRoles.includes(UserRole.ADMIN) || userRoles.includes('ADMIN');
    const isAllowed = isAdmin || canonicalUserRoles.some((r) => canonicalAllowed.includes(r)) || userRoles.some((r) => allowedRoles.includes(r));

    if (!isAllowed) {
      const errEnvelope = createErrorResponse(
        ApiErrorCode.FORBIDDEN_LACKS_CAPABILITY,
        'Forbidden: Insufficient role permissions.',
        requestId
      );
      res.status(403).json({
        ...errEnvelope,
        message: 'Forbidden: Insufficient role permissions.',
      });
      return;
    }

    next();
  };
}

export type ResourceContextResolver = (
  req: AuthenticatedRequest
) => Promise<TargetResourceContext | undefined> | TargetResourceContext | undefined;

/**
 * Middleware: requireCapability
 * Stage 26 Feature Contract: FC-002 (Roles & Capability Authorization Matrix)
 *
 * Implements authoritative capability enforcement pipeline:
 * Authenticated User -> Active Role(s) -> Capability -> Resource -> Action ->
 * Resource/Ownership Check -> GAR-02 -> Authorization Decision.
 */
export function requireCapability(
  capability: CapabilityString | string,
  resourceResolver?: ResourceContextResolver
) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const requestId = (req.headers['x-request-id'] as string) || `req_${Date.now()}`;

    // 1. Require Authenticated Actor Context (AP-004)
    if (!req.user) {
      const token = extractSessionToken(req);
      if (!token) {
        const errEnvelope = createErrorResponse(
          ApiErrorCode.UNAUTHENTICATED,
          'Authentication required: No session provided.',
          requestId
        );
        res.status(401).json({
          ...errEnvelope,
          message: 'Authentication required: No session provided.',
        });
        return;
      }

      const payload = authService.verifySessionToken(token);
      if (!payload) {
        const errEnvelope = createErrorResponse(
          ApiErrorCode.UNAUTHENTICATED,
          'Invalid or expired session.',
          requestId
        );
        res.status(401).json({
          ...errEnvelope,
          message: 'Invalid or expired session.',
        });
        return;
      }

      const userState = usersRepository.getUserSessionState(payload.userId);
      if (userState) {
        if (!userState.isActive || (payload.sessionVersion ?? 1) < userState.sessionVersion) {
          const errEnvelope = createErrorResponse(
            ApiErrorCode.UNAUTHENTICATED,
            'Invalid or expired session.',
            requestId
          );
          res.status(401).json({
            ...errEnvelope,
            message: 'Invalid or expired session.',
          });
          return;
        }
      }

      const rolesList: string[] = [];
      if (Array.isArray((payload as any).roles)) {
        (payload as any).roles.forEach((r: any) => r && rolesList.push(String(r).trim()));
      }
      if (rolesList.length === 0 && payload.role) {
        String(payload.role).split(',').forEach((r) => r.trim() && rolesList.push(r.trim()));
      }
      const authoritativeRoles = userState?.roles && userState.roles.length > 0 ? userState.roles : rolesList;
      const authoritativeRole = userState?.role || payload.role || authoritativeRoles[0] || 'QUESTION_AUTHOR';

      req.user = {
        id: payload.userId,
        name: payload.name,
        role: authoritativeRole,
        roles: authoritativeRoles.length > 0 ? authoritativeRoles : [authoritativeRole],
        isAiAgent: Boolean(
          (payload as any).isAiAgent ||
          payload.userId.startsWith('AI-') ||
          payload.userId.startsWith('AGENT-') ||
          payload.role === 'AI_AGENT' ||
          payload.role === 'AI_BOT'
        ),
      };
    }

    // 2. Authoritative Actor Identity (NEVER trust client body/query roles/actor)
    const user = req.user;
    const isAi = Boolean(
      user.isAiAgent ||
      (user as any).isAi ||
      user.id.startsWith('AI-') ||
      user.id.startsWith('AGENT-') ||
      user.role === 'AI_AGENT' ||
      user.role === 'AI_BOT'
    );

    const canonicalRole = resolveBrownfieldRole(user.role);
    const canonicalRoles = (user.roles || [user.role]).map((r) => resolveBrownfieldRole(r));

    const actor: AuthorizationActor = {
      id: user.id,
      role: canonicalRole,
      roles: canonicalRoles,
      isAiAgent: isAi,
    };

    // 3. Resolve Target Resource Context
    let targetContext: TargetResourceContext | undefined;
    if (resourceResolver) {
      try {
        targetContext = await resourceResolver(req);
      } catch (err: any) {
        const errEnvelope = createErrorResponse(
          ApiErrorCode.INTERNAL_SERVER_ERROR,
          `Failed to resolve target authorization resource: ${err?.message || 'Unknown error'}`,
          requestId
        );
        res.status(500).json({
          ...errEnvelope,
          message: `Failed to resolve target authorization resource: ${err?.message || 'Unknown error'}`,
        });
        return;
      }
    } else {
      const authorUserId = req.body?.authorUserId || req.body?.authorId || req.body?.createdBy || req.body?._authorId;
      const ownerUserId = req.body?.ownerUserId || req.body?.ownerId;
      const resourceId = req.params?.id || req.body?.id || req.body?.resourceId || req.body?.questionId || req.body?.videoId;
      const stageNumber = req.body?.stageNumber !== undefined ? Number(req.body.stageNumber) : undefined;
      const status = req.body?.status;

      if (authorUserId || ownerUserId || resourceId || stageNumber !== undefined || status) {
        targetContext = {
          authorUserId: authorUserId ? String(authorUserId).trim() : undefined,
          createdBy: authorUserId ? String(authorUserId).trim() : undefined,
          ownerUserId: ownerUserId ? String(ownerUserId).trim() : undefined,
          resourceId: resourceId ? String(resourceId).trim() : undefined,
          stageNumber: Number.isFinite(stageNumber) ? stageNumber : undefined,
          status: status ? String(status).trim() : undefined,
        };
      }
    }

    // Extract Administrative Override parameters if provided
    const overridePayload = req.body?.override;
    const isOverrideFlag = Boolean(req.body?.isOverride || overridePayload?.isOverride);
    if (isOverrideFlag) {
      if (!targetContext) targetContext = {};
      targetContext.override = {
        isOverride: true,
        confirmedByAdmin: Boolean(overridePayload?.confirmedByAdmin ?? req.body?.confirmedByAdmin ?? true),
        reason: String(overridePayload?.reason || req.body?.overrideReason || req.body?.reason || '').trim(),
        overrideActionType: String(overridePayload?.overrideActionType || req.body?.overrideActionType || 'ADMIN_OVERRIDE').trim(),
        originalAuthorId: targetContext.authorUserId || targetContext.createdBy,
        previousState: targetContext.status,
        newState: req.body?.newState || req.body?.targetStatus,
      };
    }

    // 4. Parse capability
    const parsed = parseCapability(capability);
    if (!parsed.isValid) {
      const errEnvelope = createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        `Invalid capability identifier: ${capability}`,
        requestId
      );
      res.status(400).json({
        ...errEnvelope,
        message: `Invalid capability identifier: ${capability}`,
      });
      return;
    }

    // 5. Evaluate via authoritative RBAC Evaluator (12-step pipeline)
    const decision = evaluateAuthorization({
      actor,
      resource: parsed.resource,
      action: parsed.action,
      targetContext,
    });

    if (!decision.allowed) {
      if (decision.errorCode === AuthorizationErrorCode.UNAUTHENTICATED) {
        const errEnvelope = createErrorResponse(
          ApiErrorCode.UNAUTHENTICATED,
          decision.errorMessage || 'Authentication required.',
          requestId
        );
        res.status(401).json({
          ...errEnvelope,
          message: decision.errorMessage || 'Authentication required.',
        });
        return;
      }

      if (decision.errorCode === AuthorizationErrorCode.FORBIDDEN_BY_SEGREGATION_OF_DUTIES) {
        const errEnvelope = createErrorResponse(
          ApiErrorCode.FORBIDDEN_BY_SEGREGATION_OF_DUTIES,
          decision.errorMessage || 'Self-approval prohibited: Creator cannot approve their own artifact (GAR-02).',
          requestId,
          { errorCode: decision.errorCode, evaluatedCapability: decision.evaluatedCapability, rule: 'GAR-02' }
        );
        res.status(403).json({
          ...errEnvelope,
          message: decision.errorMessage || 'Self-approval prohibited: Creator cannot approve their own artifact (GAR-02).',
        });
        return;
      }

      if (decision.errorCode === AuthorizationErrorCode.FORBIDDEN_BY_AI_GATING) {
        const errEnvelope = createErrorResponse(
          ApiErrorCode.FORBIDDEN_BY_AI_GATING,
          decision.errorMessage || 'AI cannot self-approve or bypass human authorization gates (AP-009).',
          requestId,
          { errorCode: decision.errorCode, evaluatedCapability: decision.evaluatedCapability, rule: 'AP-009' }
        );
        res.status(403).json({
          ...errEnvelope,
          message: decision.errorMessage || 'AI cannot self-approve or bypass human authorization gates (AP-009).',
        });
        return;
      }

      const errEnvelope = createErrorResponse(
        ApiErrorCode.FORBIDDEN_LACKS_CAPABILITY,
        decision.errorMessage || `Forbidden: Insufficient role permissions for capability ${capability}.`,
        requestId,
        {
          errorCode: decision.errorCode || 'FORBIDDEN',
          evaluatedCapability: decision.evaluatedCapability,
          resolvedRole: decision.resolvedRole,
        }
      );
      res.status(403).json({
        ...errEnvelope,
        message: decision.errorMessage || `Forbidden: Insufficient role permissions for capability ${capability}.`,
      });
      return;
    }

    (req as any)._authDecision = decision;
    next();
  };
}

/**
 * Middleware: requireNotAuthor (GAR-02 Anti-Self-Approval Guard)
 * Strictly asserts that the authenticated actor is not the author/creator of the resource.
 * Prohibits self-approval even for ADMIN.
 */
export function requireNotAuthor(
  authorIdExtractor?: (req: AuthenticatedRequest) => Promise<string | undefined> | string | undefined
) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const requestId = (req.headers['x-request-id'] as string) || `req_${Date.now()}`;
    if (!req.user) {
      const errEnvelope = createErrorResponse(
        ApiErrorCode.UNAUTHENTICATED,
        'Authentication required.',
        requestId
      );
      res.status(401).json({ ...errEnvelope, message: 'Authentication required.' });
      return;
    }

    let authorId: string | undefined;
    if (authorIdExtractor) {
      authorId = await authorIdExtractor(req);
    } else {
      authorId = req.body?.authorUserId || req.body?.authorId || req.body?.createdBy || req.body?._authorId;
    }

    if (authorId && req.user.id === authorId) {
      const errEnvelope = createErrorResponse(
        ApiErrorCode.FORBIDDEN_BY_BUSINESS_RULE,
        'Self-approval prohibited: Creator cannot approve their own artifact (GAR-02).',
        requestId,
        { rule: 'GAR-02', actorId: req.user.id, authorId }
      );
      res.status(403).json({
        ...errEnvelope,
        message: 'Self-approval prohibited: Creator cannot approve their own artifact (GAR-02).',
      });
      return;
    }

    next();
  };
}


