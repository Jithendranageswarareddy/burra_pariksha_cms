/**
 * BURRA PARIKSHA CMS - Express Server API Routes
 * Phase 2: Google Sheets Database Architecture & Persistence
 * 
 * Provides server-side API endpoints wrapping the service and repository layers.
 * Google service account credentials and Sheets API calls remain strictly server-side.
 */

import express, { Request, Response } from 'express';
import {
  assignmentService,
  auditService,
  authService,
  dashboardService,
  dataIntegrityService,
  operationalHealthService,
  operationalRecoveryService,
  pinnedCommentService,
  planningService,
  productionSheetInitializer,
  publishingService,
  questionService,
  scriptService,
  sequenceSafetyService,
  similarityService,
  spreadsheetVerificationService,
  taxonomyService,
  thumbnailService,
  videoService,
  workflowService,
} from '../lib/services';
import { geminiService } from '../lib/ai/gemini.service';
import { geminiClient } from '../lib/ai/gemini.client';
import { googleSheetsClient } from '../lib/google-sheets/client';
import { QuestionStatus, UserRole } from '../types';
import { usersRepository } from '../lib/repositories/users.repository';
import {
  AiContentPlanRequestSchema,
  CancelAssignmentInputSchema,
  CompleteAssignmentInputSchema,
  CreateAssignmentInputSchema,
  CreateContentBatchInputSchema,
  CreateContentPlanInputSchema,
  CreateUserInputSchema,
  LinkBatchQuestionsInputSchema,
  ReassignAssignmentInputSchema,
  UpdateAssignmentInputSchema,
  UpdateContentBatchInputSchema,
  UpdateContentPlanInputSchema,
  UpdateUserInputSchema,
} from '../lib/schemas/google-sheets-schema';
import { requireAuth, requireRole, extractSessionToken, AuthenticatedRequest } from './middleware/auth.middleware';

export const apiRouter = express.Router();

apiRouter.use(express.json());

/**
 * Helper to derive actor identity safely from verified session context (req.user)
 * Falls back to body actor for testing compatibility when not session-authenticated.
 */
export function getRequestActor(req: Request): { id: string; name: string } {
  const authReq = req as AuthenticatedRequest;
  if (authReq.user?.id) {
    return {
      id: authReq.user.id,
      name: authReq.user.name || authReq.user.id,
    };
  }
  return req.body?._actor || req.body?.actor || { id: 'USR-001', name: 'Admin / Content Lead' };
}

// ----------------------------------------------------
// Public Endpoints: Authentication, Health, System Diagnostics, & Verification
// ----------------------------------------------------

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { userId, password } = req.body || {};
    if (!userId || !password) {
      res.status(400).json({ success: false, error: 'User ID and password are required.' });
      return;
    }

    const result = await authService.login(userId, password);
    if (!result.success || !result.token || !result.user) {
      res.status(401).json({ success: false, error: result.error || 'Invalid credentials.' });
      return;
    }

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('bp_session', result.token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    res.json({
      success: true,
      user: result.user,
      token: result.token,
    });
  } catch {
    res.status(500).json({ success: false, error: 'Internal authentication error.' });
  }
});

apiRouter.post('/auth/logout', async (req: Request, res: Response) => {
  try {
    const token = extractSessionToken(req);
    if (token) {
      const payload = authService.verifySessionToken(token);
      if (payload) {
        await authService.logout(payload.userId, payload.name);
      }
    }

    res.clearCookie('bp_session', { path: '/' });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to complete logout.' });
  }
});

apiRouter.get('/auth/me', async (req: Request, res: Response) => {
  try {
    const token = extractSessionToken(req);

    if (!token) {
      res.status(401).json({ authenticated: false, error: 'No active session.' });
      return;
    }

    const payload = authService.verifySessionToken(token);
    if (!payload) {
      res.clearCookie('bp_session', { path: '/' });
      res.status(401).json({ authenticated: false, error: 'Invalid or expired session.' });
      return;
    }

    const user = await usersRepository.findById(payload.userId);
    if (!user || !user.isActive) {
      res.clearCookie('bp_session', { path: '/' });
      res.status(401).json({ authenticated: false, error: 'User is inactive or not found.' });
      return;
    }

    res.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        last_login_at: user.last_login_at,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch {
    res.status(500).json({ authenticated: false, error: 'Session verification error.' });
  }
});

apiRouter.get('/health', (req: Request, res: Response) => {
  const isConfigured = googleSheetsClient.isConfigured();
  res.json({
    status: 'ok',
    mode: isConfigured ? 'GOOGLE_SHEETS_PRODUCTION' : 'LOCAL_MEMORY_FALLBACK',
    timestamp: new Date().toISOString(),
    databaseConfigured: isConfigured,
  });
});

apiRouter.get('/sheets/health', async (req: Request, res: Response) => {
  try {
    const report = await spreadsheetVerificationService.verifySpreadsheet();
    // Mask sensitive spreadsheet ID for unauthenticated callers
    const sanitizedReport = {
      ...report,
      spreadsheetId: report.spreadsheetId ? `${report.spreadsheetId.substring(0, 4)}...${report.spreadsheetId.substring(report.spreadsheetId.length - 4)}` : '(Not configured)',
    };
    res.json(sanitizedReport);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to verify Google Sheets database',
      message: err?.message || 'Unknown error',
    });
  }
});

