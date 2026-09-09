import { Request, Response, NextFunction } from 'express';
import { authService } from '../../lib/services/auth.service';
import { UserRole } from '../../types';

export interface AuthUserContext {
  id: string;
  name: string;
  role: string;
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

  // Attach verified user context containing only id, name, role
  // Never attach password_hash, session token, secrets, or credentials
  req.user = {
    id: payload.userId,
    name: payload.name,
    role: payload.role,
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

    const userRole = req.user.role;
    let isAllowed = allowedRoles.includes(userRole);

    // ADMIN global authority bypass
    if (userRole === UserRole.ADMIN) {
      isAllowed = true;
    }

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
