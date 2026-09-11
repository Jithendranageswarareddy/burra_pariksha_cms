import { Request, Response, NextFunction } from 'express';
import { authService } from '../../lib/services/auth.service';
import { UserRole } from '../../types';

export interface AuthUserContext {
  id: string;
  name: string;
  role: string;
  roles?: string[];
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

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. No session provided.',
    });
    return;
  }

  const payload = authService.verifySessionToken(token);
  if (!payload) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired session.',
    });
    return;
  }

  // Attach verified user context containing id, name, role, roles
  // Never attach password_hash, session token, secrets, or credentials
  const rolesList: string[] = [];
  if (Array.isArray((payload as any).roles)) {
    (payload as any).roles.forEach((r: any) => r && rolesList.push(String(r).trim()));
  }
  if (rolesList.length === 0 && payload.role) {
    String(payload.role).split(',').forEach((r) => r.trim() && rolesList.push(r.trim()));
  }

  req.user = {
    id: payload.userId,
    name: payload.name,
    role: payload.role || rolesList[0] || UserRole.ADMIN,
    roles: rolesList.length > 0 ? rolesList : [payload.role || UserRole.ADMIN],
  };
  next();
}


/**
 * Middleware: requireRole
 * Validates that authenticated user has one of the allowed roles
 */
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required.',
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

    // ADMIN global authority bypass
    const isAdmin = userRoles.includes(UserRole.ADMIN) || userRoles.includes('ADMIN');
    const isAllowed = isAdmin || userRoles.some((r) => allowedRoles.includes(r));

    if (!isAllowed) {
      res.status(403).json({
        success: false,
        error: 'Forbidden: Insufficient role permissions.',
      });
      return;
    }

    next();
  };
}
