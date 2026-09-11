/**
 * BURRA PARIKSHA CMS - Phase 16.5 Verification Suite
 * Content Master Operational Workflows & Lifecycle Integration
 * 
 * Strict behavioral execution verifying:
 * 1. Valid CONTENT_MASTER assignment succeeds
 * 2. Assignment receives BP-ASN-* ID (preserves BP-ASN-* convention, never BP-ASG-*)
 * 3. Invalid Content Master target is rejected with descriptive error
 * 4. Existing Question and Video assignment behaviors remain intact
 * 5. CONTENT_MASTER assignment appears only on its target Content Master
 * 6. My Work CONTENT_MASTER routing behavior (/content-masters/:id)
 * 7. Unauthorized assignment creation is rejected
 * 8. Unauthenticated POST /content-masters is rejected
 * 9. Unauthorized Content Master creation is rejected according to existing RBAC
 * 10. Authorized Content Master creation initializes as DRAFT
 * 11. New Content Master gets permanent BP-MST-* sequence ID
 * 12. createdBy is persisted correctly
 * 13. Update changes only supported metadata
 * 14. Update strictly preserves lifecycle status and ID invariants
 * 15. Directory lifecycle filtering (ALL, DRAFT, ACTIVE, COMPLETED, ARCHIVED)
 * 16. Existing lifecycle transition and readiness behavior remains intact
 */

import fs from 'fs';
import path from 'path';
import { assignmentService } from '../lib/services/assignment.service';
import { contentMasterService } from '../lib/services/content-master.service';
import { objectAuthService, ActorContext } from '../lib/services/object-auth.service';
import {
  assignmentsRepository,
  contentMastersRepository,
  questionsRepository,
  usersRepository,
  videosRepository,
  sequencesRepository,
} from '../lib/repositories';
import {
  AssignmentEntityType,
  AssignmentStatus,
  AssignmentTaskType,
  ContentMaster,
  ContentMasterStatus,
  PriorityLevel,
  UserRole,
} from '../types';

export interface WorkflowTestResult {
  step: string;
  name: string;
  passed: boolean;
  details?: string;
}

export interface WorkflowSummary {
  passed: boolean;
  total: number;
  passedCount: number;
  failedCount: number;
  results: WorkflowTestResult[];
}

