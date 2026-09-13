import { User, UserRole } from '../types';
import { authService } from '../lib/services/auth.service';

/**
 * BURRA PARIKSHA CMS — QS-00: DETERMINISTIC QA TEST IDENTITY
 *
 * USR-QA-001 — E2E QA Automator
 * Exists ONLY for test/in-memory automation and MUST NEVER be written to production Google Sheets.
 *
 * Identity specification:
 * - id: USR-QA-001
 * - name: E2E QA Automator
 * - role: UserRole.ADMIN
 * - roles: [UserRole.ADMIN, UserRole.QUESTION_EDITOR]
 */
export const E2E_QA_USER: User = {
  id: 'USR-QA-001',
  name: 'E2E QA Automator',
  email: 'e2e-qa-automator@burrapariksha.local',
  role: UserRole.ADMIN,
  roles: [UserRole.ADMIN, UserRole.QUESTION_EDITOR],
  isActive: true,
  createdAt: '2026-09-12T00:00:00.000Z',
  updatedAt: '2026-09-12T00:00:00.000Z',
};

/**
 * Generates an authentic HMAC-SHA256 session token for the E2E QA Automator test identity.
 * Uses existing authService.generateSessionToken without modifying authentication architecture.
 */
export function generateQaUserToken(expiresInHours = 24): string {
  return authService.generateSessionToken(
    {
      userId: E2E_QA_USER.id,
      name: E2E_QA_USER.name,
      role: E2E_QA_USER.role,
      roles: E2E_QA_USER.roles,
    },
    expiresInHours
  );
}