apiRouter.post('/sheets/initialize', async (req: Request, res: Response) => {
  try {
    const bootstrapSecret = process.env.BOOTSTRAP_SECRET;
    const providedSecret = req.headers['x-bootstrap-secret'] || req.body?.bootstrapSecret;

    const isSecretValid = Boolean(bootstrapSecret && providedSecret === bootstrapSecret);

    let isAdminSession = false;
    const token = extractSessionToken(req);
    if (token) {
      const payload = authService.verifySessionToken(token);
      if (payload && payload.role === UserRole.ADMIN) {
        isAdminSession = true;
      }
    }

    if (!isSecretValid && !isAdminSession) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Valid bootstrap secret or ADMIN session is required for spreadsheet initialization.',
      });
      return;
    }

    const report = await productionSheetInitializer.initializeSpreadsheet();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to initialize Google Sheets database',
      message: err?.message || 'Unknown error',
    });
  }
});

apiRouter.get('/system/health/integrity', async (req: Request, res: Response) => {
  try {
    const report = await dataIntegrityService.runFullIntegrityCheck();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to run data integrity diagnostics',
      message: err?.message || 'Unknown error',
    });
  }
});

apiRouter.get('/system/health', async (req: Request, res: Response) => {
  try {
    const report = await dataIntegrityService.runFullIntegrityCheck();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to run system health diagnostics',
      message: err?.message || 'Unknown error',
    });
  }
});

apiRouter.get('/system/readiness', async (req: Request, res: Response) => {
  try {
    const isConfigured = googleSheetsClient.isConfigured();
    res.json({
      status: 'ready',
      database: isConfigured ? 'GOOGLE_SHEETS_PRODUCTION' : 'LOCAL_MEMORY_FALLBACK',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'unready',
      error: err?.message || 'Readiness diagnostic failed',
    });
  }
});

// Verification Test Runners (Available only in non-production environments for automated CI/diagnostic suites)
apiRouter.get('/tests/phase8b', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runPhase8bVerification } = await import('../tests/phase8b-verification');
    const result = await runPhase8bVerification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 8B tests failed' });
  }
});

apiRouter.get('/tests/phase9', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runPhase9Verification } = await import('../tests/phase9-verification');
    const result = await runPhase9Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 9 tests failed' });
  }
});

apiRouter.get('/tests/phase10', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runPhase10Verification } = await import('../tests/phase10-verification');
    const result = await runPhase10Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 10 tests failed' });
  }
});

apiRouter.get('/tests/phase11b', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runPhase11bAuthVerification } = await import('../tests/phase11b-auth-verification');
    const result = await runPhase11bAuthVerification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 11B tests failed' });
  }
});

apiRouter.get('/tests/task9', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runTask9AuthVerification } = await import('../tests/task9-auth-verification');
    const result = await runTask9AuthVerification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 9 tests failed' });
  }
});

apiRouter.get('/tests/task2b', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runTask2bTaxonomyVerification } = await import('../tests/task2b-taxonomy-verification');
    const result = await runTask2bTaxonomyVerification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 2B tests failed' });
  }
});

apiRouter.get('/tests/task2c', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runTask2cQuestionVerification } = await import('../tests/task2c-question-verification');
    const result = await runTask2cQuestionVerification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 2C tests failed' });
  }
});

apiRouter.get('/tests/task3d1', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runTask3D1Verification } = await import('../tests/task3d1-assignment-verification');
    const result = await runTask3D1Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 3D.1 tests failed' });
  }
});

apiRouter.get('/tests/task3d2', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runTask3D2Verification } = await import('../tests/task3d2-rbac-verification');
    const result = await runTask3D2Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 3D.2 tests failed' });
  }
});

apiRouter.get('/tests/task3d3', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runTask3D3Verification } = await import('../tests/task3d3-review-workflow-verification');
    const result = await runTask3D3Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 3D.3 tests failed' });
  }
});

apiRouter.get('/tests/task3d4', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runTask3D4Verification } = await import('../tests/task3d4-script-designer-workflow-verification');
    const result = await runTask3D4Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 3D.4 tests failed' });
  }
});

apiRouter.get('/tests/task3d5', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runTask3D5Verification } = await import('../tests/task3d5-workload-dashboard-verification');
    const result = await runTask3D5Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 3D.5 tests failed' });
  }
});

// ----------------------------------------------------
// Authenticated Operational Routes (Phase 11.2)
// All routes declared below strictly require valid session authentication
// ----------------------------------------------------
apiRouter.use(requireAuth);

// Phase 8B: Operational Connectivity & Telemetry Health
apiRouter.get('/system/operational-health', async (req: Request, res: Response) => {
  try {
    const report = await operationalHealthService.getOperationalHealth();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to fetch operational health',
      message: err?.message || 'Unknown error',
    });
  }
});

// Phase 8B: Sequence Safety & Invariant Diagnostics
apiRouter.get('/system/sequence-safety', async (req: Request, res: Response) => {
  try {
    const report = await sequenceSafetyService.auditSequences();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to audit sequence safety',
      message: err?.message || 'Unknown error',
    });
  }
});

// Phase 8B: Operational Recovery State & Action Plans
apiRouter.get('/system/recovery/state', async (req: Request, res: Response) => {
  try {
    const state = await operationalRecoveryService.getRecoveryState();
    res.json(state);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to fetch recovery state',
      message: err?.message || 'Unknown error',
    });
  }
});

// Phase 8B: Explicit Administrative Sequence Synchronization
apiRouter.post('/system/recovery/sync-sequence', requireRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const { entityType, proposedNextNumber, confirmed } = req.body;
    const currentActor = getRequestActor(req);
    const result = await operationalRecoveryService.synchronizeSequence(
      entityType,
      Number(proposedNextNumber),
      currentActor,
      Boolean(confirmed)
    );
    res.json(result);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({
      error: err?.name || 'Sequence Synchronization Failed',
      message: err?.message || 'Failed to synchronize sequence',
    });
  }
});

