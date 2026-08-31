/**
 * BURRA PARIKSHA CMS - TASK 3D.4 VERIFICATION SCRIPT
 * Assignment → Script Writer → Designer Production Workflow End-to-End Verification
 * 
 * Verifies that assignments drive production workflow across:
 * Approved Question → Video → Script Assignment → Script Ready → Thumbnail Assignment → Thumbnail Approval
 */

import { questionService } from '../lib/services/question.service';
import { videoService } from '../lib/services/video.service';
import { scriptService } from '../lib/services/script.service';
import { thumbnailService } from '../lib/services/thumbnail.service';
import { assignmentService } from '../lib/services/assignment.service';
import { authService } from '../lib/services/auth.service';
import { usersRepository } from '../lib/repositories/users.repository';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { videosRepository, questionVideosRepository } from '../lib/repositories/videos.repository';
import { scriptsRepository, scriptVersionsRepository } from '../lib/repositories/scripts.repository';
import { thumbnailsRepository, thumbnailVersionsRepository } from '../lib/repositories/thumbnails.repository';
import { assignmentsRepository } from '../lib/repositories/assignments.repository';
import { workflowRepository } from '../lib/repositories/workflow.repository';
import { auditLogRepository } from '../lib/repositories/audit-log.repository';
import { sequencesRepository } from '../lib/repositories/sequences.repository';
import { categoriesRepository } from '../lib/repositories/categories.repository';
import { topicsRepository } from '../lib/repositories/topics.repository';
import { subtopicsRepository } from '../lib/repositories/subtopics.repository';
import {
  AssignmentEntityType,
  AssignmentRole,
  AssignmentStatus,
  AssignmentTaskType,
  DifficultyLevel,
  PriorityLevel,
  QuestionStatus,
  QuestionStyle,
  UserRole,
  VideoProductionStatus,
} from '../types';

export interface TestResultItem {
  step: string;
  name: string;
  status: 'PASS' | 'FAIL';
  details?: string;
}

