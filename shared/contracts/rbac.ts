/**
 * BURRA PARIKSHA CMS — Shared RBAC Contracts
 * Authoritative capability syntax and permission checks
 */

import {
  AuthorizationAction,
  AuthorizationResource,
  CANONICAL_ACTIONS,
  CANONICAL_RESOURCES,
  CanonicalRbacRole,
} from '../constants/roles';

export type CapabilityString = `${AuthorizationResource}:${AuthorizationAction}`;

export function formatCapability(
  resource: AuthorizationResource,
  action: AuthorizationAction
): CapabilityString {
  return `${resource}:${action}` as CapabilityString;
}

export function parseCapability(capability: string): {
  resource: AuthorizationResource;
  action: AuthorizationAction;
  isValid: boolean;
} {
  const parts = capability.split(':');
  if (parts.length !== 2) {
    return { resource: '' as any, action: '' as any, isValid: false };
  }
  const [resStr, actStr] = parts;
  const isValidResource = CANONICAL_RESOURCES.includes(resStr as AuthorizationResource);
  const isValidAction = CANONICAL_ACTIONS.includes(actStr as AuthorizationAction);
  return {
    resource: resStr as AuthorizationResource,
    action: actStr as AuthorizationAction,
    isValid: isValidResource && isValidAction,
  };
}

export interface UserAccessProfile {
  userId: string;
  name: string;
  email: string;
  primaryRole: CanonicalRbacRole | string;
  roles: (CanonicalRbacRole | string)[];
  capabilities: CapabilityString[];
  isAuthenticated: boolean;
}

export interface RoleCapabilities {
  role: CanonicalRbacRole | string;
  displayName: string;
  description: string;
  capabilities: CapabilityString[];
}