// ----------------------------------------------------
// Taxonomy Endpoints
// ----------------------------------------------------

apiRouter.get('/taxonomy/tree', async (req: Request, res: Response) => {
  try {
    const tree = await taxonomyService.getTaxonomyTree();
    res.json(tree);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch taxonomy tree' });
  }
});

apiRouter.get('/categories', async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    if (search) {
      const results = await taxonomyService.searchCategories(search);
      res.json(results);
      return;
    }
    const categories = await taxonomyService.getCategories();
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch categories' });
  }
});

apiRouter.post('/categories', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const category = await taxonomyService.createCategory(req.body, actor);
    res.status(201).json(category);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({ error: err?.message || 'Failed to create category' });
  }
});

apiRouter.get('/topics', async (req: Request, res: Response) => {
  try {
    const categoryId = req.query.categoryId as string | undefined;
    const search = req.query.search as string | undefined;
    if (search) {
      const results = await taxonomyService.searchTopics(search, categoryId);
      res.json(results);
      return;
    }
    const topics = await taxonomyService.getTopics(categoryId);
    res.json(topics);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch topics' });
  }
});

apiRouter.post('/topics', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const topic = await taxonomyService.createTopic(req.body, actor);
    res.status(201).json(topic);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({ error: err?.message || 'Failed to create topic' });
  }
});

apiRouter.get('/subtopics', async (req: Request, res: Response) => {
  try {
    const topicId = req.query.topicId as string | undefined;
    const search = req.query.search as string | undefined;
    if (search) {
      const results = await taxonomyService.searchSubtopics(search, topicId);
      res.json(results);
      return;
    }
    const subtopics = await taxonomyService.getSubtopics(topicId);
    res.json(subtopics);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch subtopics' });
  }
});

apiRouter.post('/subtopics', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const subtopic = await taxonomyService.createSubtopic(req.body, actor);
    res.status(201).json(subtopic);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({ error: err?.message || 'Failed to create subtopic' });
  }
});

// ----------------------------------------------------
// Questions Endpoints
// ----------------------------------------------------

apiRouter.get('/questions', async (req: Request, res: Response) => {
  try {
    const { search, categoryId, topicId, subtopicId, difficulty, status, videoStatus } = req.query;

    const filter = {
      search: typeof search === 'string' ? search : undefined,
      categoryId: typeof categoryId === 'string' ? categoryId : undefined,
      topicId: typeof topicId === 'string' ? topicId : undefined,
      subtopicId: typeof subtopicId === 'string' ? subtopicId : undefined,
      difficulty: typeof difficulty === 'string' ? (difficulty as any) : undefined,
      status: typeof status === 'string' ? (status as any) : undefined,
      videoStatus: typeof videoStatus === 'string' ? (videoStatus as any) : undefined,
    };

    const questions = await questionService.getQuestions(filter);
    res.json(questions);
  } catch (err: any) {
    res.status(err?.statusCode || 500).json({
      error: err?.name || 'Failed to fetch questions',
      message: err?.message || 'Unknown error',
    });
  }
});

apiRouter.get('/questions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const question = await questionService.getQuestionById(id);
    if (!question) {
      return res.status(404).json({ error: `Question with ID "${id}" not found` });
    }
    res.json(question);
  } catch (err: any) {
    res.status(err?.statusCode || 500).json({
      error: err?.name || 'Failed to fetch question',
      message: err?.message || 'Unknown error',
    });
  }
});

apiRouter.post('/questions', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.QUESTION_EDITOR, UserRole.REVIEWER, UserRole.CONTENT_WRITER, UserRole.CREATOR, UserRole.EDITOR]), async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const newQuestion = await questionService.createQuestion(req.body, actor);
    res.status(201).json(newQuestion);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({
      error: err?.name || 'Validation Failed',
      message: err?.message || 'Failed to create question',
      details: err?.details || (err?.errors ? err.errors : undefined),
    });
  }
});

apiRouter.put('/questions/:id', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.QUESTION_EDITOR, UserRole.REVIEWER, UserRole.CONTENT_WRITER, UserRole.CREATOR, UserRole.EDITOR]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const actor = getRequestActor(req);
    const updatedQuestion = await questionService.updateQuestion(id, req.body, actor);
    res.json(updatedQuestion);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({
      error: err?.name || 'Update Failed',
      message: err?.message || 'Failed to update question',
      details: err?.details || (err?.errors ? err.errors : undefined),
    });
  }
});

apiRouter.post('/questions/check-duplicate', async (req: Request, res: Response) => {
  try {
    const { text, excludeId } = req.body;
    if (!text || typeof text !== 'string') {
      return res.json({ isDuplicate: false, matches: [] });
    }
    const matches = await questionService.detectDuplicates(text, excludeId);
    res.json({
      isDuplicate: matches.length > 0,
      matches,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Duplicate check failed', message: err?.message || 'Unknown error' });
  }
});

apiRouter.post('/questions/:id/queue', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body || {};
    const currentActor = getRequestActor(req);
    const queuedQuestion = await questionService.queueQuestion(id, currentActor, remarks);
    res.json(queuedQuestion);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({
      error: err?.name || 'Queueing Failed',
      message: err?.message || 'Failed to add question to video queue',
    });
  }
});

apiRouter.patch('/questions/:id/status', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.QUESTION_EDITOR, UserRole.REVIEWER]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const currentActor = getRequestActor(req);
    const updated = await questionService.updateStatus(id, status as QuestionStatus, currentActor, remarks);
    res.json(updated);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({
      error: err?.name || 'Status Update Failed',
      message: err?.message || 'Failed to update question status',
    });
  }
});

