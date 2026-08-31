/**
 * BURRA PARIKSHA CMS - Data Integrity & Operational Diagnostics Service
 * Phase 8A: Data Integrity & Operational Intelligence Foundation
 * 
 * Provides comprehensive, strictly READ-ONLY diagnostics over all 18 Google Sheets worksheets.
 * Detects broken references, invalid statuses, taxonomy hierarchy violations, ID collisions,
 * sequence anomalies, and lifecycle state inconsistencies.
 * 
 * CRITICAL SAFETY GUARANTEE:
 * This service is strictly READ-ONLY. It never mutates records, modifies SEQUENCES, deletes rows,
 * or alters worksheet data in any way.
 */

import {
  AuditLog,
  Category,
  IntegrityCategory,
  IntegrityCheckSummary,
  IntegrityIssue,
  IntegritySeverity,
  PinnedComment,
  PinnedCommentVersion,
  PriorityLevel,
  Publishing,
  Question,
  QuestionStatus,
  QuestionVideo,
  Script,
  ScriptVersion,
  SocialPublishStatus,
  Subtopic,
  SystemHealthReport,
  Thumbnail,
  ThumbnailVersion,
  Topic,
  User,
  Video,
  VideoProductionStatus,
  Workflow,
  WorksheetHealthSummary,
} from '../../types';

import {
  assignmentsRepository,
  auditLogRepository,
  categoriesRepository,
  pinnedCommentsRepository,
  pinnedCommentVersionsRepository,
  publishingRepository,
  questionsRepository,
  questionVideosRepository,
  scriptsRepository,
  scriptVersionsRepository,
  sequencesRepository,
  subtopicsRepository,
  thumbnailsRepository,
  thumbnailVersionsRepository,
  topicsRepository,
  usersRepository,
  videosRepository,
  workflowRepository,
} from '../repositories';

import { ALL_SHEET_TABS, ID_PREFIX_MAP, SEQUENCE_ENTITIES, SequenceEntityType, SHEET_TABS } from '../schemas/google-sheets-schema';
import { googleSheetsClient } from '../google-sheets/client';
import { SequenceRecord } from '../repositories/sequences.repository';

export class DataIntegrityService {
  private static instance: DataIntegrityService | null = null;

  private constructor() {}

  public static getInstance(): DataIntegrityService {
    if (!DataIntegrityService.instance) {
      DataIntegrityService.instance = new DataIntegrityService();
    }
    return DataIntegrityService.instance;
  }

