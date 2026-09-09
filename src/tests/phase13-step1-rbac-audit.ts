import { publishingService } from '../lib/services/publishing.service';
import { objectAuthService } from '../lib/services/object-auth.service';
import { getRequestActor } from '../server/routes';
import { UserRole } from '../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function runRbacAudit() {
  console.log('=== PHASE 13.1 TARGETED RBAC AUDIT ===\n');

  // Test cases 1-13: Service & Role checks
  const futureDate = new Date(Date.now() + 86400000).toISOString();

  // Allowed Roles
  const allowedActors = [
    { name: 'ADMIN', actor: { id: 'ADM-1', role: UserRole.ADMIN } },
    { name: 'CONTENT_MANAGER', actor: { id: 'CM-1', role: UserRole.CONTENT_MANAGER } },
    { name: 'PUBLISHING_MANAGER', actor: { id: 'PM-1', role: UserRole.PUBLISHING_MANAGER } },
  ];

  for (const item of allowedActors) {
    const authCheck = publishingService.isAuthorizedForPublishing(item.actor);
    assert(authCheck.authorized, `Service layer allows canonical role: ${item.name}`);
  }

  // Denied / Non-Canonical Roles
  const deniedActors = [
    { name: 'QUESTION_EDITOR', actor: { id: 'QE-1', role: UserRole.QUESTION_EDITOR } },
    { name: 'SCRIPT_WRITER', actor: { id: 'SW-1', role: UserRole.SCRIPT_WRITER } },
    { name: 'VIDEO_EDITOR', actor: { id: 'VE-1', role: UserRole.VIDEO_EDITOR } },
    { name: 'DESIGNER', actor: { id: 'DES-1', role: UserRole.DESIGNER } },
    { name: 'REVIEWER', actor: { id: 'REV-1', role: UserRole.REVIEWER } },
    { name: 'CREATOR', actor: { id: 'CR-1', role: UserRole.CREATOR } },
    { name: 'EDITOR', actor: { id: 'ED-1', role: UserRole.EDITOR } },
    { name: 'PRODUCER', actor: { id: 'PRD-1', role: 'PRODUCER' } },
    { name: 'LEAD_EDITOR', actor: { id: 'LE-1', role: 'LEAD_EDITOR' } },
    { name: 'SUPER_ADMIN', actor: { id: 'SA-1', role: 'SUPER_ADMIN' } },
  ];

  for (const item of deniedActors) {
    const authCheck = publishingService.isAuthorizedForPublishing(item.actor);
    assert(!authCheck.authorized, `Service layer REJECTS non-publishing/legacy role: ${item.name}`);

    let errorCaught = false;
    try {
      publishingService.assertPublishAuthorization(item.actor);
    } catch (err: any) {
      errorCaught = true;
    }
    assert(errorCaught, `assertPublishAuthorization throws for role: ${item.name}`);
  }

  // 14. Unauthenticated check
  const unauthCheck = publishingService.isAuthorizedForPublishing(undefined);
  assert(!unauthCheck.authorized, 'Service layer REJECTS unauthenticated actor (undefined)');

  // 15. Forged actor/role in request body check
  // Verify getRequestActor ignores req.body
  const mockReqWithForgedBody: any = {
    user: { id: 'USR-123', name: 'Legit User', role: UserRole.DESIGNER },
    body: {
      actor: { id: 'ADMIN-999', role: 'ADMIN' },
      role: 'ADMIN',
      userId: 'ADMIN-999',
    },
  };
  const extractedActor = getRequestActor(mockReqWithForgedBody);
  assert(
    extractedActor.id === 'USR-123' && extractedActor.role === UserRole.DESIGNER,
    'getRequestActor strictly reads verified req.user and ignores forged req.body fields'
  );

  // 16. Unauthorized object check
  const unassignedDesigner = { id: 'DES-999', role: UserRole.DESIGNER };
  const mockVideo = { id: 'V-TEST-999', videoId: 'V-TEST-999' };
  const canModify = await objectAuthService.canModifyPublishing(unassignedDesigner, mockVideo as any);
  assert(!canModify, 'objectAuthService REJECTS unauthorized actor for object-level publishing modification');

  console.log('\n=== ALL 16 RBAC AUDIT CHECKS PASSED SUCCESSFULLY ===');
}

runRbacAudit().catch((err) => {
  console.error('RBAC Audit Failed:', err);
  process.exit(1);
});