// ----------------------------------------------------
// Videos & Production Endpoints (Phase 5)
// ----------------------------------------------------

apiRouter.get('/videos', async (req: Request, res: Response) => {
  try {
    const filter = {
      status: req.query.status as any,
      priority: req.query.priority as any,
      search: req.query.search as string,
      categoryId: req.query.categoryId as string,
      topicId: req.query.topicId as string,
      difficulty: req.query.difficulty as any,
      assignedHost: req.query.assignedHost as string,
      assignedEditor: req.query.assignedEditor as string,
    };
    const videos = await videoService.getVideos(filter);
    res.json(videos);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch videos' });
  }
});

apiRouter.get('/videos/stats', async (req: Request, res: Response) => {
  try {
    const stats = await videoService.getProductionStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch production stats' });
  }
});

apiRouter.get('/videos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const video = await videoService.getVideoById(id);
    if (!video) {
      return res.status(404).json({ error: 'Video Not Found', message: `Video with ID "${id}" was not found.` });
    }
    res.json(video);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch video' });
  }
});

apiRouter.post('/videos/queue', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const video = await videoService.queueApprovedQuestion(req.body, actor);
    res.status(201).json(video);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({
      error: err?.name || 'Queueing Failed',
      message: err?.message || 'Failed to queue question for video production',
    });
  }
});

apiRouter.patch('/videos/:id/status', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.VIDEO_EDITOR]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, remarks, actualDurationSeconds } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const currentActor = getRequestActor(req);
    const updated = await videoService.transitionStatus(id, status, currentActor, remarks, actualDurationSeconds);
    res.json(updated);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({
      error: err?.name || 'Status Transition Failed',
      message: err?.message || 'Failed to update video status',
    });
  }
});

apiRouter.patch('/videos/:id/priority', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { priority, remarks } = req.body;
    if (!priority) {
      return res.status(400).json({ error: 'Priority is required' });
    }

    const currentActor = getRequestActor(req);
    const updated = await videoService.updatePriority(id, priority, currentActor, remarks);
    res.json(updated);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({
      error: err?.name || 'Priority Update Failed',
      message: err?.message || 'Failed to update video priority',
    });
  }
});

apiRouter.post('/videos/:id/assignments', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const actor = getRequestActor(req);
    const assignment = await videoService.assignVideo(id, req.body, actor);
    res.status(201).json(assignment);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({
      error: err?.name || 'Assignment Failed',
      message: err?.message || 'Failed to assign video',
    });
  }
});

apiRouter.put('/videos/:id', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.VIDEO_EDITOR]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const actor = getRequestActor(req);
    const updated = await videoService.updateVideoMetadata(id, req.body, actor);
    res.json(updated);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({
      error: err?.name || 'Update Failed',
      message: err?.message || 'Failed to update video metadata',
    });
  }
});

// ----------------------------------------------------
// Script Management Endpoints (Phase 6)
// ----------------------------------------------------

apiRouter.get('/videos/:videoId/script', async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const result = await scriptService.getScriptByVideoId(videoId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch script' });
  }
});

apiRouter.get('/scripts/:scriptId/versions', async (req: Request, res: Response) => {
  try {
    const { scriptId } = req.params;
    const versions = await scriptService.getScriptVersions(scriptId);
    res.json(versions);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch script versions' });
  }
});

apiRouter.post('/videos/:videoId/script', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.SCRIPT_WRITER, UserRole.CONTENT_WRITER]), async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const actor = getRequestActor(req);
    const result = await scriptService.saveScript(videoId, req.body, actor);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to save script' });
  }
});

apiRouter.post('/videos/:videoId/script/generate', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.SCRIPT_WRITER, UserRole.CONTENT_WRITER]), async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const result = await scriptService.generateTeluguScriptForVideo(videoId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to generate Telugu script' });
  }
});

apiRouter.post('/scripts/:scriptId/revert', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.SCRIPT_WRITER]), async (req: Request, res: Response) => {
  try {
    const { scriptId } = req.params;
    const { versionNumber } = req.body;
    const currentActor = getRequestActor(req);
    const reverted = await scriptService.revertToVersion(scriptId, Number(versionNumber), currentActor);
    res.json(reverted);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to revert script version' });
  }
});

apiRouter.post('/videos/:videoId/script/mark-ready', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.SCRIPT_WRITER]), async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const { remarks } = req.body;
    const currentActor = getRequestActor(req);
    const result = await scriptService.markScriptReady(videoId, currentActor, remarks);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to mark script ready' });
  }
});

apiRouter.post('/videos/:videoId/script/return-to-editing', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const { remarks } = req.body;
    const currentActor = getRequestActor(req);
    const result = await scriptService.returnScriptToEditing(videoId, currentActor, remarks);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to return script to editing' });
  }
});

// ----------------------------------------------------
// Thumbnail Management Endpoints (Phase 6)
// ----------------------------------------------------

apiRouter.get('/videos/:videoId/thumbnail', async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const result = await thumbnailService.getThumbnailByVideoId(videoId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch thumbnail' });
  }
});

apiRouter.get('/thumbnails/:thumbnailId/versions', async (req: Request, res: Response) => {
  try {
    const { thumbnailId } = req.params;
    const versions = await thumbnailService.getThumbnailVersions(thumbnailId);
    res.json(versions);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch thumbnail versions' });
  }
});

apiRouter.post('/videos/:videoId/thumbnail', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.DESIGNER]), async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const actor = getRequestActor(req);
    const result = await thumbnailService.saveThumbnail(videoId, req.body, actor);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to save thumbnail' });
  }
});