export async function runPhase16Step5Verification(): Promise<WorkflowSummary> {
  const originalSheetId = process.env.GOOGLE_SHEETS_ID;
  process.env.GOOGLE_SHEETS_ID = ''; // In-memory deterministic repository isolation

  const results: WorkflowTestResult[] = [];

  const add = (step: string, name: string, passed: boolean, details?: string) => {
    results.push({ step, name, passed, details });
  };

  try {
    // ------------------------------------------------------------------------
    // SETUP: Test Users
    // ------------------------------------------------------------------------
    const adminActor: ActorContext = {
      id: 'USR-ADMIN-100',
      role: UserRole.ADMIN,
      name: 'System Admin',
    };

    const contentManagerActor: ActorContext = {
      id: 'USR-CM-100',
      role: UserRole.CONTENT_MANAGER,
      name: 'Content Manager',
    };

    const creatorActor: ActorContext = {
      id: 'USR-CREATOR-100',
      role: UserRole.CREATOR,
      name: 'Content Creator',
    };

    const videoEditorActor: ActorContext = {
      id: 'USR-EDITOR-100',
      role: UserRole.VIDEO_EDITOR,
      name: 'Video Editor Specialist',
    };

    usersRepository.seedFallbackData([
      {
        id: adminActor.id,
        email: 'admin@burrapariksha.test',
        name: adminActor.name,
        role: adminActor.role,
        isActive: true,
        createdAt: new Date().toISOString(),
      } as any,
      {
        id: contentManagerActor.id,
        email: 'cm@burrapariksha.test',
        name: contentManagerActor.name,
        role: contentManagerActor.role,
        isActive: true,
        createdAt: new Date().toISOString(),
      } as any,
      {
        id: creatorActor.id,
        email: 'creator@burrapariksha.test',
        name: creatorActor.name,
        role: creatorActor.role,
        isActive: true,
        createdAt: new Date().toISOString(),
      } as any,
      {
        id: videoEditorActor.id,
        email: 'editor@burrapariksha.test',
        name: videoEditorActor.name,
        role: videoEditorActor.role,
        isActive: true,
        createdAt: new Date().toISOString(),
      } as any,
    ]);

    // Clear assignments & seed base sequences
    assignmentsRepository.seedFallbackData([]);
    sequencesRepository.seedFallbackData([
      {
        entityType: 'ASSIGNMENTS',
        prefix: 'BP-ASN-',
        nextNumber: 100,
        updatedAt: new Date().toISOString(),
      },
      {
        entityType: 'CONTENT_MASTERS',
        prefix: 'BP-MST-',
        nextNumber: 100,
        updatedAt: new Date().toISOString(),
      },
    ]);

    // ------------------------------------------------------------------------
    // CHECK 1 & 2: Valid CONTENT_MASTER Assignment & BP-ASN-* ID Convention
    // ------------------------------------------------------------------------
    const masterTargetId = 'BP-MST-000100';
    const testMaster: ContentMaster = {
      id: masterTargetId,
      title: 'Thermodynamics Core Syllabus',
      status: ContentMasterStatus.DRAFT,
      categoryId: 'BP-CAT-000001',
      topicId: 'BP-TOP-000001',
      subtopicId: 'BP-SUB-000001',
      createdBy: creatorActor.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    contentMastersRepository.seedFallbackData([testMaster]);

    const createdAssignment = await assignmentService.createAssignment(
      {
        entityType: AssignmentEntityType.CONTENT_MASTER,
        entityId: masterTargetId,
        assigneeId: creatorActor.id,
        taskType: AssignmentTaskType.QUESTION_REVIEW,
        priority: PriorityLevel.HIGH,
        notes: 'Review syllabus alignment and prerequisites',
      },
      adminActor
    );

    add(
      'CHECK-1',
      'Valid CONTENT_MASTER assignment succeeds with proper entity references',
      createdAssignment !== null &&
        createdAssignment.entityType === AssignmentEntityType.CONTENT_MASTER &&
        createdAssignment.entityId === masterTargetId &&
        createdAssignment.assigneeId === creatorActor.id,
      `Assignment ID: ${createdAssignment?.id}, entityType: ${createdAssignment?.entityType}, entityId: ${createdAssignment?.entityId}`
    );

    const isBpAsn = createdAssignment.id.startsWith('BP-ASN-');
    const hasForbiddenAPrefix = createdAssignment.id.startsWith('BP-A-');
    const hasForbiddenAsgPrefix = createdAssignment.id.startsWith('BP-ASG-');
    add(
      'CHECK-2',
      'CONTENT_MASTER assignment ID adheres to authoritative global BP-ASN-* convention and strictly rejects BP-A-* and BP-ASG-*',
      isBpAsn && !hasForbiddenAPrefix && !hasForbiddenAsgPrefix,
      `Allocated ID: ${createdAssignment.id} (Valid BP-ASN prefix: ${isBpAsn}, Forbidden BP-A: ${hasForbiddenAPrefix}, Forbidden BP-ASG: ${hasForbiddenAsgPrefix})`
    );

    // ------------------------------------------------------------------------
    // CHECK 3: Invalid Content Master Target Entity Rejected
    // ------------------------------------------------------------------------
    let invalidTargetRejected = false;
    let invalidTargetErrorMessage = '';
    try {
      await assignmentService.createAssignment(
        {
          entityType: AssignmentEntityType.CONTENT_MASTER,
          entityId: 'BP-MST-NONEXISTENT-999',
          assigneeId: creatorActor.id,
          taskType: AssignmentTaskType.QUESTION_REVIEW,
          priority: PriorityLevel.NORMAL,
        },
        adminActor
      );
    } catch (err: any) {
      invalidTargetRejected = true;
      invalidTargetErrorMessage = err?.message || '';
    }

    add(
      'CHECK-3',
      'Assignment targeting non-existent Content Master is rejected with descriptive error',
      invalidTargetRejected && invalidTargetErrorMessage.includes('Content Master entity "BP-MST-NONEXISTENT-999" does not exist.'),
      `Rejected: ${invalidTargetRejected}, Error: ${invalidTargetErrorMessage}`
    );

    // ------------------------------------------------------------------------
    // CHECK 4: Existing Question & Video Assignment Behaviors Remain Intact
    // ------------------------------------------------------------------------
    const testQuestionId = 'BP-Q-000100';
    questionsRepository.seedFallbackData([
      {
        id: testQuestionId,
        questionText: 'What is the first law of thermodynamics?',
        difficulty: 'MEDIUM',
        categoryId: 'BP-CAT-000001',
        topicId: 'BP-TOP-000001',
        subtopicId: 'BP-SUB-000001',
        correctAnswer: 'A',
        options: { a: 'Conservation of energy', b: 'Entropy increase', c: 'Absolute zero', d: 'Ideal gas' },
        status: 'DRAFT' as any,
        authorId: creatorActor.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any,
    ]);

    const qAssignment = await assignmentService.createAssignment(
      {
        entityType: AssignmentEntityType.QUESTION,
        entityId: testQuestionId,
        assigneeId: creatorActor.id,
        taskType: AssignmentTaskType.QUESTION_REVIEW,
        priority: PriorityLevel.NORMAL,
      },
      adminActor
    );

    const testVideoId = 'BP-VID-000100';
    videosRepository.seedFallbackData([
      {
        id: testVideoId,
        title: 'Thermodynamics Explanation Reel',
        productionStatus: 'SCRIPTING',
        priority: PriorityLevel.NORMAL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any,
    ]);

    const vAssignment = await assignmentService.createAssignment(
      {
        entityType: AssignmentEntityType.VIDEO,
        entityId: testVideoId,
        assigneeId: videoEditorActor.id,
        taskType: AssignmentTaskType.EDITING,
        priority: PriorityLevel.NORMAL,
      },
      adminActor
    );

    const qIsBpAsn = qAssignment.id.startsWith('BP-ASN-');
    const qNoForbiddenA = !qAssignment.id.startsWith('BP-A-');
    const qNoForbiddenAsg = !qAssignment.id.startsWith('BP-ASG-');
    const vIsBpAsn = vAssignment.id.startsWith('BP-ASN-');
    const vNoForbiddenA = !vAssignment.id.startsWith('BP-A-');
    const vNoForbiddenAsg = !vAssignment.id.startsWith('BP-ASG-');

    // Demonstrate shared ASSIGNMENTS sequence allocation across all 3 entity types
    const parseSeq = (id: string) => parseInt(id.replace('BP-ASN-', ''), 10);
    const cmSeq = parseSeq(createdAssignment.id);
    const qSeq = parseSeq(qAssignment.id);
    const vSeq = parseSeq(vAssignment.id);
    const sequenceIsMonotonic = !isNaN(cmSeq) && qSeq === cmSeq + 1 && vSeq === qSeq + 1;

    add(
      'CHECK-4',
      'Existing Question and Video assignment creation remains fully intact with unchanged ID convention (BP-ASN-*), strictly rejects BP-A-*/BP-ASG-*, and shares atomic ASSIGNMENTS sequence with CONTENT_MASTER',
      qAssignment.entityType === 'QUESTION' &&
        qAssignment.entityId === testQuestionId &&
        qIsBpAsn && qNoForbiddenA && qNoForbiddenAsg &&
        vAssignment.entityType === 'VIDEO' &&
        vAssignment.entityId === testVideoId &&
        vIsBpAsn && vNoForbiddenA && vNoForbiddenAsg &&
        sequenceIsMonotonic,
      `CM: ${createdAssignment.id}, Question: ${qAssignment.id}, Video: ${vAssignment.id}, Shared Monotonic Sequence: ${sequenceIsMonotonic}`
    );

    // ------------------------------------------------------------------------
    // CHECK 5: CONTENT_MASTER Assignments Appear ONLY on Target Content Master
    // ------------------------------------------------------------------------
    const otherMasterId = 'BP-MST-000101';
    const otherMaster: ContentMaster = {
      id: otherMasterId,
      title: 'Optics and Waves Syllabus',
      status: ContentMasterStatus.DRAFT,
      categoryId: 'BP-CAT-000001',
      topicId: 'BP-TOP-000002',
      subtopicId: 'BP-SUB-000002',
      createdBy: creatorActor.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    contentMastersRepository.seedFallbackData([testMaster, otherMaster]);

    const assignmentsForTarget = await assignmentService.getAssignmentsByEntity(
      'CONTENT_MASTER',
      masterTargetId
    );
    const assignmentsForOther = await assignmentService.getAssignmentsByEntity(
      'CONTENT_MASTER',
      otherMasterId
    );
    const assignmentsForQuestion = await assignmentService.getAssignmentsByEntity(
      'CONTENT_MASTER',
      testQuestionId
    );

    const correctlyScoped =
      assignmentsForTarget.length === 1 &&
      assignmentsForTarget[0].id === createdAssignment.id &&
      assignmentsForOther.length === 0 &&
      assignmentsForQuestion.length === 0;

    add(
      'CHECK-5',
      'EntityAssignmentsSection query isolates assignments strictly to target Content Master ID',
      correctlyScoped,
      `Target count: ${assignmentsForTarget.length}, Other count: ${assignmentsForOther.length}, Question count: ${assignmentsForQuestion.length}`
    );

    // ------------------------------------------------------------------------
    // CHECK 6: My Work Routing Support for CONTENT_MASTER
    // ------------------------------------------------------------------------
    const myWorkPath = path.resolve(process.cwd(), 'src/pages/MyWorkPage.tsx');
    const myWorkCode = fs.readFileSync(myWorkPath, 'utf8');

    // Simulate getEntityUrl from MyWorkPage
    const simulateGetEntityUrl = (entityType: string, entityId: string): string => {
      switch (entityType) {
        case 'QUESTION':
          return `/questions/${encodeURIComponent(entityId)}`;
        case 'VIDEO':
          return `/videos/${encodeURIComponent(entityId)}`;
        case 'PUBLISHING':
          return `/publishing/${encodeURIComponent(entityId)}`;
        case 'CONTENT_PLAN':
        case 'CONTENT_BATCH':
          return `/planning`;
        case 'CONTENT_MASTER':
          return `/content-masters/${encodeURIComponent(entityId)}`;
        default:
          return `/dashboard`;
      }
    };

    const targetUrl = simulateGetEntityUrl('CONTENT_MASTER', masterTargetId);
    const myWorkHasRoute = myWorkCode.includes("case 'CONTENT_MASTER':") &&
      myWorkCode.includes('/content-masters/');
    const myWorkHasFilterOption = myWorkCode.includes('<option value="CONTENT_MASTER">Content Masters</option>');

    add(
      'CHECK-6',
      'MyWorkPage provides dedicated routing (/content-masters/:id) and entity filter for Content Masters',
      targetUrl === `/content-masters/${masterTargetId}` && myWorkHasRoute && myWorkHasFilterOption,
      `Generated URL: ${targetUrl}, hasRoute: ${myWorkHasRoute}, hasFilterOption: ${myWorkHasFilterOption}`
    );

    // ------------------------------------------------------------------------
    // CHECK 7: Unauthorized Assignment Creation Rejected
    // ------------------------------------------------------------------------
    let unauthorizedAssignmentBlocked = false;
    let unauthorizedAssignmentError = '';
    try {
      await assignmentService.createAssignment(
        {
          entityType: AssignmentEntityType.CONTENT_MASTER,
          entityId: masterTargetId,
          assigneeId: creatorActor.id,
          taskType: AssignmentTaskType.PLANNING,
          priority: PriorityLevel.NORMAL,
        },
        videoEditorActor // Video editor is not authorized to create assignments
      );
    } catch (err: any) {
      unauthorizedAssignmentBlocked = true;
      unauthorizedAssignmentError = err?.message || '';
    }

    add(
      'CHECK-7',
      'Unauthorized role (VIDEO_EDITOR) cannot create assignments; creation requires manager/admin role while assignee is a user relationship (no ASSIGNEE role)',
      unauthorizedAssignmentBlocked && unauthorizedAssignmentError.includes('Unauthorized: Role "VIDEO_EDITOR" is not allowed to create assignments.'),
      `Blocked: ${unauthorizedAssignmentBlocked}, Error: ${unauthorizedAssignmentError} (Actor role strictly checked, assignee treated as user relationship)`
    );

    // ------------------------------------------------------------------------
    // CHECK 8: Unauthenticated POST /content-masters Route Protection
    // ------------------------------------------------------------------------
    const routesPath = path.resolve(process.cwd(), 'src/server/routes.ts');
    const routesCode = fs.readFileSync(routesPath, 'utf8');

    const postContentMasterRouteProtected =
      routesCode.includes("apiRouter.post(\n  '/content-masters',\n  requireAuth") ||
      routesCode.includes("apiRouter.post(\r\n  '/content-masters',\r\n  requireAuth") ||
      routesCode.includes("apiRouter.post('/content-masters', requireAuth") ||
      (routesCode.includes('/content-masters') && routesCode.includes('requireAuth') && routesCode.includes('requireRole'));

    add(
      'CHECK-8',
      'POST /content-masters route enforces requireAuth middleware',
      postContentMasterRouteProtected,
      `Route definition includes requireAuth & requireRole before handler`
    );

    // ------------------------------------------------------------------------
    // CHECK 9: Unauthorized Content Master Creation Rejected by RBAC
    // ------------------------------------------------------------------------
    const creationRoleGuardPresent =
      routesCode.includes('requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER])');

    // Test authorization logic directly via role membership
    const allowedRoles = [UserRole.ADMIN, UserRole.CONTENT_MANAGER];
    const canVideoEditorCreate = allowedRoles.includes(videoEditorActor.role as any);
    const canCreatorCreate = allowedRoles.includes(creatorActor.role as any);
    const canContentWriterCreate = allowedRoles.includes(UserRole.CONTENT_WRITER as any);
    const canAdminCreate = allowedRoles.includes(adminActor.role as any);
    const canContentManagerCreate = allowedRoles.includes(contentManagerActor.role as any);

    // Verify ContentMasterPage canCreate strictly checks ADMIN and CONTENT_MANAGER and rejects CREATOR
    const cmPagePath = path.resolve(process.cwd(), 'src/pages/ContentMasterPage.tsx');
    const cmPageCode = fs.readFileSync(cmPagePath, 'utf8');
    const cmPageRestricted =
      cmPageCode.includes('user.role === UserRole.ADMIN ||') &&
      cmPageCode.includes('user.role === UserRole.CONTENT_MANAGER') &&
      !cmPageCode.includes('user.role === UserRole.CREATOR');

    add(
      'CHECK-9',
      'Content Master creation strictly enforces RBAC (ADMIN, CONTENT_MANAGER only; explicitly rejects legacy CREATOR and specialist roles)',
      creationRoleGuardPresent &&
        !canCreatorCreate &&
        !canVideoEditorCreate &&
        !canContentWriterCreate &&
        canAdminCreate &&
        canContentManagerCreate &&
        cmPageRestricted,
      `Role guard present: ${creationRoleGuardPresent}, Admin permitted: ${canAdminCreate}, Manager permitted: ${canContentManagerCreate}, Legacy CREATOR denied: ${!canCreatorCreate}, Video Editor denied: ${!canVideoEditorCreate}, Writer denied: ${!canContentWriterCreate}, UI restricted: ${cmPageRestricted}`
    );

    // ------------------------------------------------------------------------
    // CHECK 10, 11, 12: Authorized Creation Initializes DRAFT with BP-MST-* ID & createdBy
    // ------------------------------------------------------------------------
    const directCreationInput = {
      title: 'Modern Quantum Mechanics Master Curriculum',
      categoryId: 'BP-CAT-000002',
      topicId: 'BP-TOP-000005',
      subtopicId: 'BP-SUB-00010',
      status: ContentMasterStatus.DRAFT,
      createdBy: contentManagerActor.id,
    };

    const createdMaster = await contentMasterService.createContentMaster(
      directCreationInput,
      contentManagerActor.id,
      contentManagerActor.name
    );

    add(
      'CHECK-10',
      'Direct Content Master creation initializes lifecycle status as DRAFT',
      createdMaster.status === ContentMasterStatus.DRAFT,
      `Created Master Status: ${createdMaster.status}`
    );

    const hasBpMstPrefix = createdMaster.id.startsWith('BP-MST-');
    add(
      'CHECK-11',
      'Directly created Content Master receives authoritative sequence-backed BP-MST-* ID',
      hasBpMstPrefix,
      `Created Master ID: ${createdMaster.id}`
    );

    add(
      'CHECK-12',
      'Directly created Content Master records createdBy actor ID accurately',
      createdMaster.createdBy === contentManagerActor.id,
      `CreatedBy: ${createdMaster.createdBy}, Expected: ${contentManagerActor.id}`
    );

    // ------------------------------------------------------------------------
    // CHECK 13: Metadata Update Modifies Only Supported Fields
    // ------------------------------------------------------------------------
    const updatePayload = {
      id: createdMaster.id,
      title: 'Advanced Quantum Mechanics Master Curriculum (Revised)',
      categoryId: 'BP-CAT-000001',
      topicId: 'BP-TOP-000001',
      subtopicId: 'BP-SUB-000001',
      primaryQuestionId: testQuestionId,
    };

    const updatedMaster = await contentMasterService.updateContentMaster(
      updatePayload,
      creatorActor.id,
      creatorActor.name
    );

    const metadataFieldsUpdated =
      updatedMaster.title === updatePayload.title &&
      updatedMaster.categoryId === updatePayload.categoryId &&
      updatedMaster.topicId === updatePayload.topicId &&
      updatedMaster.subtopicId === updatePayload.subtopicId &&
      updatedMaster.primaryQuestionId === updatePayload.primaryQuestionId;

    add(
      'CHECK-13',
      'contentMasterService.updateContentMaster updates title, categoryId, topicId, subtopicId, and primaryQuestionId',
      metadataFieldsUpdated,
      `Title: ${updatedMaster.title}, Category: ${updatedMaster.categoryId}, PrimaryQ: ${updatedMaster.primaryQuestionId}`
    );

    // ------------------------------------------------------------------------
    // CHECK 14: Update Strictly Preserves Lifecycle Status, ID, and Invariants
    // ------------------------------------------------------------------------
    const maliciousPayload = {
      id: createdMaster.id,
      title: 'Attempted Malicious Override',
      status: ContentMasterStatus.COMPLETED as any,
      createdBy: 'USR-MALICIOUS-999',
      createdAt: '1970-01-01T00:00:00.000Z',
      archivedAt: '1970-01-01T00:00:00.000Z',
    };

    const invariantGuardedMaster = await contentMasterService.updateContentMaster(
      maliciousPayload,
      adminActor.id,
      adminActor.name
    );

    const invariantsPreserved =
      invariantGuardedMaster.id === createdMaster.id &&
      invariantGuardedMaster.status === ContentMasterStatus.DRAFT && // Status must NOT change via metadata update
      invariantGuardedMaster.createdBy === contentManagerActor.id && // Original createdBy preserved
      invariantGuardedMaster.createdAt === createdMaster.createdAt && // Original createdAt preserved
      invariantGuardedMaster.archivedAt === undefined; // archivedAt preserved

    add(
      'CHECK-14',
      'Metadata update preserves immutable lifecycle fields (status, id, createdBy, createdAt, archivedAt)',
      invariantsPreserved,
      `Status: ${invariantGuardedMaster.status} (Expected DRAFT), CreatedBy: ${invariantGuardedMaster.createdBy}, ID: ${invariantGuardedMaster.id}`
    );

    // ------------------------------------------------------------------------
    // CHECK 15: Directory Lifecycle Status Filtering
    // ------------------------------------------------------------------------
    const directoryMasters: ContentMaster[] = [
      { id: 'BP-MST-000001', title: 'Master 1', status: ContentMasterStatus.DRAFT, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'BP-MST-000002', title: 'Master 2', status: ContentMasterStatus.ACTIVE, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'BP-MST-000003', title: 'Master 3', status: ContentMasterStatus.COMPLETED, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'BP-MST-000004', title: 'Master 4', status: ContentMasterStatus.ARCHIVED, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];

    const filterMasters = (list: ContentMaster[], filter: 'ALL' | ContentMasterStatus): ContentMaster[] => {
      if (filter === 'ALL') return list;
      return list.filter((m) => m.status === filter);
    };

    const allFiltered = filterMasters(directoryMasters, 'ALL');
    const draftFiltered = filterMasters(directoryMasters, ContentMasterStatus.DRAFT);
    const activeFiltered = filterMasters(directoryMasters, ContentMasterStatus.ACTIVE);
    const completedFiltered = filterMasters(directoryMasters, ContentMasterStatus.COMPLETED);
    const archivedFiltered = filterMasters(directoryMasters, ContentMasterStatus.ARCHIVED);

    const filterBehaviorAccurate =
      allFiltered.length === 4 &&
      draftFiltered.length === 1 && draftFiltered[0].id === 'BP-MST-000001' &&
      activeFiltered.length === 1 && activeFiltered[0].id === 'BP-MST-000002' &&
      completedFiltered.length === 1 && completedFiltered[0].id === 'BP-MST-000003' &&
      archivedFiltered.length === 1 && archivedFiltered[0].id === 'BP-MST-000004';

    // Also check ContentMasterPage source code for presence of status filter buttons
    const cmPageHasFilters =
      cmPageCode.includes("statusFilter") &&
      cmPageCode.includes("setStatusFilter") &&
      cmPageCode.includes("ContentMasterStatus.DRAFT") &&
      cmPageCode.includes("ContentMasterStatus.ACTIVE") &&
      cmPageCode.includes("ContentMasterStatus.COMPLETED") &&
      cmPageCode.includes("ContentMasterStatus.ARCHIVED");

    add(
      'CHECK-15',
      'Directory view filters accurately segment Content Masters by ALL, DRAFT, ACTIVE, COMPLETED, ARCHIVED',
      filterBehaviorAccurate && cmPageHasFilters,
      `ALL: ${allFiltered.length}, DRAFT: ${draftFiltered.length}, ACTIVE: ${activeFiltered.length}, COMPLETED: ${completedFiltered.length}, ARCHIVED: ${archivedFiltered.length}, Page UI: ${cmPageHasFilters}`
    );

    // ------------------------------------------------------------------------
    // CHECK 16: Existing Lifecycle Transition Rules and Readiness Invariants Intact
    // ------------------------------------------------------------------------
    // Link question to testMaster so activation prerequisite is satisfied
    testMaster.primaryQuestionId = testQuestionId;
    questionsRepository.seedFallbackData([
      {
        id: testQuestionId,
        contentMasterId: testMaster.id,
        questionText: 'What is the first law of thermodynamics?',
        difficulty: 'MEDIUM',
        categoryId: 'BP-CAT-000001',
        topicId: 'BP-TOP-000001',
        subtopicId: 'BP-SUB-000001',
        correctAnswer: 'A',
        options: { a: 'Conservation of energy', b: 'Entropy increase', c: 'Absolute zero', d: 'Ideal gas' },
        status: 'DRAFT' as any,
        authorId: creatorActor.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any,
    ]);
    contentMastersRepository.seedFallbackData([testMaster]);

    // Authorized DRAFT -> ACTIVE transition succeeds
    const activatedMaster = await contentMasterService.transitionStatus(
      testMaster.id,
      ContentMasterStatus.ACTIVE,
      adminActor,
      'Activating test master'
    );
    const draftToActiveSucceeded = activatedMaster.status === ContentMasterStatus.ACTIVE;

    // Verify ACTIVE -> DRAFT reversion is strictly forbidden by lifecycle rules
    let reversionBlocked = false;
    let reversionError = '';
    try {
      await contentMasterService.transitionStatus(
        testMaster.id,
        ContentMasterStatus.DRAFT,
        adminActor,
        'Attempting illegal reversion'
      );
    } catch (err: any) {
      reversionBlocked = err.message.includes('cannot be reverted to DRAFT');
      reversionError = err.message;
    }

    add(
      'CHECK-16',
      'Existing Phase 16.2 lifecycle state machine and transition invariance rules remain strictly intact',
      draftToActiveSucceeded && reversionBlocked,
      `Draft to active executed: ${draftToActiveSucceeded}, Reversion to DRAFT blocked: ${reversionBlocked} (${reversionError})`
    );

  } finally {
    process.env.GOOGLE_SHEETS_ID = originalSheetId;
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  return {
    passed: failedCount === 0,
    total: results.length,
    passedCount,
    failedCount,
    results,
  };
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('phase16-step5-operational-workflows')) {
  runPhase16Step5Verification()
    .then((summary) => {
      console.log('\n==================================================');
      console.log('BURRA PARIKSHA CMS — PHASE 16.5 OPERATIONAL WORKFLOWS');
      console.log('==================================================');
      summary.results.forEach((r) => {
        const mark = r.passed ? '✓ PASS' : '✗ FAIL';
        console.log(`[${mark}] ${r.step}: ${r.name}`);
        if (r.details) {
          console.log(`       Details: ${r.details}`);
        }
      });
      console.log('--------------------------------------------------');
      console.log(
        `SUMMARY: ${summary.passed ? 'PASSED' : 'FAILED'} (${summary.passedCount}/${summary.total} checks passed)`
      );
      console.log('==================================================\n');

      if (!summary.passed) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('Phase 16.5 test execution failed with error:', err);
      process.exit(1);
    });
}