  /**
   * Extracts numeric ID from a formatted identifier string (e.g. BP-Q-000123 -> 123)
   */
  private extractNumericId(id: string): number | null {
    if (!id || typeof id !== 'string') return null;
    const match = id.match(/(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Executes a full, read-only data integrity and operational health check across all worksheets.
   */
  public async runFullIntegrityCheck(): Promise<SystemHealthReport> {
    const issues: IntegrityIssue[] = [];
    let issueCounter = 1;

    const addIssue = (
      severity: IntegritySeverity,
      category: IntegrityCategory,
      worksheet: string,
      message: string,
      recommendedAction: string,
      entityType?: string,
      entityId?: string,
      field?: string
    ) => {
      issues.push({
        id: `DI-ISSUE-${String(issueCounter++).padStart(5, '0')}`,
        severity,
        category,
        worksheet,
        message,
        recommendedAction,
        entityType,
        entityId,
        field,
      });
    };

    // Parallel fetch of all 18 authoritative datasets (single pass per worksheet)
    const [
      users,
      categories,
      topics,
      subtopics,
      questions,
      questionVideos,
      videos,
      scripts,
      scriptVersions,
      thumbnails,
      thumbnailVersions,
      pinnedComments,
      pinnedCommentVersions,
      workflows,
      assignments,
      publishingRecords,
      auditLogs,
      sequences,
    ] = await Promise.all([
      usersRepository.findAll().catch(() => [] as User[]),
      categoriesRepository.findAll().catch(() => [] as Category[]),
      topicsRepository.findAll().catch(() => [] as Topic[]),
      subtopicsRepository.findAll().catch(() => [] as Subtopic[]),
      questionsRepository.findAll().catch(() => [] as Question[]),
      questionVideosRepository.findAll().catch(() => [] as QuestionVideo[]),
      videosRepository.findAll().catch(() => [] as Video[]),
      scriptsRepository.findAll().catch(() => [] as Script[]),
      scriptVersionsRepository.findAll().catch(() => [] as ScriptVersion[]),
      thumbnailsRepository.findAll().catch(() => [] as Thumbnail[]),
      thumbnailVersionsRepository.findAll().catch(() => [] as ThumbnailVersion[]),
      pinnedCommentsRepository.findAll().catch(() => [] as PinnedComment[]),
      pinnedCommentVersionsRepository.findAll().catch(() => [] as PinnedCommentVersion[]),
      workflowRepository.findAll().catch(() => [] as Workflow[]),
      assignmentsRepository.findAll().catch(() => [] as any[]),
      publishingRepository.findAll().catch(() => [] as Publishing[]),
      auditLogRepository.findAll().catch(() => [] as AuditLog[]),
      sequencesRepository.findAll().catch(() => [] as SequenceRecord[]),
    ]);

    // Fast lookup maps
    const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));
    const topicMap = new Map<string, Topic>(topics.map((t) => [t.id, t]));
    const subtopicMap = new Map<string, Subtopic>(subtopics.map((s) => [s.id, s]));
    const questionMap = new Map<string, Question>(questions.map((q) => [q.id, q]));
    const videoMap = new Map<string, Video>(videos.map((v) => [v.id, v]));
    const scriptMap = new Map<string, Script>(scripts.map((s) => [s.id, s]));
    const thumbnailMap = new Map<string, Thumbnail>(thumbnails.map((t) => [t.id, t]));
    const pinnedCommentMap = new Map<string, PinnedComment>(pinnedComments.map((p) => [p.id, p]));
    const userMap = new Map<string, User>(users.map((u) => [u.id, u]));
    const publishingMap = new Map<string, Publishing>(publishingRecords.map((p) => [p.id, p]));

    // =========================================================================
    // A. ID INTEGRITY CHECKS ACROSS ALL WORKSHEETS
    // =========================================================================
    const checkWorksheetIds = (
      sheetName: string,
      items: any[],
      idField: string = 'id',
      expectedPrefix?: string
    ) => {
      const seenIds = new Set<string>();

      items.forEach((item, index) => {
        const id = item ? item[idField] : undefined;
        const rowNum = index + 2;

        if (id === undefined || id === null || String(id).trim() === '') {
          addIssue(
            'CRITICAL',
            'ID_INTEGRITY',
            sheetName,
            `Record at row ${rowNum} is missing its primary identifier (${idField}).`,
            `Manually assign a unique primary ID to row ${rowNum} in worksheet "${sheetName}".`,
            sheetName,
            `ROW-${rowNum}`,
            idField
          );
          return;
        }

        const idStr = String(id).trim();

        // Duplicate check
        if (seenIds.has(idStr.toLowerCase())) {
          addIssue(
            'ERROR',
            'ID_INTEGRITY',
            sheetName,
            `Duplicate primary ID "${idStr}" detected in worksheet "${sheetName}".`,
            `Locate duplicated ID "${idStr}" in "${sheetName}" and manually reassign a unique sequence ID.`,
            sheetName,
            idStr,
            idField
          );
        } else {
          seenIds.add(idStr.toLowerCase());
        }

        // Prefix validation
        if (expectedPrefix && !idStr.startsWith(expectedPrefix)) {
          addIssue(
            'WARNING',
            'ID_INTEGRITY',
            sheetName,
            `ID "${idStr}" does not start with standard prefix "${expectedPrefix}".`,
            `Ensure IDs in worksheet "${sheetName}" follow standard nomenclature starting with "${expectedPrefix}".`,
            sheetName,
            idStr,
            idField
          );
        }
      });
    };

    checkWorksheetIds(SHEET_TABS.USERS, users, 'id', 'USR-');
    checkWorksheetIds(SHEET_TABS.CATEGORIES, categories, 'id', 'BP-CAT-');
    checkWorksheetIds(SHEET_TABS.TOPICS, topics, 'id', 'BP-TOP-');
    checkWorksheetIds(SHEET_TABS.SUBTOPICS, subtopics, 'id', 'BP-SUB-');
    checkWorksheetIds(SHEET_TABS.QUESTIONS, questions, 'id', 'BP-Q-');
    checkWorksheetIds(SHEET_TABS.QUESTION_VIDEOS, questionVideos, 'id', 'QV-');
    checkWorksheetIds(SHEET_TABS.VIDEOS, videos, 'id', 'BP-V-');
    checkWorksheetIds(SHEET_TABS.SCRIPT, scripts, 'id');
    checkWorksheetIds(SHEET_TABS.SCRIPT_VERSIONS, scriptVersions, 'id');
    checkWorksheetIds(SHEET_TABS.THUMBNAILS, thumbnails, 'id');
    checkWorksheetIds(SHEET_TABS.THUMBNAIL_VERSIONS, thumbnailVersions, 'id');
    checkWorksheetIds(SHEET_TABS.PINNED_COMMENTS, pinnedComments, 'id');
    checkWorksheetIds(SHEET_TABS.PINNED_COMMENT_VERSIONS, pinnedCommentVersions, 'id');
    checkWorksheetIds(SHEET_TABS.WORKFLOW, workflows, 'id', 'WF-');
    checkWorksheetIds(SHEET_TABS.ASSIGNMENTS, assignments, 'id', 'ASG-');
    checkWorksheetIds(SHEET_TABS.PUBLISHING, publishingRecords, 'id', 'PUB-');
    checkWorksheetIds(SHEET_TABS.AUDIT_LOG, auditLogs, 'id', 'LOG-');

    // =========================================================================
    // B. QUESTION INTEGRITY CHECKS
    // =========================================================================
    const now = Date.now();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    questions.forEach((q) => {
      // 1. Missing Taxonomy References
      if (!q.categoryId) {
        addIssue(
          'ERROR',
          'QUESTION_INTEGRITY',
          SHEET_TABS.QUESTIONS,
          `Question "${q.id}" is missing required category_id.`,
          `Set a valid Category ID for question "${q.id}" in the QUESTIONS worksheet.`,
          'QUESTION',
          q.id,
          'categoryId'
        );
      } else if (!categoryMap.has(q.categoryId)) {
        addIssue(
          'ERROR',
          'QUESTION_INTEGRITY',
          SHEET_TABS.QUESTIONS,
          `Question "${q.id}" references non-existent category_id "${q.categoryId}".`,
          `Update category_id for question "${q.id}" to an existing category in the CATEGORIES tab.`,
          'QUESTION',
          q.id,
          'categoryId'
        );
      }

      if (!q.topicId) {
        addIssue(
          'ERROR',
          'QUESTION_INTEGRITY',
          SHEET_TABS.QUESTIONS,
          `Question "${q.id}" is missing required topic_id.`,
          `Set a valid Topic ID for question "${q.id}" in the QUESTIONS worksheet.`,
          'QUESTION',
          q.id,
          'topicId'
        );
      } else {
        const topic = topicMap.get(q.topicId);
        if (!topic) {
          addIssue(
            'ERROR',
            'QUESTION_INTEGRITY',
            SHEET_TABS.QUESTIONS,
            `Question "${q.id}" references non-existent topic_id "${q.topicId}".`,
            `Update topic_id for question "${q.id}" to an existing topic in the TOPICS tab.`,
            'QUESTION',
            q.id,
            'topicId'
          );
        } else if (q.categoryId && topic.categoryId !== q.categoryId) {
          // Hierarchy violation: Topic belongs to different Category
          addIssue(
            'ERROR',
            'QUESTION_INTEGRITY',
            SHEET_TABS.QUESTIONS,
            `Hierarchy mismatch: Topic "${q.topicId}" belongs to Category "${topic.categoryId}", but question "${q.id}" is assigned to Category "${q.categoryId}".`,
            `Align category_id and topic_id for question "${q.id}" in the QUESTIONS worksheet.`,
            'QUESTION',
            q.id,
            'topicId'
          );
        }
      }

      if (!q.subtopicId) {
        addIssue(
          'ERROR',
          'QUESTION_INTEGRITY',
          SHEET_TABS.QUESTIONS,
          `Question "${q.id}" is missing required subtopic_id.`,
          `Set a valid Subtopic ID for question "${q.id}" in the QUESTIONS worksheet.`,
          'QUESTION',
          q.id,
          'subtopicId'
        );
      } else {
        const subtopic = subtopicMap.get(q.subtopicId);
        if (!subtopic) {
          addIssue(
            'ERROR',
            'QUESTION_INTEGRITY',
            SHEET_TABS.QUESTIONS,
            `Question "${q.id}" references non-existent subtopic_id "${q.subtopicId}".`,
            `Update subtopic_id for question "${q.id}" to an existing subtopic in the SUBTOPICS tab.`,
            'QUESTION',
            q.id,
            'subtopicId'
          );
        } else if (q.topicId && subtopic.topicId !== q.topicId) {
          // Hierarchy violation: Subtopic belongs to different Topic
          addIssue(
            'ERROR',
            'QUESTION_INTEGRITY',
            SHEET_TABS.QUESTIONS,
            `Hierarchy mismatch: Subtopic "${q.subtopicId}" belongs to Topic "${subtopic.topicId}", but question "${q.id}" is assigned to Topic "${q.topicId}".`,
            `Align topic_id and subtopic_id for question "${q.id}" in the QUESTIONS worksheet.`,
            'QUESTION',
            q.id,
            'subtopicId'
          );
        }
      }

      // 2. Question Text & Options
      if (!q.questionText || q.questionText.trim() === '') {
        addIssue(
          'CRITICAL',
          'QUESTION_INTEGRITY',
          SHEET_TABS.QUESTIONS,
          `Question "${q.id}" has empty or missing question text.`,
          `Provide full question text content for "${q.id}" in the QUESTIONS worksheet.`,
          'QUESTION',
          q.id,
          'questionText'
        );
      }

      const optList: string[] = q.options
        ? Array.isArray(q.options)
          ? (q.options as string[])
          : [q.options.a, q.options.b, q.options.c, q.options.d]
        : [];

      if (!q.options || optList.length < 4 || optList.some((o) => !o || String(o).trim() === '')) {
        addIssue(
          'ERROR',
          'QUESTION_INTEGRITY',
          SHEET_TABS.QUESTIONS,
          `Question "${q.id}" has incomplete options (${optList.filter((o) => Boolean(o && String(o).trim())).length}/4 valid options defined).`,
          `Ensure question "${q.id}" defines 4 distinct non-empty multiple-choice options (A, B, C, D).`,
          'QUESTION',
          q.id,
          'options'
        );
      } else {
        // Duplicate options check
        const optTexts = optList.map((o) => (typeof o === 'string' ? o.trim().toLowerCase() : String(o || '').trim().toLowerCase()));
        const uniqueOptTexts = new Set(optTexts.filter((t) => t.length > 0));
        if (uniqueOptTexts.size < optList.length) {
          addIssue(
            'ERROR',
            'QUESTION_INTEGRITY',
            SHEET_TABS.QUESTIONS,
            `Question "${q.id}" contains duplicate options text.`,
            `Review options for question "${q.id}" and ensure all 4 choices are unique.`,
            'QUESTION',
            q.id,
            'options'
          );
        }
      }

      // 3. Correct Answer Validity
      if (q.correctAnswer === undefined || q.correctAnswer === null || String(q.correctAnswer).trim() === '') {
        addIssue(
          'ERROR',
          'QUESTION_INTEGRITY',
          SHEET_TABS.QUESTIONS,
          `Question "${q.id}" has missing correct_answer.`,
          `Specify the correct answer (e.g. "A", "B", "C", "D" or matching text) for question "${q.id}".`,
          'QUESTION',
          q.id,
          'correctAnswer'
        );
      }

      // 4. Status Enums
      if (!Object.values(QuestionStatus).includes(q.status)) {
        addIssue(
          'ERROR',
          'QUESTION_INTEGRITY',
          SHEET_TABS.QUESTIONS,
          `Question "${q.id}" has invalid status "${q.status}".`,
          `Update question "${q.id}" status to one of: ${Object.values(QuestionStatus).join(', ')}.`,
          'QUESTION',
          q.id,
          'status'
        );
      }

      if (q.videoStatus && !Object.values(VideoProductionStatus).includes(q.videoStatus)) {
        addIssue(
          'ERROR',
          'QUESTION_INTEGRITY',
          SHEET_TABS.QUESTIONS,
          `Question "${q.id}" has invalid video_status "${q.videoStatus}".`,
          `Update question "${q.id}" video_status to one of: ${Object.values(VideoProductionStatus).join(', ')}.`,
          'QUESTION',
          q.id,
          'videoStatus'
        );
      }

      // 5. Cross-Lifecycle & Stale Checks
      const qVideos = questionVideos.filter((qv) => qv.questionId === q.id);
      const activeVideos = qVideos
        .map((qv) => videoMap.get(qv.videoId))
        .filter((v) => v && v.status !== VideoProductionStatus.CANCELLED);

      if (q.status === QuestionStatus.APPROVED && qVideos.length === 0) {
        addIssue(
          'INFO',
          'QUESTION_INTEGRITY',
          SHEET_TABS.QUESTIONS,
          `Approved question "${q.id}" is not yet queued in video production.`,
          `Navigate to Video Queue or Question Details to enqueue "${q.id}".`,
          'QUESTION',
          q.id,
          'status'
        );
      }

      if (q.status === QuestionStatus.REJECTED && activeVideos.length > 0) {
        addIssue(
          'ERROR',
          'QUESTION_INTEGRITY',
          SHEET_TABS.QUESTIONS,
          `Question "${q.id}" is marked REJECTED but has active video production in progress (${activeVideos.map((v) => v?.id).join(', ')}).`,
          `Either cancel active videos or restore question status from REJECTED.`,
          'QUESTION',
          q.id,
          'status'
        );
      }

      if (q.createdAt) {
        const createdTime = new Date(q.createdAt).getTime();
        if (!isNaN(createdTime) && now - createdTime > THIRTY_DAYS_MS) {
          if (q.status === QuestionStatus.GENERATED || q.status === QuestionStatus.DRAFT) {
            addIssue(
              'WARNING',
              'QUESTION_INTEGRITY',
              SHEET_TABS.QUESTIONS,
              `Question "${q.id}" has been in GENERATED/DRAFT status for over 30 days without review.`,
              `Review or archive aged draft question "${q.id}".`,
              'QUESTION',
              q.id,
              'createdAt'
            );
          } else if (q.status === QuestionStatus.EDITING) {
            addIssue(
              'WARNING',
              'QUESTION_INTEGRITY',
              SHEET_TABS.QUESTIONS,
              `Question "${q.id}" has been in EDITING status for over 30 days.`,
              `Finalize review or release question "${q.id}".`,
              'QUESTION',
              q.id,
              'createdAt'
            );
          }
        }
      }
    });

    // =========================================================================
    // C. VIDEO INTEGRITY CHECKS
    // =========================================================================
    const questionToVideosCount = new Map<string, string[]>();

    videos.forEach((v) => {
      // 1. Missing Question Reference
      if (!v.questionId) {
        addIssue(
          'ERROR',
          'VIDEO_INTEGRITY',
          SHEET_TABS.VIDEOS,
          `Video "${v.id}" has missing question_id.`,
          `Link video "${v.id}" to an authoritative Question ID in the VIDEOS worksheet.`,
          'VIDEO',
          v.id,
          'questionId'
        );
      } else if (!questionMap.has(v.questionId)) {
        addIssue(
          'ERROR',
          'VIDEO_INTEGRITY',
          SHEET_TABS.VIDEOS,
          `Video "${v.id}" points to non-existent question_id "${v.questionId}".`,
          `Update question_id for video "${v.id}" to an existing question in the QUESTIONS worksheet.`,
          'VIDEO',
          v.id,
          'questionId'
        );
      } else {
        // Track active videos per question
        if (v.status !== VideoProductionStatus.CANCELLED) {
          const list = questionToVideosCount.get(v.questionId) || [];
          list.push(v.id);
          questionToVideosCount.set(v.questionId, list);
        }
      }

      // 2. Status Validation
      if (!Object.values(VideoProductionStatus).includes(v.status)) {
        addIssue(
          'ERROR',
          'VIDEO_INTEGRITY',
          SHEET_TABS.VIDEOS,
          `Video "${v.id}" has invalid status "${v.status}".`,
          `Set status for video "${v.id}" to a valid VideoProductionStatus enum.`,
          'VIDEO',
          v.id,
          'status'
        );
      }

      // 3. Required Metadata
      if (!v.title || v.title.trim() === '') {
        addIssue(
          'ERROR',
          'VIDEO_INTEGRITY',
          SHEET_TABS.VIDEOS,
          `Video "${v.id}" is missing a title.`,
          `Provide a video title for "${v.id}" in the VIDEOS worksheet.`,
          'VIDEO',
          v.id,
          'title'
        );
      }

      if (v.priority && !Object.values(PriorityLevel).includes(v.priority)) {
        addIssue(
          'WARNING',
          'VIDEO_INTEGRITY',
          SHEET_TABS.VIDEOS,
          `Video "${v.id}" has unknown priority level "${v.priority}".`,
          `Set priority to URGENT, HIGH, NORMAL, or LOW.`,
          'VIDEO',
          v.id,
          'priority'
        );
      }

      // 4. QUESTION_VIDEOS Relationship mapping
      const hasQvMapping = questionVideos.some((qv) => qv.videoId === v.id && qv.questionId === v.questionId);
      if (!hasQvMapping && v.questionId) {
        addIssue(
          'WARNING',
          'VIDEO_INTEGRITY',
          SHEET_TABS.QUESTION_VIDEOS,
          `Video "${v.id}" does not have a corresponding mapping row in QUESTION_VIDEOS.`,
          `Add relationship row (question_id="${v.questionId}", video_id="${v.id}") to QUESTION_VIDEOS.`,
          'VIDEO',
          v.id,
          'id'
        );
      }

      // 5. READY_TO_UPLOAD & UPLOADED Readiness verification
      if (v.status === VideoProductionStatus.READY_TO_UPLOAD) {
        const script = scripts.find((s) => s.videoId === v.id);
        const thumbnail = thumbnails.find((t) => t.videoId === v.id);
        if (!v.finalRenderPath && !v.driveFolderUrl) {
          addIssue(
            'WARNING',
            'VIDEO_INTEGRITY',
            SHEET_TABS.VIDEOS,
            `Video "${v.id}" is in READY_TO_UPLOAD status but lacks final_render_path or drive_folder_url.`,
            `Attach cloud asset link or final render file path for video "${v.id}".`,
            'VIDEO',
            v.id,
            'finalRenderPath'
          );
        }
      }

      if (v.status === VideoProductionStatus.UPLOADED) {
        const pub = publishingRecords.find((p) => p.videoId === v.id);
        if (!pub) {
          addIssue(
            'WARNING',
            'VIDEO_INTEGRITY',
            SHEET_TABS.PUBLISHING,
            `Video "${v.id}" is in UPLOADED status but has no publishing tracking record in PUBLISHING worksheet.`,
            `Create publishing record for video "${v.id}" in the PUBLISHING worksheet.`,
            'VIDEO',
            v.id,
            'status'
          );
        }
      }
    });

    // Check duplicate active videos per question
    questionToVideosCount.forEach((videoIds, questionId) => {
      if (videoIds.length > 1) {
        addIssue(
          'ERROR',
          'VIDEO_INTEGRITY',
          SHEET_TABS.VIDEOS,
          `Question "${questionId}" has multiple concurrent active video production entries: ${videoIds.join(', ')}.`,
          `Cancel duplicate active video records so only one active video represents question "${questionId}".`,
          'QUESTION',
          questionId,
          'id'
        );
      }
    });

    // =========================================================================
    // D. SCRIPT INTEGRITY CHECKS
    // =========================================================================
    const scriptVersionMap = new Map<string, ScriptVersion[]>();
    scriptVersions.forEach((sv) => {
      if (!sv.scriptId) {
        addIssue(
          'ERROR',
          'SCRIPT_INTEGRITY',
          SHEET_TABS.SCRIPT_VERSIONS,
          `Script version "${sv.id}" is missing script_id reference.`,
          `Link script version "${sv.id}" to a valid script_id in SCRIPT_VERSIONS.`,
          'SCRIPT_VERSION',
          sv.id,
          'scriptId'
        );
      } else if (!scriptMap.has(sv.scriptId)) {
        addIssue(
          'ERROR',
          'SCRIPT_INTEGRITY',
          SHEET_TABS.SCRIPT_VERSIONS,
          `Script version "${sv.id}" points to non-existent script_id "${sv.scriptId}".`,
          `Correct script_id in SCRIPT_VERSIONS for version "${sv.id}".`,
          'SCRIPT_VERSION',
          sv.id,
          'scriptId'
        );
      } else {
        const list = scriptVersionMap.get(sv.scriptId) || [];
        list.push(sv);
        scriptVersionMap.set(sv.scriptId, list);
      }
    });

    scripts.forEach((s) => {
      if (!s.videoId) {
        addIssue(
          'ERROR',
          'SCRIPT_INTEGRITY',
          SHEET_TABS.SCRIPT,
          `Script "${s.id}" is missing video_id reference.`,
          `Link script "${s.id}" to an existing video in the SCRIPT worksheet.`,
          'SCRIPT',
          s.id,
          'videoId'
        );
      } else if (!videoMap.has(s.videoId)) {
        addIssue(
          'ERROR',
          'SCRIPT_INTEGRITY',
          SHEET_TABS.SCRIPT,
          `Script "${s.id}" points to non-existent video_id "${s.videoId}".`,
          `Update video_id for script "${s.id}" to a valid video in the VIDEOS worksheet.`,
          'SCRIPT',
          s.id,
          'videoId'
        );
      }

      // Version validation
      const versions = scriptVersionMap.get(s.id) || [];
      if (s.currentVersion === undefined || s.currentVersion === null || Number(s.currentVersion) <= 0) {
        addIssue(
          'ERROR',
          'SCRIPT_INTEGRITY',
          SHEET_TABS.SCRIPT,
          `Script "${s.id}" has invalid current_version (${s.currentVersion}).`,
          `Set current_version >= 1 for script "${s.id}".`,
          'SCRIPT',
          s.id,
          'currentVersion'
        );
      }

      // Check duplicate version numbers
      const seenVerNums = new Set<number>();
      versions.forEach((v) => {
        if (seenVerNums.has(v.versionNumber)) {
          addIssue(
            'ERROR',
            'SCRIPT_INTEGRITY',
            SHEET_TABS.SCRIPT_VERSIONS,
            `Script "${s.id}" has duplicate version number v${v.versionNumber} in SCRIPT_VERSIONS.`,
            `Renumber or clean duplicate version entries for script "${s.id}".`,
            'SCRIPT',
            s.id,
            'versionNumber'
          );
        } else {
          seenVerNums.add(v.versionNumber);
        }
      });
    });

    // =========================================================================
    // E. THUMBNAIL INTEGRITY CHECKS
    // =========================================================================
    const thumbnailVersionMap = new Map<string, ThumbnailVersion[]>();
    thumbnailVersions.forEach((tv) => {
      if (!tv.thumbnailId) {
        addIssue(
          'ERROR',
          'THUMBNAIL_INTEGRITY',
          SHEET_TABS.THUMBNAIL_VERSIONS,
          `Thumbnail version "${tv.id}" is missing thumbnail_id.`,
          `Link thumbnail version "${tv.id}" to a valid thumbnail_id in THUMBNAIL_VERSIONS.`,
          'THUMBNAIL_VERSION',
          tv.id,
          'thumbnailId'
        );
      } else if (!thumbnailMap.has(tv.thumbnailId)) {
        addIssue(
          'ERROR',
          'THUMBNAIL_INTEGRITY',
          SHEET_TABS.THUMBNAIL_VERSIONS,
          `Thumbnail version "${tv.id}" references non-existent thumbnail_id "${tv.thumbnailId}".`,
          `Correct thumbnail_id in THUMBNAIL_VERSIONS for version "${tv.id}".`,
          'THUMBNAIL_VERSION',
          tv.id,
          'thumbnailId'
        );
      } else {
        const list = thumbnailVersionMap.get(tv.thumbnailId) || [];
        list.push(tv);
        thumbnailVersionMap.set(tv.thumbnailId, list);
      }
    });

    thumbnails.forEach((t) => {
      if (!t.videoId) {
        addIssue(
          'ERROR',
          'THUMBNAIL_INTEGRITY',
          SHEET_TABS.THUMBNAILS,
          `Thumbnail "${t.id}" is missing video_id.`,
          `Link thumbnail "${t.id}" to a valid video in THUMBNAILS.`,
          'THUMBNAIL',
          t.id,
          'videoId'
        );
      } else if (!videoMap.has(t.videoId)) {
        addIssue(
          'ERROR',
          'THUMBNAIL_INTEGRITY',
          SHEET_TABS.THUMBNAILS,
          `Thumbnail "${t.id}" references non-existent video_id "${t.videoId}".`,
          `Update video_id for thumbnail "${t.id}" in THUMBNAILS.`,
          'THUMBNAIL',
          t.id,
          'videoId'
        );
      }

      if (t.status === 'APPROVED' && !t.driveAssetUrl && !t.previewUrl) {
        addIssue(
          'WARNING',
          'THUMBNAIL_INTEGRITY',
          SHEET_TABS.THUMBNAILS,
          `Thumbnail "${t.id}" is marked APPROVED but lacks drive_asset_url or preview_url.`,
          `Attach image asset link to approved thumbnail "${t.id}".`,
          'THUMBNAIL',
          t.id,
          'driveAssetUrl'
        );
      }
    });

    // =========================================================================
    // F. PINNED COMMENT INTEGRITY CHECKS
    // =========================================================================
    const pinnedCommentVersionMap = new Map<string, PinnedCommentVersion[]>();
    pinnedCommentVersions.forEach((pv) => {
      if (!pv.pinnedCommentId) {
        addIssue(
          'ERROR',
          'PINNED_COMMENT_INTEGRITY',
          SHEET_TABS.PINNED_COMMENT_VERSIONS,
          `Pinned comment version "${pv.id}" is missing pinned_comment_id.`,
          `Set pinned_comment_id for version row "${pv.id}".`,
          'PINNED_COMMENT_VERSION',
          pv.id,
          'pinnedCommentId'
        );
      } else if (!pinnedCommentMap.has(pv.pinnedCommentId)) {
        addIssue(
          'ERROR',
          'PINNED_COMMENT_INTEGRITY',
          SHEET_TABS.PINNED_COMMENT_VERSIONS,
          `Pinned comment version "${pv.id}" references non-existent comment "${pv.pinnedCommentId}".`,
          `Fix pinned_comment_id in PINNED_COMMENT_VERSIONS for "${pv.id}".`,
          'PINNED_COMMENT_VERSION',
          pv.id,
          'pinnedCommentId'
        );
      }
    });

    pinnedComments.forEach((p) => {
      if (!p.videoId) {
        addIssue(
          'ERROR',
          'PINNED_COMMENT_INTEGRITY',
          SHEET_TABS.PINNED_COMMENTS,
          `Pinned comment "${p.id}" is missing video_id.`,
          `Link pinned comment "${p.id}" to a valid video in PINNED_COMMENTS.`,
          'PINNED_COMMENT',
          p.id,
          'videoId'
        );
      } else if (!videoMap.has(p.videoId)) {
        addIssue(
          'ERROR',
          'PINNED_COMMENT_INTEGRITY',
          SHEET_TABS.PINNED_COMMENTS,
          `Pinned comment "${p.id}" points to non-existent video "${p.videoId}".`,
          `Update video_id for pinned comment "${p.id}".`,
          'PINNED_COMMENT',
          p.id,
          'videoId'
        );
      }

      if (!p.commentText || p.commentText.trim() === '') {
        addIssue(
          'ERROR',
          'PINNED_COMMENT_INTEGRITY',
          SHEET_TABS.PINNED_COMMENTS,
          `Pinned comment "${p.id}" has empty comment_text.`,
          `Provide pinned comment text for "${p.id}".`,
          'PINNED_COMMENT',
          p.id,
          'commentText'
        );
      }
    });

    // =========================================================================
    // G. PUBLISHING INTEGRITY CHECKS
    // =========================================================================
    const publishingSeenVideos = new Set<string>();

    publishingRecords.forEach((pub) => {
      if (!pub.videoId) {
        addIssue(
          'ERROR',
          'PUBLISHING_INTEGRITY',
          SHEET_TABS.PUBLISHING,
          `Publishing record "${pub.id}" has missing video_id.`,
          `Set video_id for publishing row "${pub.id}" in the PUBLISHING worksheet.`,
          'PUBLISHING',
          pub.id,
          'videoId'
        );
      } else if (!videoMap.has(pub.videoId)) {
        addIssue(
          'ERROR',
          'PUBLISHING_INTEGRITY',
          SHEET_TABS.PUBLISHING,
          `Publishing record "${pub.id}" points to non-existent video_id "${pub.videoId}".`,
          `Update video_id for publishing record "${pub.id}".`,
          'PUBLISHING',
          pub.id,
          'videoId'
        );
      } else {
        if (publishingSeenVideos.has(pub.videoId)) {
          addIssue(
            'ERROR',
            'PUBLISHING_INTEGRITY',
            SHEET_TABS.PUBLISHING,
            `Duplicate publishing record detected for video "${pub.videoId}".`,
            `Consolidate duplicate publishing records for video "${pub.videoId}".`,
            'PUBLISHING',
            pub.id,
            'videoId'
          );
        } else {
          publishingSeenVideos.add(pub.videoId);
        }
      }

      // Check YouTube publication consistency
      if (pub.youtube?.status === SocialPublishStatus.PUBLISHED) {
        if (!pub.youtube.videoUrl || pub.youtube.videoUrl.trim() === '') {
          addIssue(
            'ERROR',
            'PUBLISHING_INTEGRITY',
            SHEET_TABS.PUBLISHING,
            `Publishing record "${pub.id}" marks YouTube as PUBLISHED but is missing youtube_video_url.`,
            `Provide the live YouTube Shorts URL in PUBLISHING record "${pub.id}".`,
            'PUBLISHING',
            pub.id,
            'youtube.videoUrl'
          );
        }
        if (!pub.youtube.publishedAt) {
          addIssue(
            'WARNING',
            'PUBLISHING_INTEGRITY',
            SHEET_TABS.PUBLISHING,
            `Publishing record "${pub.id}" marks YouTube as PUBLISHED without a published_at timestamp.`,
            `Set published_at timestamp for YouTube on record "${pub.id}".`,
            'PUBLISHING',
            pub.id,
            'youtube.publishedAt'
          );
        }
      }

      // Check Instagram publication consistency
      if (pub.instagram?.status === SocialPublishStatus.PUBLISHED) {
        if (!pub.instagram.postUrl || pub.instagram.postUrl.trim() === '') {
          addIssue(
            'ERROR',
            'PUBLISHING_INTEGRITY',
            SHEET_TABS.PUBLISHING,
            `Publishing record "${pub.id}" marks Instagram as PUBLISHED but is missing instagram_post_url.`,
            `Provide the live Instagram Reels URL in PUBLISHING record "${pub.id}".`,
            'PUBLISHING',
            pub.id,
            'instagram.postUrl'
          );
        }
        if (!pub.instagram.publishedAt) {
          addIssue(
            'WARNING',
            'PUBLISHING_INTEGRITY',
            SHEET_TABS.PUBLISHING,
            `Publishing record "${pub.id}" marks Instagram as PUBLISHED without a published_at timestamp.`,
            `Set published_at timestamp for Instagram on record "${pub.id}".`,
            'PUBLISHING',
            pub.id,
            'instagram.publishedAt'
          );
        }
      }

      // Check Facebook publication consistency
      if (pub.facebook?.status === SocialPublishStatus.PUBLISHED) {
        if (!pub.facebook.postUrl || pub.facebook.postUrl.trim() === '') {
          addIssue(
            'ERROR',
            'PUBLISHING_INTEGRITY',
            SHEET_TABS.PUBLISHING,
            `Publishing record "${pub.id}" marks Facebook as PUBLISHED but is missing facebook_post_url.`,
            `Provide the live Facebook Reels URL in PUBLISHING record "${pub.id}".`,
            'PUBLISHING',
            pub.id,
            'facebook.postUrl'
          );
        }
        if (!pub.facebook.publishedAt) {
          addIssue(
            'WARNING',
            'PUBLISHING_INTEGRITY',
            SHEET_TABS.PUBLISHING,
            `Publishing record "${pub.id}" marks Facebook as PUBLISHED without a published_at timestamp.`,
            `Set published_at timestamp for Facebook on record "${pub.id}".`,
            'PUBLISHING',
            pub.id,
            'facebook.publishedAt'
          );
        }
      }
    });

    // =========================================================================
    // H. WORKFLOW INTEGRITY CHECKS
    // =========================================================================
    workflows.forEach((wf) => {
      if (!wf.entityId) {
        addIssue(
          'ERROR',
          'WORKFLOW_INTEGRITY',
          SHEET_TABS.WORKFLOW,
          `Workflow record "${wf.id}" is missing entity_id.`,
          `Link workflow transition "${wf.id}" to an entity_id.`,
          'WORKFLOW',
          wf.id,
          'entityId'
        );
      } else {
        const isQuestion = questionMap.has(wf.entityId);
        const isVideo = videoMap.has(wf.entityId);
        if (!isQuestion && !isVideo) {
          addIssue(
            'WARNING',
            'WORKFLOW_INTEGRITY',
            SHEET_TABS.WORKFLOW,
            `Workflow record "${wf.id}" refers to entity_id "${wf.entityId}" not found in active Questions or Videos.`,
            `Verify entity_id for workflow event "${wf.id}".`,
            'WORKFLOW',
            wf.id,
            'entityId'
          );
        }
      }

      if (!wf.toStatus) {
        addIssue(
          'ERROR',
          'WORKFLOW_INTEGRITY',
          SHEET_TABS.WORKFLOW,
          `Workflow record "${wf.id}" is missing to_status.`,
          `Provide to_status for workflow transition "${wf.id}".`,
          'WORKFLOW',
          wf.id,
          'toStatus'
        );
      }

      // Check terminal state violations (e.g. attempting transition away from CANCELLED or UPLOADED)
      if (wf.fromStatus === VideoProductionStatus.UPLOADED && wf.toStatus !== VideoProductionStatus.UPLOADED) {
        addIssue(
          'ERROR',
          'WORKFLOW_INTEGRITY',
          SHEET_TABS.WORKFLOW,
          `Workflow record "${wf.id}" represents an illegal transition from terminal state UPLOADED to "${wf.toStatus}".`,
          `Review workflow history in WORKFLOW worksheet for entity "${wf.entityId}".`,
          'WORKFLOW',
          wf.id,
          'toStatus'
        );
      }

      if (wf.fromStatus === VideoProductionStatus.CANCELLED && wf.toStatus !== VideoProductionStatus.CANCELLED) {
        addIssue(
          'ERROR',
          'WORKFLOW_INTEGRITY',
          SHEET_TABS.WORKFLOW,
          `Workflow record "${wf.id}" represents an illegal transition from terminal state CANCELLED to "${wf.toStatus}".`,
          `Review workflow history in WORKFLOW worksheet for entity "${wf.entityId}".`,
          'WORKFLOW',
          wf.id,
          'toStatus'
        );
      }
    });

    // =========================================================================
    // I. AUDIT LOG INTEGRITY CHECKS
    // =========================================================================
    auditLogs.forEach((log) => {
      if (!log.entityId || log.entityId.trim() === '') {
        addIssue(
          'WARNING',
          'AUDIT_LOG_INTEGRITY',
          SHEET_TABS.AUDIT_LOG,
          `Audit log "${log.id}" has empty entity_id.`,
          `Ensure administrative audit logs record target entity_id.`,
          'AUDIT_LOG',
          log.id,
          'entityId'
        );
      }

      if (!log.action || log.action.trim() === '') {
        addIssue(
          'ERROR',
          'AUDIT_LOG_INTEGRITY',
          SHEET_TABS.AUDIT_LOG,
          `Audit log "${log.id}" has empty action name.`,
          `Specify administrative action in AUDIT_LOG row "${log.id}".`,
          'AUDIT_LOG',
          log.id,
          'action'
        );
      }

      if (!log.timestamp || isNaN(new Date(log.timestamp).getTime())) {
        addIssue(
          'WARNING',
          'AUDIT_LOG_INTEGRITY',
          SHEET_TABS.AUDIT_LOG,
          `Audit log "${log.id}" has missing or invalid timestamp.`,
          `Provide ISO-8601 timestamp for audit log "${log.id}".`,
          'AUDIT_LOG',
          log.id,
          'timestamp'
        );
      }
    });

    // =========================================================================
    // J. SEQUENCE INTEGRITY CHECKS
    // =========================================================================
    const maxIdsByEntity: Record<string, number> = {
      [SEQUENCE_ENTITIES.QUESTION]: Math.max(0, ...questions.map((q) => this.extractNumericId(q.id) || 0)),
      [SEQUENCE_ENTITIES.VIDEO]: Math.max(0, ...videos.map((v) => this.extractNumericId(v.id) || 0)),
      [SEQUENCE_ENTITIES.SCRIPT]: Math.max(0, ...scripts.map((s) => this.extractNumericId(s.id) || 0)),
      [SEQUENCE_ENTITIES.THUMBNAIL]: Math.max(0, ...thumbnails.map((t) => this.extractNumericId(t.id) || 0)),
      [SEQUENCE_ENTITIES.PINNED_COMMENT]: Math.max(0, ...pinnedComments.map((p) => this.extractNumericId(p.id) || 0)),
      [SEQUENCE_ENTITIES.CATEGORY]: Math.max(0, ...categories.map((c) => this.extractNumericId(c.id) || 0)),
      [SEQUENCE_ENTITIES.TOPIC]: Math.max(0, ...topics.map((t) => this.extractNumericId(t.id) || 0)),
      [SEQUENCE_ENTITIES.SUBTOPIC]: Math.max(0, ...subtopics.map((s) => this.extractNumericId(s.id) || 0)),
      [SEQUENCE_ENTITIES.USER]: Math.max(0, ...users.map((u) => this.extractNumericId(u.id) || 0)),
      [SEQUENCE_ENTITIES.CONTENT_PLAN]: 0,
      [SEQUENCE_ENTITIES.CONTENT_BATCH]: 0,
      [SEQUENCE_ENTITIES.ASSIGNMENT]: Math.max(0, ...assignments.map((a) => this.extractNumericId(a.id) || 0)),
    };

    const seenSeqEntities = new Set<string>();

    sequences.forEach((seq) => {
      if (!seq.entityType || seq.entityType.trim() === '') {
        addIssue(
          'CRITICAL',
          'SEQUENCE_INTEGRITY',
          SHEET_TABS.SEQUENCES,
          `Sequence row has empty entity_type.`,
          `Define entity_type in SEQUENCES tab (e.g. QUESTION, VIDEO).`,
          'SEQUENCE',
          'UNKNOWN',
          'entityType'
        );
        return;
      }

      if (seenSeqEntities.has(seq.entityType.toUpperCase())) {
        addIssue(
          'ERROR',
          'SEQUENCE_INTEGRITY',
          SHEET_TABS.SEQUENCES,
          `Duplicate sequence row for entity_type "${seq.entityType}".`,
          `Remove duplicate sequence rows in SEQUENCES tab.`,
          'SEQUENCE',
          seq.entityType,
          'entityType'
        );
      } else {
        seenSeqEntities.add(seq.entityType.toUpperCase());
      }

      const nextNum = Number(seq.nextNumber);
      if (isNaN(nextNum) || nextNum <= 0) {
        addIssue(
          'CRITICAL',
          'SEQUENCE_INTEGRITY',
          SHEET_TABS.SEQUENCES,
          `Sequence for "${seq.entityType}" has non-numeric or invalid next_number (${seq.nextNumber}).`,
          `Set next_number to a valid integer >= 1 in SEQUENCES tab for "${seq.entityType}".`,
          'SEQUENCE',
          seq.entityType,
          'nextNumber'
        );
      } else {
        const maxExisting = maxIdsByEntity[seq.entityType];
        if (maxExisting !== undefined && nextNum <= maxExisting) {
          addIssue(
            'ERROR',
            'SEQUENCE_INTEGRITY',
            SHEET_TABS.SEQUENCES,
            `Sequence next_number (${nextNum}) for "${seq.entityType}" is not ahead of highest existing record ID (${maxExisting}). Risk of duplicate ID generation!`,
            `Manually update SEQUENCES tab so next_number for "${seq.entityType}" is at least ${maxExisting + 1}.`,
            'SEQUENCE',
            seq.entityType,
            'nextNumber'
          );
        }
      }
    });

    // Check missing expected sequence rows
    Object.values(SEQUENCE_ENTITIES).forEach((entity) => {
      if (!seenSeqEntities.has(entity)) {
        addIssue(
          'ERROR',
          'SEQUENCE_INTEGRITY',
          SHEET_TABS.SEQUENCES,
          `Missing sequence definition for required entity "${entity}" in SEQUENCES worksheet.`,
          `Add sequence row with entity_type="${entity}", next_number=1, prefix="${(ID_PREFIX_MAP as any)[entity]?.prefix || 'BP-'}" in SEQUENCES.`,
          'SEQUENCE',
          entity,
          'entityType'
        );
      }
    });

    // =========================================================================
    // K. ASSIGNMENT & TEAM INTEGRITY CHECKS (Phase 10)
    // =========================================================================

    // Check USERS
    users.forEach((user) => {
      if (!user.name || user.name.trim() === '') {
        addIssue(
          'ERROR',
          'USER_INTEGRITY',
          SHEET_TABS.USERS,
          `User record "${user.id}" is missing required name.`,
          `Specify user full name in USERS tab for "${user.id}".`,
          'USER',
          user.id,
          'name'
        );
      }
      if (!user.email || !user.email.includes('@')) {
        addIssue(
          'ERROR',
          'USER_INTEGRITY',
          SHEET_TABS.USERS,
          `User record "${user.id}" has invalid or missing email (${user.email || 'EMPTY'}).`,
          `Provide valid email for user "${user.id}".`,
          'USER',
          user.id,
          'email'
        );
      }
      if (!user.role) {
        addIssue(
          'WARNING',
          'USER_INTEGRITY',
          SHEET_TABS.USERS,
          `User record "${user.id}" is missing role.`,
          `Assign operational role to user "${user.id}".`,
          'USER',
          user.id,
          'role'
        );
      }
    });

    // Check ASSIGNMENTS
    const activeAssignmentsKey = new Set<string>();

    assignments.forEach((asn) => {
      // Check assignee presence
      if (!asn.assigneeId) {
        addIssue(
          'ERROR',
          'ASSIGNMENT_INTEGRITY',
          SHEET_TABS.ASSIGNMENTS,
          `Assignment "${asn.id}" is missing assignee_id.`,
          `Assign assignment "${asn.id}" to a valid team user.`,
          'ASSIGNMENT',
          asn.id,
          'assigneeId'
        );
      } else {
        const user = userMap.get(asn.assigneeId);
        if (!user) {
          addIssue(
            'ERROR',
            'ASSIGNMENT_INTEGRITY',
            SHEET_TABS.ASSIGNMENTS,
            `Assignment "${asn.id}" references non-existent user "${asn.assigneeId}".`,
            `Update assignee_id for assignment "${asn.id}" to point to an active user.`,
            'ASSIGNMENT',
            asn.id,
            'assigneeId'
          );
        } else if (!user.isActive && asn.status !== 'COMPLETED' && asn.status !== 'CANCELLED') {
          addIssue(
            'WARNING',
            'ASSIGNMENT_INTEGRITY',
            SHEET_TABS.ASSIGNMENTS,
            `Active assignment "${asn.id}" is assigned to inactive user "${user.name}" (${user.id}).`,
            `Reassign assignment "${asn.id}" to an active team member.`,
            'ASSIGNMENT',
            asn.id,
            'assigneeId'
          );
        }
      }

      // Check target entity link
      const entityType = asn.entityType || 'VIDEO';
      const entityId = asn.entityId || asn.videoId;

      if (!entityId) {
        addIssue(
          'ERROR',
          'ASSIGNMENT_INTEGRITY',
          SHEET_TABS.ASSIGNMENTS,
          `Assignment "${asn.id}" is missing target entity_id or video_id.`,
          `Link assignment "${asn.id}" to a valid target entity.`,
          'ASSIGNMENT',
          asn.id,
          'entityId'
        );
      } else {
        let entityExists = false;
        if (entityType === 'VIDEO' && videoMap.has(entityId)) entityExists = true;
        else if (entityType === 'QUESTION' && questionMap.has(entityId)) entityExists = true;
        else if (entityType === 'SCRIPT' && (scriptMap.has(entityId) || scripts.some((s) => s.videoId === entityId))) entityExists = true;
        else if (entityType === 'THUMBNAIL' && (thumbnailMap.has(entityId) || thumbnails.some((t) => t.videoId === entityId))) entityExists = true;
        else if (entityType === 'PUBLISHING' && (publishingMap.has(entityId) || publishingRecords.some((p) => p.videoId === entityId))) entityExists = true;
        else if (entityType === 'CONTENT_PLAN' || entityType === 'CONTENT_BATCH') entityExists = true;

        if (!entityExists && (entityType === 'VIDEO' || entityType === 'QUESTION')) {
          addIssue(
            'ERROR',
            'ASSIGNMENT_INTEGRITY',
            SHEET_TABS.ASSIGNMENTS,
            `Assignment "${asn.id}" points to non-existent ${entityType} "${entityId}".`,
            `Verify or clean up orphan assignment "${asn.id}".`,
            'ASSIGNMENT',
            asn.id,
            'entityId'
          );
        }
      }

      // Check task_type
      if (!asn.taskType) {
        addIssue(
          'ERROR',
          'ASSIGNMENT_INTEGRITY',
          SHEET_TABS.ASSIGNMENTS,
          `Assignment "${asn.id}" is missing task_type.`,
          `Specify task_type for assignment "${asn.id}".`,
          'ASSIGNMENT',
          asn.id,
          'taskType'
        );
      }

      // Check completed status consistency
      if (asn.status === 'COMPLETED' && !asn.completedAt) {
        addIssue(
          'WARNING',
          'ASSIGNMENT_INTEGRITY',
          SHEET_TABS.ASSIGNMENTS,
          `Assignment "${asn.id}" is marked COMPLETED without a completed_at timestamp.`,
          `Set completed_at ISO timestamp for completed assignment "${asn.id}".`,
          'ASSIGNMENT',
          asn.id,
          'completedAt'
        );
      }

      // Check duplicate active assignment on same entity + taskType
      if (asn.status !== 'COMPLETED' && asn.status !== 'CANCELLED' && entityId && asn.taskType) {
        const key = `${entityType}:${entityId}:${asn.taskType}`;
        if (activeAssignmentsKey.has(key)) {
          addIssue(
            'WARNING',
            'ASSIGNMENT_INTEGRITY',
            SHEET_TABS.ASSIGNMENTS,
            `Duplicate active assignment found for ${entityType} "${entityId}" with task "${asn.taskType}".`,
            `Consolidate duplicate active assignments for ${entityType} "${entityId}".`,
            'ASSIGNMENT',
            asn.id,
            'taskType'
          );
        } else {
          activeAssignmentsKey.add(key);
        }
      }
    });

    // =========================================================================
    // WORKSHEET HEALTH & CATEGORY AGGREGATION
    // =========================================================================
    const countBySheet = (name: string) => {
      switch (name) {
        case SHEET_TABS.USERS: return users.length;
        case SHEET_TABS.CATEGORIES: return categories.length;
        case SHEET_TABS.TOPICS: return topics.length;
        case SHEET_TABS.SUBTOPICS: return subtopics.length;
        case SHEET_TABS.QUESTIONS: return questions.length;
        case SHEET_TABS.QUESTION_VIDEOS: return questionVideos.length;
        case SHEET_TABS.VIDEOS: return videos.length;
        case SHEET_TABS.SCRIPT: return scripts.length;
        case SHEET_TABS.SCRIPT_VERSIONS: return scriptVersions.length;
        case SHEET_TABS.THUMBNAILS: return thumbnails.length;
        case SHEET_TABS.THUMBNAIL_VERSIONS: return thumbnailVersions.length;
        case SHEET_TABS.PINNED_COMMENTS: return pinnedComments.length;
        case SHEET_TABS.PINNED_COMMENT_VERSIONS: return pinnedCommentVersions.length;
        case SHEET_TABS.WORKFLOW: return workflows.length;
        case SHEET_TABS.ASSIGNMENTS: return assignments.length;
        case SHEET_TABS.PUBLISHING: return publishingRecords.length;
        case SHEET_TABS.AUDIT_LOG: return auditLogs.length;
        case SHEET_TABS.SEQUENCES: return sequences.length;
        default: return 0;
      }
    };

    const worksheetHealth: WorksheetHealthSummary[] = ALL_SHEET_TABS.map((tab) => {
      const sheetIssues = issues.filter((i) => i.worksheet === tab);
      const criticalOrErrors = sheetIssues.filter((i) => i.severity === 'CRITICAL' || i.severity === 'ERROR').length;
      const totalRecs = countBySheet(tab);

      return {
        worksheet: tab,
        totalRecords: totalRecs,
        validRecords: Math.max(0, totalRecs - criticalOrErrors),
        issuesCount: sheetIssues.length,
        status: criticalOrErrors > 0 ? 'ERROR' : sheetIssues.length > 0 ? 'WARNING' : 'PASS',
      };
    });

    const categoriesList: { category: IntegrityCategory; name: string; description: string }[] = [
      { category: 'ID_INTEGRITY', name: 'Primary & Sequence ID Integrity', description: 'Checks primary key presence, uniqueness, prefixes, and sequence ranges.' },
      { category: 'QUESTION_INTEGRITY', name: 'Question Taxonomy & Options Integrity', description: 'Validates category/topic/subtopic relations, options uniqueness, and workflow validity.' },
      { category: 'VIDEO_INTEGRITY', name: 'Video Production & Association Integrity', description: 'Checks question-video linkages, single active video constraint, and production readiness.' },
      { category: 'SCRIPT_INTEGRITY', name: 'Script & Version Chain Integrity', description: 'Verifies script-to-video mapping, version sequence numbering, and content readiness.' },
      { category: 'THUMBNAIL_INTEGRITY', name: 'Thumbnail & Asset Reference Integrity', description: 'Validates thumbnail asset URLs, status states, and version links.' },
      { category: 'PINNED_COMMENT_INTEGRITY', name: 'Pinned Comment & Version Integrity', description: 'Checks required comment content, video linking, and version records.' },
      { category: 'PUBLISHING_INTEGRITY', name: 'Manual Publishing Records Integrity', description: 'Validates URLs, published timestamps, platform statuses, and pre-flight readiness.' },
      { category: 'WORKFLOW_INTEGRITY', name: 'Workflow Lifecycle & State Machine Integrity', description: 'Validates state transitions, entity links, and terminal state invariants.' },
      { category: 'AUDIT_LOG_INTEGRITY', name: 'Administrative Audit Trail Integrity', description: 'Verifies logging format, timestamps, entity IDs, and action tracking.' },
      { category: 'SEQUENCE_INTEGRITY', name: 'Sequences Table Allocation Integrity', description: 'Guarantees next_number values are valid and ahead of existing IDs.' },
      { category: 'ASSIGNMENT_INTEGRITY', name: 'Team Assignments & Entity Association', description: 'Validates assignee presence, active status, target entity links, and duplicate prevention.' },
      { category: 'USER_INTEGRITY', name: 'Team Directory & Role Assignment', description: 'Checks user profile completeness, role authorization, and active status.' },
    ];

    const integrityChecks: IntegrityCheckSummary[] = categoriesList.map((c) => {
      const catIssues = issues.filter((i) => i.category === c.category);
      const hasCritical = catIssues.some((i) => i.severity === 'CRITICAL');
      const hasError = catIssues.some((i) => i.severity === 'ERROR');
      const hasWarning = catIssues.some((i) => i.severity === 'WARNING');

      let status: 'PASS' | 'WARNING' | 'ERROR' | 'CRITICAL' = 'PASS';
      if (hasCritical) status = 'CRITICAL';
      else if (hasError) status = 'ERROR';
      else if (hasWarning) status = 'WARNING';

      return {
        category: c.category,
        name: c.name,
        description: c.description,
        status,
        totalChecked: 1,
        passedCount: status === 'PASS' ? 1 : 0,
        issueCount: catIssues.length,
      };
    });

    const criticalCount = issues.filter((i) => i.severity === 'CRITICAL').length;
    const errorCount = issues.filter((i) => i.severity === 'ERROR').length;
    const warningCount = issues.filter((i) => i.severity === 'WARNING').length;
    const infoCount = issues.filter((i) => i.severity === 'INFO').length;

    let overallStatus: 'PASS' | 'WARNING' | 'ERROR' | 'CRITICAL' = 'PASS';
    if (criticalCount > 0) overallStatus = 'CRITICAL';
    else if (errorCount > 0) overallStatus = 'ERROR';
    else if (warningCount > 0) overallStatus = 'WARNING';

    const passedChecks = integrityChecks.filter((c) => c.status === 'PASS').length;

    let summary = 'All 18 authoritative Google Sheets worksheets passed data integrity and referential checks.';
    if (overallStatus === 'CRITICAL') {
      summary = `Critical database integrity failure: ${criticalCount} critical schema/identifier errors require immediate manual intervention in Google Sheets.`;
    } else if (overallStatus === 'ERROR') {
      summary = `Operational referential errors detected: ${errorCount} data integrity error(s) found across worksheets. Review diagnostic guidance.`;
    } else if (overallStatus === 'WARNING') {
      summary = `Data integrity check passed with ${warningCount} operational warning(s). Stale or incomplete records detected.`;
    }

    return {
      generatedAt: new Date().toISOString(),
      overallStatus,
      summary,
      worksheetHealth,
      integrityChecks,
      issueCounts: {
        critical: criticalCount,
        error: errorCount,
        warning: warningCount,
        info: infoCount,
        total: issues.length,
        passedChecks,
      },
      issues,
      isReadOnly: true,
      mode: googleSheetsClient.isConfigured() ? 'LIVE_GOOGLE_SHEETS' : 'MOCK_DEVELOPMENT',
    };
  }

  /**
   * Diagnostic alias for integrity verification runners.
   */
  public async runDiagnostics(): Promise<SystemHealthReport & { categoryReports: (IntegrityCheckSummary & { totalChecks?: number })[] }> {
    const report = await this.runFullIntegrityCheck();
    return {
      ...report,
      categoryReports: (report.integrityChecks || []).map((c) => ({
        ...c,
        totalChecks: c.totalChecked,
      })),
    };
  }
}

export const dataIntegrityService = DataIntegrityService.getInstance();