apiRouter.patch('/thumbnails/:thumbnailId/status', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { thumbnailId } = req.params;
    const { status, remarks } = req.body;
    const currentActor = getRequestActor(req);
    const updated = await thumbnailService.updateStatus(thumbnailId, status, currentActor, remarks);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to update thumbnail status' });
  }
});

// ----------------------------------------------------
// Pinned Comments Endpoints (Phase 6)
// ----------------------------------------------------

apiRouter.get('/videos/:videoId/pinned-comment', async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const result = await pinnedCommentService.getPinnedCommentByVideoId(videoId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch pinned comment' });
  }
});

apiRouter.post('/videos/:videoId/pinned-comment', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.PUBLISHING_MANAGER, UserRole.CONTENT_WRITER, UserRole.SCRIPT_WRITER]), async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const actor = getRequestActor(req);
    const result = await pinnedCommentService.savePinnedComment(videoId, req.body, actor);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to save pinned comment' });
  }
});

apiRouter.get('/pinned-comments/:pinnedCommentId/versions', async (req: Request, res: Response) => {
  try {
    const { pinnedCommentId } = req.params;
    const versions = await pinnedCommentService.getPinnedCommentVersions(pinnedCommentId);
    res.json(versions);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch pinned comment versions' });
  }
});

apiRouter.patch('/pinned-comments/:pinnedCommentId/status', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { pinnedCommentId } = req.params;
    const { isApproved, remarks } = req.body;
    const actor = getRequestActor(req);
    const updated = await pinnedCommentService.updateApprovalStatus(pinnedCommentId, Boolean(isApproved), actor, remarks);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to update pinned comment approval status' });
  }
});

// ----------------------------------------------------
// Manual Publishing Endpoints (Phase 6)
// ----------------------------------------------------

apiRouter.get('/publishing', async (req: Request, res: Response) => {
  try {
    const publishingList = await publishingService.getPublishingList();
    res.json(publishingList);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch publishing records' });
  }
});

apiRouter.get('/videos/:videoId/publishing', async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const record = await publishingService.getPublishingByVideoId(videoId);
    if (!record) {
      return res.status(404).json({ error: 'Publishing Record Not Found' });
    }
    res.json(record);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch publishing record' });
  }
});

apiRouter.put('/publishing/:id', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.PUBLISHING_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const actor = getRequestActor(req);
    const updated = await publishingService.updatePublishingRecord(id, req.body, actor);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to update publishing record' });
  }
});

apiRouter.get('/videos/:videoId/publishing/readiness', async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const currentActor = getRequestActor(req);
    const result = await publishingService.validatePublishReadiness(videoId, { actor: currentActor });
    res.json(result);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({ error: err?.message || 'Failed to evaluate publish readiness' });
  }
});

apiRouter.post('/videos/:videoId/publishing/publish-platform', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.PUBLISHING_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const { platform, postUrl, notes, forceRePublish, skipReadinessCheck } = req.body;
    if (!platform || !postUrl) {
      return res.status(400).json({ error: 'Platform and postUrl are required' });
    }
    const currentActor = getRequestActor(req);
    const updated = await publishingService.markPlatformPublished(
      videoId,
      platform,
      postUrl,
      currentActor,
      notes,
      { forceRePublish, skipReadinessCheck }
    );
    res.json(updated);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({ error: err?.message || 'Failed to record platform publish' });
  }
});

apiRouter.post('/videos/:videoId/publishing/finalize', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.PUBLISHING_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const { remarks } = req.body;
    const currentActor = getRequestActor(req);
    const result = await publishingService.finalizePublishing(videoId, currentActor, remarks);
    res.json(result);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({ error: err?.message || 'Failed to finalize publishing' });
  }
});

// ----------------------------------------------------
// Audit & Workflow Endpoints
// ----------------------------------------------------

apiRouter.get('/audit-logs', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.query;
    const logs = await auditService.getLogs(
      typeof entityType === 'string' ? entityType : undefined,
      typeof entityId === 'string' ? entityId : undefined
    );
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch audit logs' });
  }
});

apiRouter.get('/workflow/:entityType/:entityId', async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const history = await workflowService.getHistory(entityType, entityId);
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch workflow history' });
  }
});

// ----------------------------------------------------
// Gemini AI Studio Endpoints
// ----------------------------------------------------

apiRouter.get('/ai/status', (req: Request, res: Response) => {
  res.json({
    isConfigured: geminiClient.isConfigured(),
    model: geminiClient.getModelName(),
  });
});

apiRouter.post('/ai/generate', async (req: Request, res: Response) => {
  try {
    const result = await geminiService.generateCandidate(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      error: 'AI Generation Failed',
      message: err?.message || 'Failed to generate question candidate',
    });
  }
});

apiRouter.post('/ai/refine', async (req: Request, res: Response) => {
  try {
    const result = await geminiService.refineCandidate(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      error: 'AI Refinement Failed',
      message: err?.message || 'Failed to refine question candidate',
    });
  }
});

apiRouter.post('/ai/script/generate', async (req: Request, res: Response) => {
  try {
    const result = await geminiService.generateTeluguScript(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      error: 'AI Script Generation Failed',
      message: err?.message || 'Failed to generate Telugu script',
    });
  }
});

// ----------------------------------------------------
// Phase 7: Content Operations Dashboard Endpoints
// ----------------------------------------------------