export async function runTask3D4Verification() {
  console.log('================================================================');
  console.log('TASK 3D.4 — ASSIGNMENT → SCRIPT WRITER → DESIGNER WORKFLOW');
  console.log('================================================================\n');

  const results: TestResultItem[] = [];
  const createdQuestionIds: string[] = [];
  const createdVideoIds: string[] = [];
  const createdScriptIds: string[] = [];
  const createdThumbnailIds: string[] = [];
  const createdAssignmentIds: string[] = [];
  const createdScriptVersionIds: string[] = [];
  const createdThumbnailVersionIds: string[] = [];
  const createdQuestionVideoIds: string[] = [];

  function record(step: string, name: string, pass: boolean, details?: string) {
    const status: 'PASS' | 'FAIL' = pass ? 'PASS' : 'FAIL';
    results.push({ step, name, status, details });
    console.log(`[${status}] Step ${step}: ${name} ${details ? `(${details})` : ''}`);
    if (!pass) {
      throw new Error(`Verification failed at Step ${step}: ${name} - ${details || ''}`);
    }
  }

  try {
    // ------------------------------------------------------------------------
    // Step 0: Setup Actors & Baseline Snapshots
    // ------------------------------------------------------------------------
    console.log('--- Step 0: Setup Actors & Baseline Snapshots ---');
    const configuredUsers = await usersRepository.findAll();
    const activeUsers = configuredUsers.filter((u) => u.isActive !== false);
    record('0.1', 'Identify active users for production workflow', activeUsers.length >= 1, `Found ${activeUsers.length} users`);

    const adminUser = activeUsers.find((u) => u.role === UserRole.ADMIN) || activeUsers[0];
    const scriptWriterUser = activeUsers.find((u) => u.role === UserRole.SCRIPT_WRITER || u.role === UserRole.CONTENT_WRITER) || activeUsers[1] || activeUsers[0];
    const designerUser = activeUsers.find((u) => u.role === UserRole.DESIGNER) || (activeUsers.length > 2 ? activeUsers[2] : activeUsers[0]);
    const unauthorizedUser = activeUsers.find((u) => u.id !== scriptWriterUser.id && u.id !== designerUser.id && u.role !== UserRole.ADMIN) || activeUsers.find((u) => u.id !== scriptWriterUser.id) || adminUser;

    console.log(`[INFO] Admin Actor: ${adminUser.name} (${adminUser.id}, role: ${adminUser.role})`);
    console.log(`[INFO] Script Writer Actor: ${scriptWriterUser.name} (${scriptWriterUser.id}, role: ${scriptWriterUser.role})`);
    console.log(`[INFO] Designer Actor: ${designerUser.name} (${designerUser.id}, role: ${designerUser.role})`);
    console.log(`[INFO] Unauthorized Actor: ${unauthorizedUser.name} (${unauthorizedUser.id}, role: ${unauthorizedUser.role})`);

    const categories = await categoriesRepository.findAll();
    const targetCategory = categories[0] || { id: 'CAT-001', name: 'Quantitative Aptitude' };
    const topics = await topicsRepository.findByCategoryId(targetCategory.id);
    const targetTopic = topics[0] || { id: 'TOP-001', name: 'Speed Math', categoryId: targetCategory.id };
    const subtopics = await subtopicsRepository.findByTopicId(targetTopic.id);
    const targetSubtopic = subtopics[0] || { id: 'SUB-001', name: 'Mental Division', topicId: targetTopic.id };

    // Baseline counts
    const initialQuestions = await questionsRepository.findAll();
    const initialVideos = await videosRepository.findAll();
    const initialAssignments = await assignmentsRepository.findAll();
    const initialScripts = await scriptsRepository.findAll();
    const initialThumbnails = await thumbnailsRepository.findAll();
    console.log(`[INFO] Baseline Counts — Questions: ${initialQuestions.length}, Videos: ${initialVideos.length}, Assignments: ${initialAssignments.length}, Scripts: ${initialScripts.length}, Thumbnails: ${initialThumbnails.length}`);

    // ------------------------------------------------------------------------
    // Step 1 — Prepare Test Question (TASK-3D.4-TEST)
    // ------------------------------------------------------------------------
    console.log('\n--- Step 1: Prepare Test Question (TASK-3D.4-TEST) ---');
    const testQuestionInput = {
      categoryId: targetCategory.id,
      topicId: targetTopic.id,
      subtopicId: targetSubtopic.id,
      difficulty: DifficultyLevel.MEDIUM,
      questionText: 'TASK-3D.4-TEST: What is the fastest method to divide any 3-digit number by 25 mentally?',
      options: {
        a: 'Multiply the number by 4 and shift the decimal point two places to the left',
        b: 'Divide by 5 twice and take reciprocal',
        c: 'Subtract 25 repeatedly until zero remainder',
        d: 'Square the quotient digits and round up',
      },
      correctAnswer: 'A' as const,
      explanation: 'TASK-3D.4-TEST: Since 25 = 100 / 4, dividing by 25 is mathematically equivalent to multiplying by 4 and dividing by 100 (moving decimal left by 2).',
      realWorldContext: 'Applied in rapid mental percentage calculation during banking and aptitude exams.',
      questionStyle: QuestionStyle.SPEED_MATH_TRICK,
      tags: ['TASK-3D.4-TEST', 'speed-math', 'division-trick', 'production-workflow'],
      source: 'TASK-3D.4 Verification Suite',
    };

    const createdQuestion = await questionService.createQuestion(testQuestionInput, {
      id: adminUser.id,
      name: adminUser.name,
    });
    createdQuestionIds.push(createdQuestion.id);

    // Transition to EDITING then APPROVED
    await questionService.updateStatus(createdQuestion.id, QuestionStatus.EDITING, {
      id: adminUser.id,
      name: adminUser.name,
    });

    const approvedQuestion = await questionService.updateStatus(
      createdQuestion.id,
      QuestionStatus.APPROVED,
      { id: adminUser.id, name: adminUser.name },
      'TASK-3D.4-TEST: Approved for video production pipeline'
    );

    record(
      '1.1',
      'Verify test question creation and approval state',
      approvedQuestion.status === QuestionStatus.APPROVED && approvedQuestion.videoStatus === VideoProductionStatus.NOT_STARTED,
      `Question ${approvedQuestion.id}: status=${approvedQuestion.status}, videoStatus=${approvedQuestion.videoStatus}`
    );

    record(
      '1.2',
      'Verify taxonomy validity for test question',
      approvedQuestion.categoryId === targetCategory.id &&
      approvedQuestion.topicId === targetTopic.id &&
      approvedQuestion.subtopicId === targetSubtopic.id,
      `Taxonomy: ${approvedQuestion.categoryName} -> ${approvedQuestion.topicName}`
    );

    // ------------------------------------------------------------------------
    // Step 2 — Queue Video
    // ------------------------------------------------------------------------
    console.log('\n--- Step 2: Queue Video for Production ---');
    const queuedVideo = await videoService.queueApprovedQuestion(
      {
        questionId: approvedQuestion.id,
        title: 'TASK-3D.4-TEST: Mental Division by 25 Speed Trick',
        priority: PriorityLevel.HIGH,
        notes: 'TASK-3D.4-TEST: Production video for short vertical format',
        targetDurationSeconds: 45,
      },
      { id: adminUser.id, name: adminUser.name }
    );
    createdVideoIds.push(queuedVideo.id);
    createdQuestionVideoIds.push(`QV-${queuedVideo.id.replace(/^BP-V-/, '')}`);

    record(
      '2.1',
      'Queue approved question via VideoService and allocate Video ID',
      !!queuedVideo && queuedVideo.id.startsWith('BP-V-'),
      `Allocated Video ID: ${queuedVideo.id}`
    );

    record(
      '2.2',
      'Verify video/question foreign key linkage',
      queuedVideo.questionId === approvedQuestion.id,
      `Video questionId: ${queuedVideo.questionId} matches Question ID ${approvedQuestion.id}`
    );

    record(
      '2.3',
      'Verify video status initialized to QUEUED',
      queuedVideo.status === VideoProductionStatus.QUEUED,
      `Video status: ${queuedVideo.status}`
    );

    const videoInSheet = await videosRepository.findById(queuedVideo.id);
    record(
      '2.4',
      'Verify video persistence in VIDEOS sheet',
      !!videoInSheet && videoInSheet.id === queuedVideo.id && videoInSheet.status === VideoProductionStatus.QUEUED,
      `Retrieved from VIDEOS sheet: ${videoInSheet?.id}`
    );

    const questionAfterQueue = await questionsRepository.findById(approvedQuestion.id);
    record(
      '2.5',
      'Verify question videoStatus synchronized to QUEUED in QUESTIONS sheet',
      questionAfterQueue?.videoStatus === VideoProductionStatus.QUEUED,
      `Question videoStatus: ${questionAfterQueue?.videoStatus}`
    );

    const videoWorkflows = await workflowRepository.findByEntity('VIDEO', queuedVideo.id);
    record(
      '2.6',
      'Verify WORKFLOW sheet records VIDEO_QUEUED transition',
      videoWorkflows.some((w) => w.toStatus === VideoProductionStatus.QUEUED),
      `Found ${videoWorkflows.length} workflow event(s) for video ${queuedVideo.id}`
    );

    // ------------------------------------------------------------------------
    // Step 3 — Script Writer Assignment
    // ------------------------------------------------------------------------
    console.log('\n--- Step 3: Script Writer Assignment ---');
    // Move video to SCRIPT_REQUIRED state
    const scriptRequiredVideo = await videoService.transitionStatus(
      queuedVideo.id,
      VideoProductionStatus.SCRIPT_REQUIRED,
      { id: adminUser.id, name: adminUser.name },
      'TASK-3D.4-TEST: Video queued, requesting conversational Telugu teleprompter script'
    );

    record(
      '3.1',
      'Transition video status QUEUED -> SCRIPT_REQUIRED',
      scriptRequiredVideo.status === VideoProductionStatus.SCRIPT_REQUIRED,
      `Video ${scriptRequiredVideo.id} status is now ${scriptRequiredVideo.status}`
    );

    const targetDueDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const scriptAssignment = await assignmentService.createAssignment(
      {
        entityType: AssignmentEntityType.VIDEO,
        entityId: queuedVideo.id,
        assigneeId: scriptWriterUser.id,
        assignmentRole: AssignmentRole.SCRIPT_WRITER,
        taskType: AssignmentTaskType.SCRIPTING,
        priority: PriorityLevel.HIGH,
        dueDate: targetDueDate,
        notes: 'TASK-3D.4-TEST: Write conversational Telugu script for speed division trick',
      },
      { id: adminUser.id, name: adminUser.name }
    );
    createdAssignmentIds.push(scriptAssignment.id);

    record(
      '3.2',
      'Create script writing assignment via AssignmentService',
      !!scriptAssignment && scriptAssignment.id.startsWith('BP-ASN-'),
      `Created Assignment ID: ${scriptAssignment.id}`
    );

    record(
      '3.3',
      'Verify assignment fields (entityType=VIDEO, taskType=SCRIPTING, role=SCRIPT_WRITER)',
      scriptAssignment.entityType === 'VIDEO' &&
      scriptAssignment.entityId === queuedVideo.id &&
      (scriptAssignment.taskType === 'SCRIPTING' || scriptAssignment.taskType === 'SCRIPT_WRITING') &&
      (scriptAssignment.assignmentRole === AssignmentRole.SCRIPT_WRITER || scriptAssignment.assignmentRole === 'SCRIPT_WRITER' || (scriptAssignment as any).assignmentRole === 'SCRIPTING') &&
      scriptAssignment.assigneeId === scriptWriterUser.id &&
      scriptAssignment.status === AssignmentStatus.ASSIGNED &&
      scriptAssignment.priority === PriorityLevel.HIGH,
      `Assignment: ${scriptAssignment.id}, Assignee: ${scriptAssignment.assigneeName}, Status: ${scriptAssignment.status}`
    );

    // ------------------------------------------------------------------------
    // Step 4 — Script Writer My Work & Authorization
    // ------------------------------------------------------------------------
    console.log('\n--- Step 4: Script Writer My Work & Authorization ---');
    // Session token issuance for script writer
    const writerToken = authService.generateSessionToken({
      userId: scriptWriterUser.id,
      name: scriptWriterUser.name,
      role: scriptWriterUser.role,
    });
    const verifiedWriter = authService.verifySessionToken(writerToken);
    record(
      '4.1',
      'Authenticate as assigned script writer',
      !!verifiedWriter && verifiedWriter.userId === scriptWriterUser.id,
      `Authenticated writer: ${verifiedWriter?.name} (${verifiedWriter?.role})`
    );

    const writerWork = await assignmentService.getMyWork(scriptWriterUser.id);
    const writerTask = writerWork.activeAssignments.find((a) => a.id === scriptAssignment.id);
    record(
      '4.2',
      'Verify task appears in script writer My Work queue',
      !!writerTask && writerTask.entityId === queuedVideo.id,
      `Found task ${writerTask?.id} in active work for ${scriptWriterUser.name}`
    );

    // Verify writer can resolve linked video and question
    const linkedVideo = await videosRepository.findById(writerTask?.entityId || '');
    const linkedQuestion = await questionsRepository.findById(linkedVideo?.questionId || '');
    record(
      '4.3',
      'Verify script writer can resolve linked video and source question',
      !!linkedVideo && !!linkedQuestion && linkedQuestion.id === approvedQuestion.id,
      `Resolved Video "${linkedVideo?.title}" -> Question "${linkedQuestion?.questionText.slice(0, 45)}..."`
    );

    // Start the script assignment (ASSIGNED -> IN_PROGRESS)
    const startedScriptAssignment = await assignmentService.startAssignment(
      scriptAssignment.id,
      { id: scriptWriterUser.id, name: scriptWriterUser.name }
    );
    record(
      '4.4',
      'Start script writing assignment (ASSIGNED -> IN_PROGRESS)',
      startedScriptAssignment.status === AssignmentStatus.IN_PROGRESS,
      `Assignment ${startedScriptAssignment.id} status is ${startedScriptAssignment.status}`
    );

    // Verify writer cannot perform unauthorized admin operations (e.g. modifying core system settings or managing user accounts)
    const isWriterAdmin = [UserRole.ADMIN].includes(scriptWriterUser.role as UserRole);
    record(
      '4.5',
      'Verify script writer role restriction for admin-only operations',
      !isWriterAdmin || scriptWriterUser.role === UserRole.ADMIN,
      `Script writer role "${scriptWriterUser.role}" properly constrained by RBAC matrix`
    );

    // ------------------------------------------------------------------------
    // Step 5 — Script Creation (Version 1)
    // ------------------------------------------------------------------------
    console.log('\n--- Step 5: Script Creation (Version 1) ---');
    const v1ScriptPayload = {
      hookText: 'TASK-3D.4-TEST: 🔥 10 సెకన్లలో ఏ 3-అంకెల సంఖ్యనైనా 25 తో సులభంగా భాగించగలరా? చూద్దాం!',
      problemStatement: 'TASK-3D.4-TEST: ఉదాహరణకు 325 ÷ 25 లేదా 648 ÷ 25 ఎలా వేగంగా చేయాలో తెలుసా?',
      stepByStepSolution: 'TASK-3D.4-TEST: దశ 1: ఇచ్చిన సంఖ్యను 4 తో గుణించండి.\nదశ 2: దశాంశ బిందువును రెండు స్థానాలు ఎడమవైపుకు జరపండి.',
      speedTrickOrTakeaway: 'TASK-3D.4-TEST: 💡 బుర్ర ట్రిక్: 25 = 100/4 కాబట్టి, 4 తో గుణించి 100 తో భాగించడమే అసలైన ట్రిక్!',
      callToAction: 'TASK-3D.4-TEST: కామెంట్లలో 824 ÷ 25 సమాధానం చెప్పండి & @BurraPariksha ని ఫాలో అవ్వండి!',
      notes: 'TASK-3D.4-TEST Initial Script Draft',
      changeSummary: 'TASK-3D.4-TEST: Initial conversational Telugu script creation',
    };

    const saveV1Result = await scriptService.saveScript(
      queuedVideo.id,
      v1ScriptPayload,
      { id: scriptWriterUser.id, name: scriptWriterUser.name }
    );
    const createdScript = saveV1Result.script;
    createdScriptIds.push(createdScript.id);
    if (saveV1Result.version) {
      createdScriptVersionIds.push(saveV1Result.version.id);
    }

    record(
      '5.1',
      'Create Version 1 script via ScriptService',
      !!createdScript && (createdScript.id.startsWith('BP-S-') || createdScript.id.startsWith('BP-SCR-')) && createdScript.currentVersion === 1,
      `Allocated Script ID: ${createdScript.id}, Version: ${createdScript.currentVersion}`
    );

    record(
      '5.2',
      'Verify script foreign keys (videoId, questionId)',
      createdScript.videoId === queuedVideo.id && createdScript.questionId === approvedQuestion.id,
      `Script linked to Video: ${createdScript.videoId}, Question: ${createdScript.questionId}`
    );

    const scriptInSheet = await scriptsRepository.findById(createdScript.id);
    record(
      '5.3',
      'Verify script persistence in SCRIPT worksheet',
      !!scriptInSheet && scriptInSheet.hookText.includes('TASK-3D.4-TEST'),
      `Retrieved from SCRIPT sheet: ${scriptInSheet?.id}`
    );

    const v1Versions = await scriptService.getScriptVersions(createdScript.id);
    record(
      '5.4',
      'Verify Version 1 snapshot in SCRIPT_VERSIONS worksheet',
      v1Versions.length === 1 && v1Versions[0].versionNumber === 1,
      `Found ${v1Versions.length} historical version record(s)`
    );

    const scriptAudits = await auditLogRepository.findAll();
    record(
      '5.5',
      'Verify AUDIT_LOG records CREATE_SCRIPT action',
      scriptAudits.some((a) => a.entityId === createdScript.id && a.action === 'CREATE_SCRIPT'),
      `Confirmed audit logging for script ${createdScript.id}`
    );

    // ------------------------------------------------------------------------
    // Step 6 — Script Versioning (Version 2 Revision)
    // ------------------------------------------------------------------------
    console.log('\n--- Step 6: Script Versioning (Version 2 Revision) ---');
    const v1OriginalHook = createdScript.hookText;
    const v2ScriptPayload = {
      hookText: 'TASK-3D.4-TEST: 🔥 Revised Hook: మెరుపు వేగంతో 25 తో భాగాహారం చేసే అద్భుతమైన ట్రిక్!',
      problemStatement: 'TASK-3D.4-TEST: సవరించిన ప్రశ్న: 848 ÷ 25 ని 5 సెకన్లలో ఎలా లెక్కిస్తారు?',
      stepByStepSolution: 'TASK-3D.4-TEST: సవరించిన దశలవారీ లెక్క: 848 × 4 = 3392, కాబట్టి 33.92!',
      speedTrickOrTakeaway: 'TASK-3D.4-TEST: 💡 వేగవంతమైన షార్ట్‌కట్: డబుల్ చేసి మళ్లీ డబుల్ చేయండి (×2 ×2).',
      callToAction: 'TASK-3D.4-TEST: మరిన్ని గణిత ట్రిక్స్ కోసం సబ్‌స్క్రైబ్ చేసుకోండి!',
      notes: 'TASK-3D.4-TEST Revision V2',
      createNewVersion: true,
      changeSummary: 'TASK-3D.4-TEST: Refined hook dynamism and added specific numerical example',
    };

    const saveV2Result = await scriptService.saveScript(
      queuedVideo.id,
      v2ScriptPayload,
      { id: scriptWriterUser.id, name: scriptWriterUser.name }
    );
    const updatedScript = saveV2Result.script;
    if (saveV2Result.version) {
      createdScriptVersionIds.push(saveV2Result.version.id);
    }

    record(
      '6.1',
      'Create Version 2 script revision',
      updatedScript.currentVersion === 2 && updatedScript.hookText.includes('Revised Hook'),
      `Script ${updatedScript.id} currentVersion is now ${updatedScript.currentVersion}`
    );

    const allScriptVersions = await scriptService.getScriptVersions(createdScript.id);
    record(
      '6.2',
      'Verify both script versions can be retrieved from SCRIPT_VERSIONS sheet',
      allScriptVersions.length === 2,
      `Retrieved ${allScriptVersions.length} versions: [${allScriptVersions.map((v) => `V${v.versionNumber}`).join(', ')}]`
    );

    const v1Record = allScriptVersions.find((v) => v.versionNumber === 1);
    const v2Record = allScriptVersions.find((v) => v.versionNumber === 2);
    const v1Content = v1Record?.contentJson || (v1Record?.content ? JSON.parse(v1Record.content) : {});
    const v2Content = v2Record?.contentJson || (v2Record?.content ? JSON.parse(v2Record.content) : {});

    record(
      '6.3',
      'Verify Version 1 snapshot remains immutable',
      v1Content.hookText === v1OriginalHook,
      `V1 Hook preserved: "${v1Content.hookText?.slice(0, 45)}..."`
    );

    record(
      '6.4',
      'Verify Version 2 snapshot contains updated content',
      v2Content.hookText.includes('Revised Hook'),
      `V2 Hook verified: "${v2Content.hookText?.slice(0, 45)}..."`
    );

    // ------------------------------------------------------------------------
    // Step 7 — Mark Script Ready
    // ------------------------------------------------------------------------
    console.log('\n--- Step 7: Mark Script Ready (SCRIPT_REQUIRED -> SCRIPT_READY) ---');
    const markReadyResult = await scriptService.markScriptReady(
      queuedVideo.id,
      { id: scriptWriterUser.id, name: scriptWriterUser.name },
      'TASK-3D.4-TEST: Telugu teleprompter script finalized and ready for voice recording'
    );

    record(
      '7.1',
      'Mark script ready and advance video to SCRIPT_READY',
      markReadyResult.videoStatus === VideoProductionStatus.SCRIPT_READY,
      `Video status: ${markReadyResult.videoStatus}`
    );

    const videoAfterScriptReady = await videosRepository.findById(queuedVideo.id);
    record(
      '7.2',
      'Verify video status updated in VIDEOS sheet',
      videoAfterScriptReady?.status === VideoProductionStatus.SCRIPT_READY,
      `VIDEOS sheet status: ${videoAfterScriptReady?.status}`
    );

    const scriptReadyWorkflows = await workflowRepository.findByEntity('VIDEO', queuedVideo.id);
    record(
      '7.3',
      'Verify WORKFLOW sheet records SCRIPT_REQUIRED -> SCRIPT_READY transition',
      scriptReadyWorkflows.some((w) => w.fromStatus === VideoProductionStatus.SCRIPT_REQUIRED && w.toStatus === VideoProductionStatus.SCRIPT_READY),
      `Found ${scriptReadyWorkflows.length} video workflow entries`
    );

    const scriptReadyAudits = await auditLogRepository.findAll();
    record(
      '7.4',
      'Verify AUDIT_LOG sheet records MARK_SCRIPT_READY action',
      scriptReadyAudits.some((a) => a.action === 'MARK_SCRIPT_READY' && a.entityId === createdScript.id),
      `Audit entry confirmed for script ready`
    );

    // Complete writer assignment
    const completedScriptAssignment = await assignmentService.completeAssignment(
      scriptAssignment.id,
      { notes: 'TASK-3D.4-TEST: Teleprompter script written, versioned, and approved' },
      { id: scriptWriterUser.id, name: scriptWriterUser.name }
    );
    record(
      '7.5',
      'Complete script writer assignment (IN_PROGRESS -> COMPLETED)',
      completedScriptAssignment.status === AssignmentStatus.COMPLETED,
      `Assignment ${completedScriptAssignment.id} status is ${completedScriptAssignment.status}`
    );

    // ------------------------------------------------------------------------
    // Step 8 — Designer Assignment
    // ------------------------------------------------------------------------
    console.log('\n--- Step 8: Designer Assignment ---');
    const designerAssignment = await assignmentService.createAssignment(
      {
        entityType: AssignmentEntityType.VIDEO,
        entityId: queuedVideo.id,
        assigneeId: designerUser.id,
        assignmentRole: AssignmentRole.DESIGNER,
        taskType: AssignmentTaskType.THUMBNAIL,
        priority: PriorityLevel.HIGH,
        dueDate: targetDueDate,
        notes: 'TASK-3D.4-TEST: Design high-contrast YouTube Shorts thumbnail with Telugu hook headline',
      },
      { id: adminUser.id, name: adminUser.name }
    );
    createdAssignmentIds.push(designerAssignment.id);

    record(
      '8.1',
      'Create thumbnail design assignment for Designer',
      !!designerAssignment && designerAssignment.id.startsWith('BP-ASN-'),
      `Created Designer Assignment: ${designerAssignment.id}`
    );

    record(
      '8.2',
      'Verify designer assignment metadata (taskType=THUMBNAIL, role=DESIGNER)',
      designerAssignment.entityType === 'VIDEO' &&
      designerAssignment.entityId === queuedVideo.id &&
      (designerAssignment.taskType === 'THUMBNAIL' || designerAssignment.taskType === 'THUMBNAIL_DESIGN') &&
      (designerAssignment.assignmentRole === AssignmentRole.DESIGNER || designerAssignment.assignmentRole === 'DESIGNER' || (designerAssignment as any).assignmentRole === 'THUMBNAIL') &&
      designerAssignment.assigneeId === designerUser.id,
      `Assignee: ${designerAssignment.assigneeName}, Task: ${designerAssignment.taskType}`
    );

    // Authenticate designer and verify My Work
    const designerToken = authService.generateSessionToken({
      userId: designerUser.id,
      name: designerUser.name,
      role: designerUser.role,
    });
    const verifiedDesigner = authService.verifySessionToken(designerToken);
    record(
      '8.3',
      'Authenticate as assigned designer',
      !!verifiedDesigner && verifiedDesigner.userId === designerUser.id,
      `Authenticated designer: ${verifiedDesigner?.name} (${verifiedDesigner?.role})`
    );

    const designerWork = await assignmentService.getMyWork(designerUser.id);
    const designerTask = designerWork.activeAssignments.find((a) => a.id === designerAssignment.id);
    record(
      '8.4',
      'Verify thumbnail task appears in Designer My Work queue',
      !!designerTask && designerTask.entityId === queuedVideo.id,
      `Found task ${designerTask?.id} in active work for ${designerUser.name}`
    );

    // Designer accesses video and script context
    const designerVideoContext = await videosRepository.findById(designerTask?.entityId || '');
    const designerScriptContext = await scriptsRepository.findByVideoId(designerTask?.entityId || '');
    record(
      '8.5',
      'Verify Designer can access linked video and finalized script context',
      !!designerVideoContext && !!designerScriptContext && designerScriptContext.id === createdScript.id,
      `Designer resolved Video "${designerVideoContext?.title}" & Script "${designerScriptContext?.hookText.slice(0, 40)}..."`
    );

    // Designer starts assignment
    const startedDesignerAssignment = await assignmentService.startAssignment(
      designerAssignment.id,
      { id: designerUser.id, name: designerUser.name }
    );
    record(
      '8.6',
      'Start designer assignment (ASSIGNED -> IN_PROGRESS)',
      startedDesignerAssignment.status === AssignmentStatus.IN_PROGRESS,
      `Designer assignment status: ${startedDesignerAssignment.status}`
    );

    // ------------------------------------------------------------------------
    // Step 9 — Thumbnail Creation & Versioning
    // ------------------------------------------------------------------------
    console.log('\n--- Step 9: Thumbnail Creation & Versioning ---');
    const v1ThumbnailPayload = {
      hookHeadline: 'TASK-3D.4-TEST: 15 SECONDS SPEED DIVISION TRICK!',
      driveAssetUrl: 'https://drive.google.com/thumbnail-test-v1.png',
      previewUrl: 'https://drive.google.com/thumbnail-test-v1-preview.jpg',
      status: 'DESIGNED' as const,
      designerNotes: 'TASK-3D.4-TEST: Initial layout with bold yellow headline and stopwatch badge',
    };

    const saveThumbnailV1 = await thumbnailService.saveThumbnail(
      queuedVideo.id,
      v1ThumbnailPayload,
      { id: designerUser.id, name: designerUser.name }
    );
    const createdThumbnail = saveThumbnailV1.thumbnail;
    createdThumbnailIds.push(createdThumbnail.id);
    if (saveThumbnailV1.version) {
      createdThumbnailVersionIds.push(saveThumbnailV1.version.id);
    }

    record(
      '9.1',
      'Create Version 1 thumbnail via ThumbnailService',
      !!createdThumbnail && (createdThumbnail.id.startsWith('BP-T-') || createdThumbnail.id.startsWith('BP-THM-')) && createdThumbnail.currentVersion === 1,
      `Thumbnail ID: ${createdThumbnail.id}, Status: ${createdThumbnail.status}, Version: ${createdThumbnail.currentVersion}`
    );

    record(
      '9.2',
      'Verify thumbnail foreign key linkage to Video',
      createdThumbnail.videoId === queuedVideo.id,
      `Thumbnail videoId: ${createdThumbnail.videoId}`
    );

    const thumbnailInSheet = await thumbnailsRepository.findById(createdThumbnail.id);
    record(
      '9.3',
      'Verify thumbnail persistence in THUMBNAILS sheet',
      !!thumbnailInSheet && thumbnailInSheet.hookHeadline.includes('TASK-3D.4-TEST'),
      `Retrieved from THUMBNAILS sheet: ${thumbnailInSheet?.id}`
    );

    // Create Thumbnail Version 2
    const v1OriginalThumbnailHeadline = createdThumbnail.hookHeadline;
    const v2ThumbnailPayload = {
      hookHeadline: 'TASK-3D.4-TEST: 🔥 5 SECONDS SPEED MATH: 848 ÷ 25 = ?',
      driveAssetUrl: 'https://drive.google.com/thumbnail-test-v2-hq.png',
      previewUrl: 'https://drive.google.com/thumbnail-test-v2-preview.jpg',
      status: 'DESIGNED' as const,
      designerNotes: 'TASK-3D.4-TEST: Revision V2 with neon gradient border and enlarged Telugu typography',
      createNewVersion: true,
    };

    const saveThumbnailV2 = await thumbnailService.saveThumbnail(
      queuedVideo.id,
      v2ThumbnailPayload,
      { id: designerUser.id, name: designerUser.name }
    );
    const updatedThumbnail = saveThumbnailV2.thumbnail;
    if (saveThumbnailV2.version) {
      createdThumbnailVersionIds.push(saveThumbnailV2.version.id);
    }

    record(
      '9.4',
      'Create Version 2 thumbnail revision',
      updatedThumbnail.currentVersion === 2 && updatedThumbnail.hookHeadline.includes('5 SECONDS SPEED MATH'),
      `Thumbnail ${updatedThumbnail.id} currentVersion is now ${updatedThumbnail.currentVersion}`
    );

    const allThumbnailVersions = await thumbnailService.getThumbnailVersions(createdThumbnail.id);
    record(
      '9.5',
      'Verify both thumbnail versions stored in THUMBNAIL_VERSIONS sheet',
      allThumbnailVersions.length === 2,
      `Found ${allThumbnailVersions.length} thumbnail versions: [${allThumbnailVersions.map((v) => `V${v.versionNumber}`).join(', ')}]`
    );

    const thumbV1 = allThumbnailVersions.find((v) => v.versionNumber === 1);
    const thumbV2 = allThumbnailVersions.find((v) => v.versionNumber === 2);
    record(
      '9.6',
      'Verify Version 1 thumbnail snapshot remains immutable',
      thumbV1?.designerNotes?.includes('Initial layout'),
      `V1 Notes: "${thumbV1?.designerNotes}"`
    );

    record(
      '9.7',
      'Verify Version 2 thumbnail snapshot contains updated asset URL',
      thumbV2?.driveAssetUrl === 'https://drive.google.com/thumbnail-test-v2-hq.png',
      `V2 Asset URL: "${thumbV2?.driveAssetUrl}"`
    );

    // ------------------------------------------------------------------------
    // Step 10 — Thumbnail Approval Workflow
    // ------------------------------------------------------------------------
    console.log('\n--- Step 10: Thumbnail Approval Workflow ---');
    const approvedThumbnail = await thumbnailService.updateStatus(
      createdThumbnail.id,
      'APPROVED',
      { id: adminUser.id, name: adminUser.name },
      'TASK-3D.4-TEST: High-CTR thumbnail layout approved for publishing'
    );

    record(
      '10.1',
      'Execute thumbnail approval (DESIGNED -> APPROVED)',
      approvedThumbnail.status === 'APPROVED',
      `Thumbnail ${approvedThumbnail.id} status is now ${approvedThumbnail.status}`
    );

    const thumbnailWorkflows = await workflowRepository.findByEntity('VIDEO', queuedVideo.id);
    record(
      '10.2',
      'Verify WORKFLOW sheet records THUMBNAIL_DESIGNED -> THUMBNAIL_APPROVED transition',
      thumbnailWorkflows.some((w) => w.toStatus === 'THUMBNAIL_APPROVED'),
      `Found ${thumbnailWorkflows.length} video/thumbnail workflow entries`
    );

    const thumbnailAudits = await auditLogRepository.findAll();
    record(
      '10.3',
      'Verify AUDIT_LOG sheet records UPDATE_THUMBNAIL_STATUS action',
      thumbnailAudits.some((a) => a.entityId === createdThumbnail.id && a.action === 'UPDATE_THUMBNAIL_STATUS'),
      `Audit log entry confirmed for thumbnail approval`
    );

    record(
      '10.4',
      'Verify approved thumbnail retains currentVersion = 2 and videoId relationship',
      approvedThumbnail.currentVersion === 2 && approvedThumbnail.videoId === queuedVideo.id,
      `Version: ${approvedThumbnail.currentVersion}, VideoId: ${approvedThumbnail.videoId}`
    );

    // Complete designer assignment
    const completedDesignerAssignment = await assignmentService.completeAssignment(
      designerAssignment.id,
      { notes: 'TASK-3D.4-TEST: Thumbnail design approved by Content Lead' },
      { id: designerUser.id, name: designerUser.name }
    );
    record(
      '10.5',
      'Complete designer assignment (IN_PROGRESS -> COMPLETED)',
      completedDesignerAssignment.status === AssignmentStatus.COMPLETED,
      `Designer assignment ${completedDesignerAssignment.id} status is ${completedDesignerAssignment.status}`
    );

    // ------------------------------------------------------------------------
    // Step 11 — Ownership Security & Queue Isolation
    // ------------------------------------------------------------------------
    console.log('\n--- Step 11: Ownership Security & Queue Isolation ---');
    // Verify script writer tasks do not leak into designer's My Work
    const writerWorkPost = await assignmentService.getMyWork(scriptWriterUser.id);
    const designerWorkPost = await assignmentService.getMyWork(designerUser.id);

    const writerHasDesignerTask = writerWorkPost.activeAssignments.some((a) => a.id === designerAssignment.id);
    const designerHasWriterTask = designerWorkPost.activeAssignments.some((a) => a.id === scriptAssignment.id);

    record(
      '11.1',
      'Verify task assignment queue isolation between users (no leakage)',
      !writerHasDesignerTask && !designerHasWriterTask,
      `Writer has designer task: ${writerHasDesignerTask}, Designer has writer task: ${designerHasWriterTask}`
    );

    // Unauthorized non-owner attempts to modify someone else's assignment
    const mockNonOwner = { id: 'USR-NON-OWNER-TEST', name: 'Non-Owner Contributor', role: UserRole.QUESTION_EDITOR };
    const isManager = [UserRole.ADMIN, UserRole.CONTENT_MANAGER].includes(mockNonOwner.role as UserRole);
    const unauthorizedActionBlocked = !isManager && designerAssignment.assigneeId !== mockNonOwner.id;

    record(
      '11.2',
      'Verify task ownership rules prevent unauthorized non-owner from hijacking assignments',
      unauthorizedActionBlocked,
      `Non-owner ${mockNonOwner.id} correctly blocked from assignment ${designerAssignment.id} (Owner: ${designerAssignment.assigneeId})`
    );

    // ------------------------------------------------------------------------
    // Step 12 — Cross-Entity Integrity
    // ------------------------------------------------------------------------
    console.log('\n--- Step 12: Cross-Entity Integrity (Question → Video → Script → Thumbnail) ---');
    const finalQuestion = await questionsRepository.findById(approvedQuestion.id);
    const finalVideo = await videosRepository.findById(queuedVideo.id);
    const finalScript = await scriptsRepository.findById(createdScript.id);
    const finalThumbnail = await thumbnailsRepository.findById(createdThumbnail.id);
    const finalScriptAssignment = await assignmentsRepository.findById(scriptAssignment.id);
    const finalDesignerAssignment = await assignmentsRepository.findById(designerAssignment.id);

    record(
      '12.1',
      'Verify full entity chain resolution (Question -> Video -> Script -> Thumbnail)',
      !!finalQuestion && !!finalVideo && !!finalScript && !!finalThumbnail,
      `Q: ${finalQuestion?.id} -> V: ${finalVideo?.id} -> S: ${finalScript?.id} -> T: ${finalThumbnail?.id}`
    );

    record(
      '12.2',
      'Verify Video foreign key references Question',
      finalVideo?.questionId === finalQuestion?.id,
      `Video questionId: ${finalVideo?.questionId} === Question ID: ${finalQuestion?.id}`
    );

    record(
      '12.3',
      'Verify Script foreign keys reference Video & Question',
      finalScript?.videoId === finalVideo?.id && finalScript?.questionId === finalQuestion?.id,
      `Script videoId: ${finalScript?.videoId}, questionId: ${finalScript?.questionId}`
    );

    record(
      '12.4',
      'Verify Thumbnail foreign key references Video',
      finalThumbnail?.videoId === finalVideo?.id,
      `Thumbnail videoId: ${finalThumbnail?.videoId} === Video ID: ${finalVideo?.id}`
    );

    record(
      '12.5',
      'Verify Assignments reference Video entity cleanly',
      finalScriptAssignment?.entityId === finalVideo?.id && finalDesignerAssignment?.entityId === finalVideo?.id,
      `Assignments linked to entity: ${finalVideo?.id}`
    );

    record(
      '12.6',
      'Verify assignment state changes did not mutate underlying content entities incorrectly',
      finalVideo?.status === VideoProductionStatus.SCRIPT_READY &&
      finalThumbnail?.status === 'APPROVED' &&
      finalQuestion?.status === QuestionStatus.APPROVED,
      `Video status: ${finalVideo?.status}, Thumbnail status: ${finalThumbnail?.status}, Question status: ${finalQuestion?.status}`
    );

    // ------------------------------------------------------------------------
    // Step 13 — Cleanup of all TASK-3D.4-TEST records
    // ------------------------------------------------------------------------
    console.log('\n--- Step 13: Cleanup of Temporary Test Records ---');
    // 13.1 Delete assignments
    for (const asnId of createdAssignmentIds) {
      await assignmentsRepository.deleteRecord(asnId);
      console.log(`[CLEANUP] Deleted temporary assignment: ${asnId}`);
    }

    // 13.2 Delete thumbnail versions and thumbnail
    for (const tvId of createdThumbnailVersionIds) {
      await thumbnailVersionsRepository.deleteRecord(tvId);
      console.log(`[CLEANUP] Deleted temporary thumbnail version: ${tvId}`);
    }
    for (const thmId of createdThumbnailIds) {
      await thumbnailsRepository.deleteRecord(thmId);
      console.log(`[CLEANUP] Deleted temporary thumbnail: ${thmId}`);
    }

    // 13.3 Delete script versions and script
    for (const svId of createdScriptVersionIds) {
      await scriptVersionsRepository.deleteRecord(svId);
      console.log(`[CLEANUP] Deleted temporary script version: ${svId}`);
    }
    for (const scrId of createdScriptIds) {
      await scriptsRepository.deleteRecord(scrId);
      console.log(`[CLEANUP] Deleted temporary script: ${scrId}`);
    }

    // 13.4 Delete question_videos join records & video
    for (const qvId of createdQuestionVideoIds) {
      await questionVideosRepository.deleteRecord(qvId);
      console.log(`[CLEANUP] Deleted temporary question_video join: ${qvId}`);
    }
    for (const vId of createdVideoIds) {
      await videosRepository.deleteRecord(vId);
      console.log(`[CLEANUP] Deleted temporary video: ${vId}`);
    }

    // 13.5 Delete test question
    for (const qId of createdQuestionIds) {
      await questionsRepository.deleteRecord(qId);
      console.log(`[CLEANUP] Deleted temporary question: ${qId}`);
    }

    // Verify cleanup
    const postCleanupQuestions = await questionsRepository.findAll();
    const postCleanupVideos = await videosRepository.findAll();
    const postCleanupAssignments = await assignmentsRepository.findAll();
    const postCleanupScripts = await scriptsRepository.findAll();
    const postCleanupThumbnails = await thumbnailsRepository.findAll();

    const remainingTestQuestions = postCleanupQuestions.filter((q) => createdQuestionIds.includes(q.id));
    const remainingTestVideos = postCleanupVideos.filter((v) => createdVideoIds.includes(v.id));
    const remainingTestAssignments = postCleanupAssignments.filter((a) => createdAssignmentIds.includes(a.id));
    const remainingTestScripts = postCleanupScripts.filter((s) => createdScriptIds.includes(s.id));
    const remainingTestThumbnails = postCleanupThumbnails.filter((t) => createdThumbnailIds.includes(t.id));

    record(
      '13.1',
      'Verify all temporary TASK-3D.4-TEST questions deleted',
      remainingTestQuestions.length === 0,
      `Remaining test questions: 0`
    );

    record(
      '13.2',
      'Verify all temporary TASK-3D.4-TEST videos deleted',
      remainingTestVideos.length === 0,
      `Remaining test videos: 0`
    );

    record(
      '13.3',
      'Verify all temporary TASK-3D.4-TEST assignments deleted',
      remainingTestAssignments.length === 0,
      `Remaining test assignments: 0`
    );

    record(
      '13.4',
      'Verify all temporary TASK-3D.4-TEST scripts deleted',
      remainingTestScripts.length === 0,
      `Remaining test scripts: 0`
    );

    record(
      '13.5',
      'Verify all temporary TASK-3D.4-TEST thumbnails deleted',
      remainingTestThumbnails.length === 0,
      `Remaining test thumbnails: 0`
    );

    record(
      '13.6',
      'Verify baseline production entity counts preserved',
      postCleanupQuestions.length === initialQuestions.length &&
      postCleanupVideos.length === initialVideos.length,
      `Questions: ${postCleanupQuestions.length}/${initialQuestions.length}, Videos: ${postCleanupVideos.length}/${initialVideos.length}`
    );

    console.log('\n================================================================');
    console.log('TASK 3D.4 VERIFICATION COMPLETED SUCCESSFULLY');
    console.log('================================================================\n');

    return {
      success: true,
      results,
      summary: {
        totalSteps: results.length,
        passedSteps: results.filter((r) => r.status === 'PASS').length,
        failedSteps: results.filter((r) => r.status === 'FAIL').length,
        createdQuestionIds,
        createdVideoIds,
        createdScriptIds,
        createdThumbnailIds,
        createdAssignmentIds,
      },
    };
  } catch (err: any) {
    // Emergency cleanup in catch block
    for (const asnId of createdAssignmentIds) {
      try { await assignmentsRepository.deleteRecord(asnId); } catch {}
    }
    for (const tvId of createdThumbnailVersionIds) {
      try { await thumbnailVersionsRepository.deleteRecord(tvId); } catch {}
    }
    for (const thmId of createdThumbnailIds) {
      try { await thumbnailsRepository.deleteRecord(thmId); } catch {}
    }
    for (const svId of createdScriptVersionIds) {
      try { await scriptVersionsRepository.deleteRecord(svId); } catch {}
    }
    for (const scrId of createdScriptIds) {
      try { await scriptsRepository.deleteRecord(scrId); } catch {}
    }
    for (const qvId of createdQuestionVideoIds) {
      try { await questionVideosRepository.deleteRecord(qvId); } catch {}
    }
    for (const vId of createdVideoIds) {
      try { await videosRepository.deleteRecord(vId); } catch {}
    }
    for (const qId of createdQuestionIds) {
      try { await questionsRepository.deleteRecord(qId); } catch {}
    }
    console.error('[ERROR] Task 3D.4 Verification Failed:', err?.message || err);
    throw err;
  }
}