apiRouter.get('/dashboard/overview', async (req: Request, res: Response) => {
  try {
    const filters = {
      categoryId: req.query.categoryId as string | undefined,
      topicId: req.query.topicId as string | undefined,
      difficulty: req.query.difficulty as string | undefined,
      priority: req.query.priority as string | undefined,
      questionStatus: req.query.questionStatus as string | undefined,
      videoStatus: req.query.videoStatus as string | undefined,
      search: req.query.search as string | undefined,
    };
    const overview = await dashboardService.getOverview(filters);
    res.json(overview);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch dashboard overview' });
  }
});

apiRouter.get('/dashboard/metrics', async (req: Request, res: Response) => {
  try {
    const filters = {
      categoryId: req.query.categoryId as string | undefined,
      topicId: req.query.topicId as string | undefined,
      difficulty: req.query.difficulty as string | undefined,
      priority: req.query.priority as string | undefined,
      questionStatus: req.query.questionStatus as string | undefined,
      videoStatus: req.query.videoStatus as string | undefined,
    };
    const metrics = await dashboardService.getMetrics(filters);
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch dashboard metrics' });
  }
});

apiRouter.get('/dashboard/todays-work', async (req: Request, res: Response) => {
  try {
    const filters = {
      categoryId: req.query.categoryId as string | undefined,
      topicId: req.query.topicId as string | undefined,
      difficulty: req.query.difficulty as string | undefined,
      priority: req.query.priority as string | undefined,
      questionStatus: req.query.questionStatus as string | undefined,
      videoStatus: req.query.videoStatus as string | undefined,
    };
    const work = await dashboardService.getTodaysWork(filters);
    res.json(work);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch today\'s priority work' });
  }
});

apiRouter.get('/dashboard/bottlenecks', async (req: Request, res: Response) => {
  try {
    const filters = {
      categoryId: req.query.categoryId as string | undefined,
      topicId: req.query.topicId as string | undefined,
    };
    const bottlenecks = await dashboardService.getBottlenecks(filters);
    res.json(bottlenecks);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to analyze bottlenecks' });
  }
});

apiRouter.get('/dashboard/stale-content', async (req: Request, res: Response) => {
  try {
    const filters = {
      categoryId: req.query.categoryId as string | undefined,
      topicId: req.query.topicId as string | undefined,
      priority: req.query.priority as string | undefined,
    };
    const stale = await dashboardService.getStaleContent(filters);
    res.json(stale);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to detect stale content' });
  }
});

apiRouter.get('/dashboard/publishing-readiness', async (req: Request, res: Response) => {
  try {
    const filters = {
      categoryId: req.query.categoryId as string | undefined,
      topicId: req.query.topicId as string | undefined,
    };
    const readiness = await dashboardService.getPublishingReadiness(filters);
    res.json(readiness);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to evaluate publishing readiness' });
  }
});

apiRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    const results = await dashboardService.search(query);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Global search failed' });
  }
});

// ----------------------------------------------------
// Verification Suites
// ----------------------------------------------------
apiRouter.get('/tests/phase2', async (req: Request, res: Response) => {
  try {
    const { runPhase2Verification } = await import('../tests/phase2-verification');
    const result = await runPhase2Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 2 tests failed' });
  }
});

apiRouter.get('/tests/phase3', async (req: Request, res: Response) => {
  try {
    const { runPhase3Verification } = await import('../tests/phase3-verification');
    const result = await runPhase3Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 3 tests failed' });
  }
});

apiRouter.get('/tests/phase4', async (req: Request, res: Response) => {
  try {
    const { runPhase4Verification } = await import('../tests/phase4-verification');
    const result = await runPhase4Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 4 tests failed' });
  }
});

apiRouter.get('/tests/phase5', async (req: Request, res: Response) => {
  try {
    const { runPhase5Verification } = await import('../tests/phase5-verification');
    const result = await runPhase5Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 5 tests failed' });
  }
});

apiRouter.get('/tests/phase6', async (req: Request, res: Response) => {
  try {
    const { runPhase6Verification } = await import('../tests/phase6-verification');
    const result = await runPhase6Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 6 tests failed' });
  }
});

apiRouter.get('/tests/phase7', async (req: Request, res: Response) => {
  try {
    const { runPhase7Verification } = await import('../tests/phase7-verification');
    const result = await runPhase7Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 7 tests failed' });
  }
});

apiRouter.get('/tests/phase8a', async (req: Request, res: Response) => {
  try {
    const { runPhase8aVerification } = await import('../tests/phase8a-verification');
    const result = await runPhase8aVerification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 8A tests failed' });
  }
});

apiRouter.get('/tests/task7', async (req: Request, res: Response) => {
  try {
    const { runTask7Verification } = await import('../tests/task7-video-queue-verification');
    const result = await runTask7Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 7 tests failed' });
  }
});

apiRouter.get('/tests/task8', async (req: Request, res: Response) => {
  try {
    const { runTask8Verification } = await import('../tests/task8-publishing-verification');
    const result = await runTask8Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 8 tests failed' });
  }
});

apiRouter.get('/tests/task3e1', async (req: Request, res: Response) => {
  try {
    const { runTask3E1Verification } = await import('../tests/task3e1-my-work-operations-verification');
    const result = await runTask3E1Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 3E.1 tests failed' });
  }
});

// ----------------------------------------------------
// Phase 9: Content Planning, Batch Management & Question Intelligence
// ----------------------------------------------------

apiRouter.get('/planning/plans', async (req: Request, res: Response) => {
  try {
    const { categoryId, topicId, status } = req.query;
    const plans = await planningService.getAllContentPlans({
      categoryId: categoryId as string,
      topicId: topicId as string,
      status: status as any,
    });
    res.json(plans);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch content plans', message: err?.message });
  }
});

apiRouter.post('/planning/plans', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const validated = CreateContentPlanInputSchema.parse(req.body);
    const actor = getRequestActor(req);
    const plan = await planningService.createContentPlan(validated, actor);
    res.status(201).json(plan);
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to create content plan', message: err?.message });
  }
});

apiRouter.get('/planning/plans/:id', async (req: Request, res: Response) => {
  try {
    const plan = await planningService.getContentPlanById(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Content Plan not found' });
    }
    res.json(plan);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch content plan', message: err?.message });
  }
});

apiRouter.put('/planning/plans/:id', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const validated = UpdateContentPlanInputSchema.parse(req.body);
    const actor = getRequestActor(req);
    const plan = await planningService.updateContentPlan(req.params.id, validated, actor);
    res.json(plan);
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to update content plan', message: err?.message });
  }
});

apiRouter.post('/planning/plans/:id/approve', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const plan = await planningService.approveContentPlan(req.params.id, actor);
    res.json(plan);
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to approve content plan', message: err?.message });
  }
});

apiRouter.post('/planning/plans/:id/status', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    const plan = await planningService.transitionPlanStatus(req.params.id, status as any, actor);
    res.json(plan);
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to transition plan status', message: err?.message });
  }
});

apiRouter.delete('/planning/plans/:id', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    await planningService.deleteContentPlan(req.params.id, actor);
    res.json({ success: true, message: `Content Plan '${req.params.id}' deleted` });
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to delete content plan', message: err?.message });
  }
});

apiRouter.get('/planning/batches', async (req: Request, res: Response) => {
  try {
    const { planId, status } = req.query;
    const batches = await planningService.getAllBatchesWithMetrics({
      planId: planId as string,
      status: status as any,
    });
    res.json(batches);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch content batches', message: err?.message });
  }
});

apiRouter.post('/planning/batches', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const validated = CreateContentBatchInputSchema.parse(req.body);
    const actor = getRequestActor(req);
    const batch = await planningService.createContentBatch(validated, actor);
    const metrics = await planningService.getBatchProgressMetrics(batch.id);
    res.status(201).json({ batch, metrics });
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to create content batch', message: err?.message });
  }
});

apiRouter.get('/planning/batches/:id', async (req: Request, res: Response) => {
  try {
    const metrics = await planningService.getBatchProgressMetrics(req.params.id);
    const batches = await planningService.getAllBatchesWithMetrics();
    const match = batches.find((b) => b.batch.id === req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Content Batch not found' });
    }
    res.json({ batch: match.batch, metrics });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch content batch', message: err?.message });
  }
});

apiRouter.put('/planning/batches/:id', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const validated = UpdateContentBatchInputSchema.parse(req.body);
    const actor = getRequestActor(req);
    const batch = await planningService.updateContentBatch(req.params.id, validated, actor);
    const metrics = await planningService.getBatchProgressMetrics(batch.id);
    res.json({ batch, metrics });
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to update content batch', message: err?.message });
  }
});

apiRouter.post('/planning/batches/:id/questions', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const validated = LinkBatchQuestionsInputSchema.parse(req.body);
    const actor = getRequestActor(req);
    const batch = await planningService.linkBatchQuestions(
      req.params.id,
      validated.questionIds,
      validated.action,
      actor
    );
    const metrics = await planningService.getBatchProgressMetrics(batch.id);
    res.json({ batch, metrics });
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to link batch questions', message: err?.message });
  }
});

apiRouter.delete('/planning/batches/:id', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    await planningService.deleteContentBatch(req.params.id, actor);
    res.json({ success: true, message: `Content Batch '${req.params.id}' deleted` });
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to delete content batch', message: err?.message });
  }
});

apiRouter.get('/planning/coverage', async (req: Request, res: Response) => {
  try {
    const coverage = await planningService.getCoverageOverview();
    res.json(coverage);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to compute coverage intelligence', message: err?.message });
  }
});

apiRouter.get('/planning/gaps', async (req: Request, res: Response) => {
  try {
    const gaps = await planningService.getGapAnalysis();
    res.json(gaps);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to compute gap analysis', message: err?.message });
  }
});

apiRouter.get('/planning/similarity-radar', async (req: Request, res: Response) => {
  try {
    const radar = await similarityService.generateDiversityRadarReport();
    res.json(radar);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate similarity radar', message: err?.message });
  }
});

apiRouter.post('/planning/similarity-check', async (req: Request, res: Response) => {
  try {
    const { text, excludeQuestionId, threshold } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Candidate text is required' });
    }
    const matches = await similarityService.findSimilarQuestions(
      text,
      excludeQuestionId,
      threshold ? Number(threshold) : 0.7
    );
    res.json({ matches, isDuplicate: matches.some((m) => m.type === 'EXACT_DUPLICATE') });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to check similarity', message: err?.message });
  }
});

apiRouter.post('/planning/ai-recommendation', async (req: Request, res: Response) => {
  try {
    const validated = AiContentPlanRequestSchema.parse(req.body);
    const recommendation = await geminiService.generateContentPlanRecommendation(validated);
    res.json(recommendation);
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to generate AI plan recommendation', message: err?.message });
  }
});

// ----------------------------------------------------
// PHASE 10: Team Operations & Assignment Endpoints
// ----------------------------------------------------

apiRouter.get('/assignments', async (req: Request, res: Response) => {
  try {
    const filter = {
      entityType: req.query.entityType as any,
      entityId: req.query.entityId as string,
      assigneeId: req.query.assigneeId as string,
      status: req.query.status as any,
      priority: req.query.priority as any,
      taskType: req.query.taskType as any,
      isOverdue: req.query.isOverdue === 'true' ? true : req.query.isOverdue === 'false' ? false : undefined,
    };
    const assignments = await assignmentService.listAssignments(filter);
    res.json(assignments);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch assignments', message: err?.message });
  }
});

apiRouter.post('/assignments', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const validated = CreateAssignmentInputSchema.parse(req.body);
    const actor = getRequestActor(req);
    const assignment = await assignmentService.createAssignment(validated, actor);
    res.status(201).json(assignment);
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to create assignment', message: err?.message });
  }
});

apiRouter.get('/assignments/unassigned', async (req: Request, res: Response) => {
  try {
    const unassigned = await assignmentService.getUnassignedWork();
    res.json(unassigned);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch unassigned work', message: err?.message });
  }
});

apiRouter.get('/assignments/entity/:entityType/:entityId', async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const assignments = await assignmentService.getAssignmentsByEntity(entityType, entityId);
    res.json(assignments);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch entity assignments', message: err?.message });
  }
});

apiRouter.get('/assignments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assignment = await assignmentService.getAssignmentById(id);
    if (!assignment) {
      return res.status(404).json({ error: `Assignment ${id} not found` });
    }
    res.json(assignment);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch assignment', message: err?.message });
  }
});

apiRouter.patch('/assignments/:id', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validated = UpdateAssignmentInputSchema.parse(req.body);
    const actor = getRequestActor(req);
    const updated = await assignmentService.updateAssignment(id, validated, actor);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to update assignment', message: err?.message });
  }
});

apiRouter.post('/assignments/:id/start', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authReq = req as AuthenticatedRequest;
    const assignment = await assignmentService.getAssignmentById(id);
    const isManagerOrAdmin = authReq.user && [UserRole.ADMIN, UserRole.CONTENT_MANAGER].includes(authReq.user.role as UserRole);
    if (!isManagerOrAdmin && authReq.user && assignment.assigneeId !== authReq.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only update your own assigned tasks.' });
    }
    const actor = getRequestActor(req);
    const result = await assignmentService.startAssignment(id, actor);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to start assignment', message: err?.message });
  }
});

apiRouter.post('/assignments/:id/block', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const authReq = req as AuthenticatedRequest;
    const assignment = await assignmentService.getAssignmentById(id);
    const isManagerOrAdmin = authReq.user && [UserRole.ADMIN, UserRole.CONTENT_MANAGER].includes(authReq.user.role as UserRole);
    if (!isManagerOrAdmin && authReq.user && assignment.assigneeId !== authReq.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only update your own assigned tasks.' });
    }
    const currentActor = getRequestActor(req);
    const result = await assignmentService.blockAssignment(id, reason || 'Blocked on dependencies', currentActor);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to block assignment', message: err?.message });
  }
});

apiRouter.post('/assignments/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authReq = req as AuthenticatedRequest;
    const assignment = await assignmentService.getAssignmentById(id);
    const isManagerOrAdmin = authReq.user && [UserRole.ADMIN, UserRole.CONTENT_MANAGER].includes(authReq.user.role as UserRole);
    if (!isManagerOrAdmin && authReq.user && assignment.assigneeId !== authReq.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only update your own assigned tasks.' });
    }
    const validated = CompleteAssignmentInputSchema.parse(req.body);
    const actor = getRequestActor(req);
    const result = await assignmentService.completeAssignment(id, validated, actor);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to complete assignment', message: err?.message });
  }
});

apiRouter.post('/assignments/:id/cancel', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validated = CancelAssignmentInputSchema.parse(req.body);
    const actor = getRequestActor(req);
    const result = await assignmentService.cancelAssignment(id, validated, actor);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to cancel assignment', message: err?.message });
  }
});

apiRouter.post('/assignments/:id/reassign', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validated = ReassignAssignmentInputSchema.parse(req.body);
    const actor = getRequestActor(req);
    const result = await assignmentService.reassign(id, validated, actor);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to reassign assignment', message: err?.message });
  }
});

// Users & Team Directory Endpoints
apiRouter.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await assignmentService.listUsers();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch users', message: err?.message });
  }
});

apiRouter.post('/users', requireRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const validated = CreateUserInputSchema.parse(req.body);
    const actor = getRequestActor(req);
    const user = await assignmentService.createUser(validated, actor);
    res.status(201).json(user);
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to create user', message: err?.message });
  }
});

apiRouter.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await assignmentService.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: `User ${id} not found` });
    }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch user', message: err?.message });
  }
});

apiRouter.patch('/users/:id', requireRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validated = UpdateUserInputSchema.parse(req.body);
    const actor = getRequestActor(req);
    const user = await assignmentService.updateUser(id, validated, actor);
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to update user', message: err?.message });
  }
});

// Team Workload & My Work
apiRouter.get('/team/workload', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const summary = await assignmentService.getTeamWorkloadSummary();
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch team workload summary', message: err?.message });
  }
});

apiRouter.get('/team/workload/:userId', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const workload = await assignmentService.getUserWorkload(userId);
    res.json(workload);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch user workload', message: err?.message });
  }
});

apiRouter.get('/my-work', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const isManagerOrAdmin = authReq.user && [UserRole.ADMIN, UserRole.CONTENT_MANAGER].includes(authReq.user.role as UserRole);
    // Non-admin / non-manager can only access their own work
    let userId = authReq.user?.id || 'USR-001';
    if (isManagerOrAdmin && req.query.userId) {
      userId = req.query.userId as string;
    }
    const myWork = await assignmentService.getMyWorkSummary(userId);
    res.json(myWork);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch my work summary', message: err?.message });
  }
});






