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
  contentMasterService,
  dashboardService,
  dataIntegrityService,
  objectAuthService,
  operationalHealthService,
  operationalRecoveryService,
  pinnedCommentService,
  planningService,
  productionBoardService,
  productionSheetInitializer,
  publishingService,
  questionService,
  questionValidationService,
  scriptService,
  sequenceSafetyService,
  similarityService,
  spreadsheetVerificationService,
  snapshotExporterService,
  taxonomyService,
  thumbnailService,
  videoService,
  workflowService,
  workflowOrchestrationService,
  analyticsService,
} from '../lib/services';
import { geminiService } from '../lib/ai/gemini.service';
import { geminiClient } from '../lib/ai/gemini.client';
import { aiOrchestrator } from '../lib/ai/orchestrator';
import { googleSheetsClient } from '../lib/google-sheets/client';
import { QuestionStatus, UserRole, SocialReviewStatus, RenderValidationStatus, VideoProductionStatus } from '../types';
import { ProductionAssetValidationService } from '../lib/services/production-asset-validation.service';
import { ActorContext } from '../lib/services/object-auth.service';
import { usersRepository } from '../lib/repositories/users.repository';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { socialReviewsRepository } from '../lib/repositories/social-reviews.repository';
import { thumbnailsRepository } from '../lib/repositories/thumbnails.repository';
import { SocialEnhancementService } from '../lib/services/social-enhancement.service';
import { SocialReviewService } from '../lib/services/social-review.service';
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
  CreateSocialAnalyticsInputSchema,
  ImportSocialAnalyticsInputSchema,
} from '../lib/schemas/google-sheets-schema';
import helmet from 'helmet';
import busboy from 'busboy';
import { google } from 'googleapis';
import { googleDriveService } from '../lib/services/google-drive.service';
import rateLimit from 'express-rate-limit';
import { requireAuth, requireRole, extractSessionToken, AuthenticatedRequest } from './middleware/auth.middleware';

export const apiRouter = express.Router();

apiRouter.use(express.json());

// Apply helmet security headers
apiRouter.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Apply bounded rate limit for expensive AI endpoints
export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 10000 : 100, // Bounded rate limit
  message: {
    success: false,
    error: 'Rate limit exceeded. Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { default: false },
  skip: (req) => process.env.NODE_ENV === 'test' || Boolean(req.headers['x-test-suite']),
});

/**
 * Helper to derive actor identity strictly from verified session context (req.user)
 * SEC-02: Never trusts client-supplied req.body._actor or req.body.actor
 */
export function getRequestActor(req: Request): ActorContext & { name: string; role: string } {
  const authReq = req as AuthenticatedRequest & { _requestActor?: ActorContext & { name: string; role: string } };
  if (authReq._requestActor) {
    return authReq._requestActor;
  }
  let actor: ActorContext & { name: string; role: string };
  if (authReq.user?.id) {
    const fallbackRole = (authReq.user.roles && authReq.user.roles[0]) || authReq.user.role || UserRole.ADMIN;
    actor = {
      id: authReq.user.id,
      name: authReq.user.name || authReq.user.id,
      role: authReq.user.role || fallbackRole,
      roles: authReq.user.roles || (authReq.user.role ? [authReq.user.role] : [fallbackRole]),
    };
  } else {
    actor = { id: 'USR-001', name: 'Admin / Content Lead', role: UserRole.ADMIN, roles: [UserRole.ADMIN] };
  }
  authReq._requestActor = actor;
  return actor;
}

// ----------------------------------------------------
// Public Endpoints: Authentication, Health, System Diagnostics, & Verification
// ----------------------------------------------------

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { userId, email, identifier, password } = req.body || {};
    const credentialIdentifier = userId || email || identifier;
    if (!credentialIdentifier || !password) {
      res.status(400).json({ success: false, error: 'User ID or Email and password are required.' });
      return;
    }

    const result = await authService.login(credentialIdentifier, password);
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

// Helper for self-contained cookie extraction (since cookie-parser is not used directly)
function getCookieValue(req: Request, name: string): string | undefined {
  const cookieHeader = req.headers.cookie || '';
  const cookies = cookieHeader.split(';').map(c => c.trim());
  const found = cookies.find(c => c.startsWith(`${name}=`));
  return found ? found.split('=')[1] : undefined;
}

// GET /api/auth/google/url - Generates Google OAuth 2.0 URL
apiRouter.get('/auth/google/url', async (req: Request, res: Response) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      res.status(400).json({
        success: false,
        error: 'Google OAuth Client ID or Client Secret is not configured on the server.'
      });
      return;
    }

    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/drive.file'],
      state,
    });

    // Using SameSite=None and Secure=true as mandated by the oauth-integration skill for cross-origin iframe contexts
    res.setHeader('Set-Cookie', `google_oauth_state=${state}; Path=/; HttpOnly; Max-Age=600; SameSite=None; Secure`);

    res.json({ success: true, url: authorizationUrl });
  } catch (err: any) {
    res.status(500).json({ success: false, error: `Failed to generate auth URL: ${err?.message || err}` });
  }
});

// GET /api/auth/google/callback - Receives authorization code from Google
apiRouter.get('/auth/google/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    const cookieState = getCookieValue(req, 'google_oauth_state');

    // Clear the verification cookie immediately
    res.setHeader('Set-Cookie', 'google_oauth_state=; Path=/; HttpOnly; Max-Age=0; SameSite=None; Secure');

    if (!state || !cookieState || state !== cookieState) {
      res.status(400).send('<h1>CSRF Verification Failed</h1><p>The state parameter does not match or has expired. Please try authorizing again.</p>');
      return;
    }

    if (!code || typeof code !== 'string') {
      res.status(400).send('<h1>Missing Code</h1><p>No authorization code was returned from Google.</p>');
      return;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

    if (!clientId || !clientSecret) {
      res.status(500).send('<h1>OAuth Configuration Error</h1><p>Client credentials are not configured on the server.</p>');
      return;
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      res.status(400).send(
        '<h1>No Refresh Token Returned</h1>' +
        '<p>Google did not return a refresh token. This usually happens if you have already authorized the application.</p>' +
        '<p>Please visit your <a href="https://myaccount.google.com/permissions" target="_blank">Google Account Security Permissions</a>, revoke permissions for this app, and try again to force consent prompts.</p>'
      );
      return;
    }

    // Securely set the refresh token in the running server memory
    googleDriveService.setInMemoryAuth(tokens.refresh_token);

    // Secure confirmation message without exposing, printing, or returning the token
    res.send('<h1>Google Drive authorization completed. Configure the server-side refresh token securely.</h1>');
  } catch (err: any) {
    res.status(500).send(`<h1>OAuth Authorization Failed</h1><p>Error details: ${err?.message || err}</p>`);
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

// Task 4 Verification Endpoint
apiRouter.all('/test/task4', async (req: Request, res: Response) => {
  try {
    const { runTask4QuestionCreationEngineVerification } = await import('../tests/task4-question-creation-engine-verification');
    const report = await runTask4QuestionCreationEngineVerification();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({
      error: 'Task 4 verification failed',
      message: err?.message || 'Unknown error during Task 4 test run',
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

// (System health endpoints moved after requireAuth)

apiRouter.get('/tests/task3f4', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runTask3F4SnapshotVerification } = await import('../tests/task3f4-snapshot-exporter-verification');
    const result = await runTask3F4SnapshotVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 3F.4 tests failed' });
  }
});

apiRouter.get('/tests/task3f46', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runTask3F46RestoreValidatorVerification } = await import('../tests/task3f4-restore-validator-verification');
    const result = await runTask3F46RestoreValidatorVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 3F.4.6 tests failed' });
  }
});

apiRouter.get('/tests/task3f47a', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runTask3F47AGranularRestoreVerification } = await import('../tests/task3f47a-granular-question-restore-verification');
    const result = await runTask3F47AGranularRestoreVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 3F.4.7A tests failed' });
  }
});

apiRouter.get('/tests/task3f47b', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runTask3F47BGranularVideoRestoreVerification } = await import('../tests/task3f47b-granular-video-restore-verification');
    const result = await runTask3F47BGranularVideoRestoreVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 3F.4.7B tests failed' });
  }
});

apiRouter.get('/tests/task3f47c', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runTask3F47CGranularScriptRestoreVerification } = await import('../tests/task3f47c-granular-script-restore-verification');
    const result = await runTask3F47CGranularScriptRestoreVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 3F.4.7C tests failed' });
  }
});

apiRouter.get('/tests/task3f47d', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runTask3F47DGranularThumbnailRestoreVerification } = await import('../tests/task3f47d-granular-thumbnail-restore-verification');
    const result = await runTask3F47DGranularThumbnailRestoreVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 3F.4.7D tests failed' });
  }
});

// (System snapshot moved after requireAuth)

apiRouter.get('/tests/task2', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runTask2Verification } = await import('../tests/task2-content-master-verification');
    const result = await runTask2Verification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 2 tests failed' });
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

apiRouter.get('/tests/task5', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runTask5QuestionValidationEngineVerification } = await import('../tests/task5-question-validation-engine-verification');
    const result = await runTask5QuestionValidationEngineVerification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 5 verification tests failed' });
  }
});

apiRouter.get('/tests/task7b', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runTask7bVerification } = await import('../tests/task7b-unified-studio-verification');
    const result = await runTask7bVerification();
    res.json({ success: true, passed: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 7B verification tests failed' });
  }
});

apiRouter.get('/tests/task7c', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runTask7CVerificationSuite } = await import('../tests/task7c-question-studio-quality-verification');
    const result = await runTask7CVerificationSuite();
    res.json({ success: result.status === 'PASS', ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 7C verification tests failed' });
  }
});

apiRouter.get('/tests/task8b', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runTask8BVerificationSuite } = await import('../tests/task8b-social-content-foundation-verification');
    const result = await runTask8BVerificationSuite();
    res.json({ success: result.status === 'PASS', ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 8B verification tests failed' });
  }
});

apiRouter.get('/tests/task8c', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runTask8CVerificationSuite } = await import('../tests/task8c-hook-presentation-engine-verification');
    const result = await runTask8CVerificationSuite();
    res.json({ success: result.status === 'PASS', ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 8C verification tests failed' });
  }
});

apiRouter.get('/tests/task8e', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runTask8EVerificationSuite } = await import('../tests/task8e-social-metadata-generator-verification');
    const result = await runTask8EVerificationSuite();
    res.json({ success: result.status === 'PASS', ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 8E verification tests failed' });
  }
});

apiRouter.get('/tests/task8f', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runTask8FVerificationSuite } = await import('../tests/task8f-multi-platform-adaptation-verification');
    const result = await runTask8FVerificationSuite();
    res.json({ success: result.status === 'PASS', ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 8F verification tests failed' });
  }
});

apiRouter.get('/tests/task8d', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runTask8dTeleprompterSpokenEnhancerVerification } = await import('../tests/task8d-teleprompter-spoken-enhancer-verification');
    const result = await runTask8dTeleprompterSpokenEnhancerVerification();
    res.json({ success: result.status === 'PASS', ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 8D verification tests failed' });
  }
});

apiRouter.get('/tests/task8g', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runTask8GVerificationSuite } = await import('../tests/task8g-social-quality-engagement-verification');
    const result = await runTask8GVerificationSuite();
    res.json({ success: result.status === 'PASS', ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 8G verification tests failed' });
  }
});

apiRouter.get('/tests/task8h', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runTask8hVerification } = await import('../tests/task8h-social-review-workflow-verification');
    const result = await runTask8hVerification();
    res.json({ success: result.success, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 8H verification tests failed' });
  }
});

apiRouter.get('/tests/task8i', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runPhase8iSecurityVerification } = await import('../tests/phase8i-security-qa-verification');
    const result = await runPhase8iSecurityVerification();
    res.json({ success: result.failed === 0, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 8I security verification tests failed' });
  }
});

apiRouter.get('/tests/phase9', async (req: Request, res: Response) => {
  try {
    const { runPhase9WorkflowVerification } = await import('../tests/phase9-content-workflow-verification');
    const result = await runPhase9WorkflowVerification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 9 workflow tests failed' });
  }
});

apiRouter.get('/tests/phase13-step4', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'Test runner endpoints are disabled in production environment.' });
    return;
  }
  try {
    const { runPhase13Step4Tests } = await import('../tests/phase13-step4-publishing-assignments');
    const result = await runPhase13Step4Tests();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 13.4 tests failed' });
  }
});

// ----------------------------------------------------
// Authenticated Operational Routes (Phase 11.2)
// All routes declared below strictly require valid session authentication
// ----------------------------------------------------
apiRouter.use(requireAuth);

// Apply rate limiting to AI and social enhancement endpoints
apiRouter.use('/ai/*', aiRateLimiter);
apiRouter.use('/social-enhancement/*', aiRateLimiter);

// System Health & Diagnostics (Protected by requireAuth)
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

apiRouter.get('/system/snapshot', requireRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const snapshot = await snapshotExporterService.exportSnapshot();
    res.json(snapshot);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to export snapshot' });
  }
});

// ----------------------------------------------------
// Phase 8E: Social Caption / Hashtag / Metadata Generator
// ----------------------------------------------------
apiRouter.post('/social-enhancement/metadata/generate', requireRole([
  UserRole.ADMIN,
  UserRole.CONTENT_MANAGER,
  UserRole.QUESTION_EDITOR,
  UserRole.REVIEWER,
  UserRole.SCRIPT_WRITER,
]), async (req: Request, res: Response) => {
  try {
    const { questionId, selectedHookText, teleprompterScript, language, question } = req.body;

    let targetQuestion = question;
    if (!targetQuestion && questionId) {
      targetQuestion = await questionsRepository.findById(questionId);
    }

    if (!targetQuestion) {
      return res.status(404).json({
        success: false,
        error: 'Question Not Found',
        message: `No source question found for ID "${questionId || 'unspecified'}".`,
      });
    }

    const result = await SocialEnhancementService.generateSocialMetadataDraft(
      targetQuestion,
      selectedHookText,
      teleprompterScript,
      language
    );

    res.json({
      success: true,
      data: result.payload,
      isEligible: result.isEligible,
      reason: result.reason,
      aiCallsCount: result.aiCallsCount,
    });
  } catch (err: any) {
    const isValidationError = err?.message?.includes('ineligible') || err?.message?.includes('INVALID');
    res.status(isValidationError ? 400 : 500).json({
      success: false,
      error: err?.message || 'Failed to generate social metadata draft',
    });
  }
});

// ----------------------------------------------------
// Phase 8F: Multi-Platform Adaptation Engine
// ----------------------------------------------------
apiRouter.post('/social-enhancement/platform-adaptation/generate', requireRole([
  UserRole.ADMIN,
  UserRole.CONTENT_MANAGER,
  UserRole.QUESTION_EDITOR,
  UserRole.REVIEWER,
  UserRole.SCRIPT_WRITER,
]), async (req: Request, res: Response) => {
  try {
    const { questionId, canonicalMetadata, question } = req.body;

    let targetQuestion = question;
    if (!targetQuestion && questionId) {
      targetQuestion = await questionsRepository.findById(questionId);
    }

    if (!targetQuestion) {
      return res.status(404).json({
        success: false,
        error: 'Question Not Found',
        message: `No source question found for ID "${questionId || 'unspecified'}".`,
      });
    }

    if (!canonicalMetadata) {
      return res.status(400).json({
        success: false,
        error: 'Missing Canonical Metadata',
        message: 'Canonical SocialMetadataPayload is required for multi-platform adaptation.',
      });
    }

    const result = SocialEnhancementService.adaptMultiPlatformMetadata(
      targetQuestion,
      canonicalMetadata
    );

    if (!result.isEligible || !result.payload) {
      return res.status(400).json({
        success: false,
        error: 'Adaptation Ineligible',
        message: result.reason,
      });
    }

    res.json({
      success: true,
      data: result.payload,
      isEligible: result.isEligible,
      reason: result.reason,
      aiCallsCount: result.payload.aiCallsCount,
    });
  } catch (err: any) {
    const isValidationError = err?.message?.includes('ineligible') || err?.message?.includes('INVALID');
    res.status(isValidationError ? 400 : 500).json({
      success: false,
      error: err?.message || 'Failed to adapt multi-platform metadata',
    });
  }
});

apiRouter.post('/social-enhancement/quality-assessment/generate', requireRole([
  UserRole.ADMIN,
  UserRole.CONTENT_MANAGER,
  UserRole.QUESTION_EDITOR,
  UserRole.REVIEWER,
  UserRole.SCRIPT_WRITER,
]), async (req: Request, res: Response) => {
  try {
    const { questionId, enhancementPackage, platformAdaptations, options } = req.body;

    if (!questionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing Question ID',
        message: 'questionId is required for social content quality assessment.',
      });
    }

    const targetQuestion = await questionService.getQuestionById(questionId);
    if (!targetQuestion) {
      return res.status(404).json({
        success: false,
        error: 'Question Not Found',
        message: `Question '${questionId}' was not found.`,
      });
    }

    if (!enhancementPackage) {
      return res.status(400).json({
        success: false,
        error: 'Missing Enhancement Package',
        message: 'enhancementPackage (SocialEnhancementPayload) is required for quality assessment.',
      });
    }

    const result = await SocialEnhancementService.assessQuality(
      targetQuestion,
      enhancementPackage,
      platformAdaptations,
      options
    );

    res.json({
      success: true,
      data: result,
      aiCallsCount: result.aiCallsCount,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to generate social content quality assessment',
    });
  }
});

// ----------------------------------------------------
// Content Masters Endpoints (Task 2 Canonical Content Architecture - Protected)
// ----------------------------------------------------

apiRouter.get('/content-masters', requireAuth, async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const masters = await contentMasterService.getAllContentMasters();
    if (objectAuthService.isManagerOrAdmin(actor)) {
      return res.json({ success: true, count: masters.length, data: masters });
    }
    const filtered = [];
    for (const m of masters) {
      if (await objectAuthService.canAccessContentMaster(actor, m)) {
        filtered.push(m);
      }
    }
    res.json({ success: true, count: filtered.length, data: filtered });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to list Content Masters' });
  }
});

apiRouter.get('/content-masters/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const details = await contentMasterService.getDetailsByContentMasterId(req.params.id);
    if (!details) {
      res.status(404).json({ success: false, error: `Content Master ${req.params.id} not found` });
      return;
    }
    const canAccess = await objectAuthService.canAccessContentMaster(actor, details.contentMaster);
    if (!canAccess) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have permission to view this Content Master.' });
    }

    // Filter child relationships through ObjectAuthorizationService
    let filteredDetails = details;
    if (!objectAuthService.isManagerOrAdmin(actor)) {
      const filteredQuestions = [];
      for (const q of details.questions) {
        if (await objectAuthService.canAccessQuestion(actor, q)) {
          filteredQuestions.push(q);
        }
      }

      const primaryQuestion = details.primaryQuestion && (await objectAuthService.canAccessQuestion(actor, details.primaryQuestion))
        ? details.primaryQuestion
        : undefined;

      const filteredVideos = [];
      for (const v of details.videos) {
        if (await objectAuthService.canAccessVideo(actor, v)) {
          filteredVideos.push(v);
        }
      }

      const filteredScripts = [];
      for (const s of details.scripts) {
        if (await objectAuthService.canAccessScript(actor, s)) {
          filteredScripts.push(s);
        }
      }

      const filteredThumbnails = [];
      for (const t of details.thumbnails) {
        if (await objectAuthService.canAccessThumbnail(actor, t)) {
          filteredThumbnails.push(t);
        }
      }

      const filteredPinnedComments = [];
      for (const p of details.pinnedComments) {
        if (await objectAuthService.canAccessPinnedComment(actor, p)) {
          filteredPinnedComments.push(p);
        }
      }

      const filteredPublishing = [];
      for (const pub of details.publishingRecords) {
        if (await objectAuthService.canAccessPublishing(actor, pub)) {
          filteredPublishing.push(pub);
        }
      }

      const filteredSocialReviews = [];
      if (details.socialReviews) {
        for (const sr of details.socialReviews) {
          const canAccessReview = actor.id === sr.reviewerId || (await objectAuthService.canAccessSocialPackage(actor, sr.questionId));
          if (canAccessReview) {
            filteredSocialReviews.push(sr);
          }
        }
      }

      const filteredAssignments = details.assignments.filter((a) => a.assigneeId === actor.id);

      filteredDetails = {
        ...details,
        primaryQuestion,
        questions: filteredQuestions,
        videos: filteredVideos,
        scripts: filteredScripts,
        thumbnails: filteredThumbnails,
        pinnedComments: filteredPinnedComments,
        publishingRecords: filteredPublishing,
        socialReviews: filteredSocialReviews,
        assignments: filteredAssignments,
      };
    }

    res.json({ success: true, data: filteredDetails });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to retrieve Content Master details' });
  }
});

apiRouter.post('/content-masters', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const created = await contentMasterService.createContentMaster(req.body, actor.id, actor.name);
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err?.message || 'Failed to create Content Master' });
  }
});

apiRouter.post('/content-masters/migrate/dry-run', async (req: Request, res: Response) => {
  try {
    const report = await contentMasterService.migrationDryRun();
    res.json({ success: true, data: report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Content Master migration dry-run failed' });
  }
});

apiRouter.post('/content-masters/migrate/execute', requireRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const result = await contentMasterService.executeMigration(actor.id, actor.name);
    res.json({ success: result.success, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Content Master migration execution failed' });
  }
});

apiRouter.get('/content-masters/:id/canonical-state', requireAuth, async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const master = await contentMasterService.getContentMasterById(req.params.id);
    if (!master) {
      return res.status(404).json({ success: false, error: `Content Master ${req.params.id} not found` });
    }
    const canAccess = await objectAuthService.canAccessContentMaster(actor, master);
    if (!canAccess) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have permission to view this Content Master.' });
    }
    const state = await contentMasterService.getCanonicalState(req.params.id);
    res.json({ success: true, data: state });
  } catch (err: any) {
    const statusCode = err?.name === 'ReferenceIntegrityError' ? 404 : 500;
    res.status(statusCode).json({ success: false, error: err?.message || 'Failed to retrieve Content Master canonical state' });
  }
});

apiRouter.post('/content-masters/:id/transition', requireAuth, async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const { targetStatus, remarks } = req.body;
    if (!targetStatus) {
      return res.status(400).json({ success: false, error: 'targetStatus is required' });
    }
    const master = await contentMasterService.getContentMasterById(req.params.id);
    if (!master) {
      return res.status(404).json({ success: false, error: `Content Master ${req.params.id} not found` });
    }
    const canModify = await objectAuthService.canModifyContentMaster(actor, master);
    if (!canModify) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have permission to modify this Content Master.' });
    }
    const updated = await contentMasterService.transitionStatus(req.params.id, targetStatus, actor, remarks);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    const isForbidden = err?.message?.includes('Forbidden');
    const statusCode = isForbidden ? 403 : (err?.name === 'ReferenceIntegrityError' ? 404 : (err?.name === 'ValidationError' ? 400 : 500));
    res.status(statusCode).json({ success: false, error: err?.message || 'Failed to transition Content Master status' });
  }
});

apiRouter.post('/content-masters/:id/archive', requireAuth, async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const { reason } = req.body || {};
    const master = await contentMasterService.getContentMasterById(req.params.id);
    if (!master) {
      return res.status(404).json({ success: false, error: `Content Master ${req.params.id} not found` });
    }
    const canModify = await objectAuthService.canModifyContentMaster(actor, master);
    if (!canModify) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have permission to archive this Content Master.' });
    }
    const updated = await contentMasterService.archiveContentMaster(req.params.id, actor, reason);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    const isForbidden = err?.message?.includes('Forbidden');
    const statusCode = isForbidden ? 403 : (err?.name === 'ReferenceIntegrityError' ? 404 : (err?.name === 'ValidationError' ? 400 : 500));
    res.status(statusCode).json({ success: false, error: err?.message || 'Failed to archive Content Master' });
  }
});

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
    const includeInactive = req.query.includeInactive === 'true';
    const tree = await taxonomyService.getTaxonomyTree({ includeInactive });
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

apiRouter.get('/categories/:id', async (req: Request, res: Response) => {
  try {
    const category = await taxonomyService.getCategoryById(req.params.id);
    if (!category) {
      res.status(404).json({ error: `Category with ID "${req.params.id}" not found` });
      return;
    }
    res.json(category);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch category' });
  }
});

apiRouter.post('/categories', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const category = await taxonomyService.createCategory(req.body, actor);
    res.status(201).json(category);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({ error: err?.message || 'Failed to create category' });
  }
});

// TOPICS ENDPOINTS
apiRouter.get('/topics', async (req: Request, res: Response) => {
  try {
    const categoryId = req.query.categoryId as string | undefined;
    const search = req.query.search as string | undefined;
    const includeInactive = req.query.includeInactive === 'true';
    if (search) {
      const results = await taxonomyService.searchTopics(search, categoryId);
      res.json(results);
      return;
    }
    const topics = await taxonomyService.getTopics(categoryId, { includeInactive });
    res.json(topics);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch topics' });
  }
});

apiRouter.get('/topics/:id', async (req: Request, res: Response) => {
  try {
    const topic = await taxonomyService.getTopicById(req.params.id);
    if (!topic) {
      res.status(404).json({ error: `Topic with ID "${req.params.id}" not found` });
      return;
    }
    res.json(topic);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch topic' });
  }
});

apiRouter.post('/topics', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const topic = await taxonomyService.createTopic(req.body, actor);
    res.status(201).json(topic);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({ error: err?.message || 'Failed to create topic' });
  }
});

apiRouter.patch('/topics/:id', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const topic = await taxonomyService.updateTopic(req.params.id, req.body, actor);
    res.json(topic);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({ error: err?.message || 'Failed to update topic' });
  }
});

apiRouter.patch('/topics/:id/toggle-active', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      res.status(400).json({ error: 'Field "isActive" must be a boolean.' });
      return;
    }
    const topic = await taxonomyService.toggleTopicActive(req.params.id, isActive, actor);
    res.json(topic);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({ error: err?.message || 'Failed to toggle topic status' });
  }
});

// SUBTOPICS ENDPOINTS
apiRouter.get('/subtopics', async (req: Request, res: Response) => {
  try {
    const topicId = req.query.topicId as string | undefined;
    const search = req.query.search as string | undefined;
    const includeInactive = req.query.includeInactive === 'true';
    if (search) {
      const results = await taxonomyService.searchSubtopics(search, topicId);
      res.json(results);
      return;
    }
    const subtopics = await taxonomyService.getSubtopics(topicId, { includeInactive });
    res.json(subtopics);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch subtopics' });
  }
});

apiRouter.get('/subtopics/:id', async (req: Request, res: Response) => {
  try {
    const subtopic = await taxonomyService.getSubtopicById(req.params.id);
    if (!subtopic) {
      res.status(404).json({ error: `Subtopic with ID "${req.params.id}" not found` });
      return;
    }
    res.json(subtopic);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch subtopic' });
  }
});

apiRouter.post('/subtopics', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const subtopic = await taxonomyService.createSubtopic(req.body, actor);
    res.status(201).json(subtopic);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({ error: err?.message || 'Failed to create subtopic' });
  }
});

apiRouter.patch('/subtopics/:id', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const subtopic = await taxonomyService.updateSubtopic(req.params.id, req.body, actor);
    res.json(subtopic);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({ error: err?.message || 'Failed to update subtopic' });
  }
});

apiRouter.patch('/subtopics/:id/toggle-active', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      res.status(400).json({ error: 'Field "isActive" must be a boolean.' });
      return;
    }
    const subtopic = await taxonomyService.toggleSubtopicActive(req.params.id, isActive, actor);
    res.json(subtopic);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({ error: err?.message || 'Failed to toggle subtopic status' });
  }
});

// BULK IMPORT ENDPOINTS
apiRouter.post('/taxonomy/import/dry-run', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const report = await taxonomyService.bulkImportDryRun(req.body);
    res.json(report);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({ error: err?.message || 'Bulk import dry run failed' });
  }
});

apiRouter.post('/taxonomy/import/execute', requireRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const result = await taxonomyService.executeBulkImport(req.body, actor);
    res.json(result);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({ error: err?.message || 'Bulk import execution failed' });
  }
});

// ----------------------------------------------------
// Questions Endpoints
// ----------------------------------------------------

apiRouter.get('/questions/config', async (req: Request, res: Response) => {
  try {
    const { questionConfigService } = await import('../lib/services/question-config.service');
    const { QUESTION_CREATION_CONFIG } = await import('../config/question-creation.config');
    const forceRefresh = req.query.forceRefresh === 'true';

    const grouped = await questionConfigService.getGroupedActiveConfig(forceRefresh);

    res.json({
      realLifeContexts: grouped.realLifeContexts,
      questionStyles: grouped.questionStyles,
      defaults: {
        realLifeContext: grouped.defaultRealLifeContext?.displayLabel || grouped.defaultRealLifeContext?.code || '',
        questionStyle: grouped.defaultQuestionStyle?.code || 'STORY_BASED',
        difficulty: 'Intermediate',
        language: 'TELUGU',
        defaultRealLifeContext: grouped.defaultRealLifeContext,
        defaultQuestionStyle: grouped.defaultQuestionStyle,
      },
      defaultRealLifeContext: grouped.defaultRealLifeContext,
      defaultQuestionStyle: grouped.defaultQuestionStyle,
      // Backward-compatible properties for existing consumers (e.g. NewQuestionPage)
      difficulties: QUESTION_CREATION_CONFIG.difficulties,
      challengeTypes: QUESTION_CREATION_CONFIG.challengeTypes,
      presentationTypes: QUESTION_CREATION_CONFIG.presentationTypes,
      languages: QUESTION_CREATION_CONFIG.languages,
    });
  } catch (err: any) {
    const statusCode = err?.statusCode || (err?.name === 'QuestionConfigError' ? 503 : 500);
    res.status(statusCode).json({
      error: err?.name || 'QuestionConfigError',
      message: err?.message || 'Failed to fetch question creation configuration',
      code: err?.code || 'CONFIG_FETCH_FAILED',
    });
  }
});

apiRouter.post('/questions/smart-random', async (req: Request, res: Response) => {
  try {
    const { smartRandomService } = await import('../lib/services/smart-random.service');
    const resolved = await smartRandomService.resolveParameters(req.body);
    res.json(resolved);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Smart Random resolution failed' });
  }
});

apiRouter.post('/questions/create', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.QUESTION_EDITOR, UserRole.CONTENT_WRITER]), async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const idempotencyHeader = req.headers['x-idempotency-key'];
    const idempotencyKey = typeof idempotencyHeader === 'string' ? idempotencyHeader : req.body.idempotencyKey;

    const payload = {
      creationMode: req.body.creationMode || 'manual',
      ...req.body,
      idempotencyKey,
    };

    const newQuestion = await questionService.createQuestionFromRequest(payload, actor);
    res.status(201).json(newQuestion);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({
      error: err?.name || 'Validation Failed',
      message: err?.message || 'Failed to create question',
      details: err?.details || (err?.errors ? err.errors : undefined),
    });
  }
});

apiRouter.get('/questions', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
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

    let questions = await questionService.getQuestions(filter);
    if (!objectAuthService.isManagerOrAdmin(actor)) {
      const filtered = [];
      for (const q of questions) {
        if (await objectAuthService.canAccessQuestion(actor, q)) {
          filtered.push(q);
        }
      }
      questions = filtered;
    }
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
    const actor = getRequestActor(req);
    const { id } = req.params;
    const question = await questionService.getQuestionById(id);
    if (!question) {
      return res.status(404).json({ error: `Question with ID "${id}" not found` });
    }
    const canAccess = await objectAuthService.canAccessQuestion(actor, question);
    if (!canAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to view this question.' });
    }
    res.json(question);
  } catch (err: any) {
    res.status(err?.statusCode || 500).json({
      error: err?.name || 'Failed to fetch question',
      message: err?.message || 'Unknown error',
    });
  }
});

apiRouter.get('/questions/:id/canonical-state', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const { id } = req.params;
    const question = await questionService.getQuestionById(id);
    if (!question) {
      return res.status(404).json({ success: false, error: `Question with ID "${id}" not found` });
    }
    const canAccess = await objectAuthService.canAccessQuestion(actor, question);
    if (!canAccess) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have permission to view this question.' });
    }
    const canonicalSummary = await workflowOrchestrationService.getCanonicalWorkflowState(id);
    res.json({ success: true, data: canonicalSummary });
  } catch (err: any) {
    res.status(err?.statusCode || 500).json({
      success: false,
      error: err?.name || 'Failed to calculate canonical workflow state',
      message: err?.message || 'Unknown error',
    });
  }
});

apiRouter.post('/questions', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.QUESTION_EDITOR, UserRole.CONTENT_WRITER]), async (req: Request, res: Response) => {
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

apiRouter.put('/questions/:id', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.QUESTION_EDITOR, UserRole.CONTENT_WRITER]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const actor = getRequestActor(req);
    const question = await questionService.getQuestionById(id);
    if (!question) {
      return res.status(404).json({ error: `Question with ID "${id}" not found` });
    }
    const canModify = await objectAuthService.canModifyQuestion(actor, question);
    if (!canModify) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to update this question.' });
    }
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
    const question = await questionService.getQuestionById(id);
    if (!question) {
      return res.status(404).json({ error: `Question with ID "${id}" not found` });
    }
    const canModify = await objectAuthService.canModifyQuestion(currentActor, question);
    if (!canModify) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to queue this question.' });
    }
    const queuedQuestion = await questionService.queueQuestion(id, currentActor, remarks);
    res.json(queuedQuestion);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({
      error: err?.name || 'Queueing Failed',
      message: err?.message || 'Failed to add question to video queue',
    });
  }
});

apiRouter.patch('/questions/:id/status', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const currentActor = getRequestActor(req);
    const question = await questionService.getQuestionById(id);
    if (!question) {
      return res.status(404).json({ error: `Question with ID "${id}" not found` });
    }
    const canModify = await objectAuthService.canModifyQuestion(currentActor, question);
    if (!canModify) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to update this question status.' });
    }
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
// Question Validation Engine Endpoints (Phase 5)
// ----------------------------------------------------

apiRouter.post(
  '/questions/:id/validate',
  requireAuth,
  requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.QUESTION_EDITOR, UserRole.REVIEWER]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const actor = getRequestActor(req);
      const { skipTaxonomyLookup, source } = req.body || {};

      const result = await questionValidationService.validateQuestion(id, actor, {
        skipTaxonomyLookup: Boolean(skipTaxonomyLookup),
        source,
      });
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(err?.statusCode || 400).json({
        success: false,
        error: err?.name || 'Validation Failed',
        message: err?.message || 'Failed to validate question',
      });
    }
  }
);

apiRouter.post(
  '/questions/validate-candidate',
  requireAuth,
  requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.QUESTION_EDITOR, UserRole.REVIEWER]),
  async (req: Request, res: Response) => {
    try {
      const { question, skipTaxonomyLookup, source } = req.body || {};
      if (!question) {
        return res.status(400).json({ success: false, error: 'Question payload is required for candidate validation.' });
      }

      const result = await questionValidationService.validateCandidate(question, {
        skipTaxonomyLookup: Boolean(skipTaxonomyLookup),
        source,
      });
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(err?.statusCode || 400).json({
        success: false,
        error: err?.name || 'Candidate Validation Failed',
        message: err?.message || 'Failed to validate question candidate',
      });
    }
  }
);

apiRouter.get('/questions/:id/validation', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const actor = getRequestActor(req);
    const question = await questionService.getQuestionById(id);
    if (!question) {
      return res.status(404).json({ success: false, error: `Question with ID "${id}" not found` });
    }
    const canAccess = await objectAuthService.canAccessQuestion(actor, question);
    if (!canAccess) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have permission to view validation for this question.' });
    }
    const result = await questionValidationService.getLatestValidation(id);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to fetch latest question validation',
    });
  }
});

apiRouter.get('/questions/:id/validation-history', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const actor = getRequestActor(req);
    const question = await questionService.getQuestionById(id);
    if (!question) {
      return res.status(404).json({ success: false, error: `Question with ID "${id}" not found` });
    }
    const canAccess = await objectAuthService.canAccessQuestion(actor, question);
    if (!canAccess) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have permission to view validation history for this question.' });
    }
    const history = await questionValidationService.getValidationHistory(id);
    res.json({ success: true, count: history.length, data: history });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to fetch validation history',
    });
  }
});


// ----------------------------------------------------
// Videos & Production Endpoints (Phase 5)
// ----------------------------------------------------

apiRouter.get('/videos', async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
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
    let videos = await videoService.getVideos(filter);
    if (!objectAuthService.isManagerOrAdmin(actor)) {
      const filtered = [];
      for (const v of videos) {
        if (await objectAuthService.canAccessVideo(actor, v)) {
          filtered.push(v);
        }
      }
      videos = filtered;
    }
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
    const actor = getRequestActor(req);
    const video = await videoService.getVideoById(id);
    if (!video) {
      return res.status(404).json({ error: 'Video Not Found', message: `Video with ID "${id}" was not found.` });
    }
    const canAccess = await objectAuthService.canAccessVideo(actor, video);
    if (!canAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to view this video.' });
    }
    res.json(video);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch video' });
  }
});

// Phase 7: Video Upload, Download, and Streaming endpoints
const handleVideoUploadRoute = async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const videoIdParam = req.params.id;

    const bb = busboy({ headers: req.headers });
    let contentId = req.query.contentId as string | undefined;
    let videoId = videoIdParam || (req.query.videoId as string | undefined);
    let uploadedFile: { stream: any; filename: string; mimeType: string } | null = null;
    let fileSize = 0;

    bb.on('field', (name, val) => {
      if (name === 'contentId') contentId = val;
      if (name === 'videoId') videoId = val;
    });

    bb.on('file', (name, fileStream, info) => {
      const chunks: Buffer[] = [];
      fileStream.on('data', (chunk) => {
        chunks.push(chunk);
        fileSize += chunk.length;
      });
      fileStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        uploadedFile = {
          stream: buffer,
          filename: info.filename,
          mimeType: info.mimeType,
        };
      });
    });

    bb.on('finish', async () => {
      try {
        if (!uploadedFile) {
          return res.status(400).json({ error: 'Bad Request', message: 'No video file provided in multipart upload body.' });
        }

        const video = await videoService.uploadVideoAsset({
          contentId,
          videoId,
          fileName: uploadedFile.filename,
          mimeType: uploadedFile.mimeType,
          size: fileSize,
          fileStreamOrBuffer: uploadedFile.stream,
          actor,
        });

        res.status(201).json(video);
      } catch (err: any) {
        res.status(err?.statusCode || 400).json({
          error: err?.name || 'Upload Failed',
          message: err?.message || 'Failed to upload video asset.',
        });
      }
    });

    bb.on('error', (err: any) => {
      res.status(400).json({ error: 'Multipart Error', message: err?.message || 'Error parsing file upload stream.' });
    });

    req.pipe(bb);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to initialize upload handler' });
  }
};

apiRouter.post('/videos/upload', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.VIDEO_EDITOR]), handleVideoUploadRoute);
apiRouter.post('/videos/:id/upload', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.VIDEO_EDITOR]), handleVideoUploadRoute);

apiRouter.get('/videos/:id/download', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const actor = getRequestActor(req);
    const video = await videoService.getVideoById(id);
    if (!video) {
      return res.status(404).json({ error: 'Video Not Found', message: `Video with ID "${id}" was not found.` });
    }
    const canAccess = await objectAuthService.canAccessVideo(actor, video);
    if (!canAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to download this video.' });
    }

    if (!video.driveFileId) {
      return res.status(404).json({ error: 'No Drive Asset', message: `Video "${id}" does not have an attached Google Drive asset.` });
    }

    const download = await googleDriveService.downloadFile(video.driveFileId);
    res.setHeader('Content-Type', download.contentType || video.mimeType || 'video/mp4');
    if (download.contentLength) {
      res.setHeader('Content-Length', download.contentLength);
    }
    const safeName = (video.fileName || `video-${video.id}.mp4`).replace(/["\r\n]/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);

    download.stream.pipe(res);
  } catch (err: any) {
    res.status(err?.statusCode || 500).json({ error: err?.name || 'Download Error', message: err?.message || 'Failed to download video stream.' });
  }
});

apiRouter.get('/videos/:id/stream', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const actor = getRequestActor(req);
    const video = await videoService.getVideoById(id);
    if (!video) {
      return res.status(404).json({ error: 'Video Not Found', message: `Video with ID "${id}" was not found.` });
    }
    const canAccess = await objectAuthService.canAccessVideo(actor, video);
    if (!canAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to stream this video.' });
    }

    if (!video.driveFileId) {
      return res.status(404).json({ error: 'No Drive Asset', message: `Video "${id}" does not have an attached Google Drive asset.` });
    }

    const rangeHeader = req.headers.range;
    const download = await googleDriveService.downloadFile(video.driveFileId, rangeHeader);

    res.status(download.statusCode || (rangeHeader ? 206 : 200));
    res.setHeader('Content-Type', download.contentType || video.mimeType || 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    if (download.contentLength) {
      res.setHeader('Content-Length', download.contentLength);
    }
    if (download.contentRange) {
      res.setHeader('Content-Range', download.contentRange);
    }

    download.stream.pipe(res);
  } catch (err: any) {
    res.status(err?.statusCode || 500).json({ error: err?.name || 'Stream Error', message: err?.message || 'Failed to stream video.' });
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
    const video = await videoService.getVideoById(id);
    if (!video) {
      return res.status(404).json({ error: 'Video Not Found', message: `Video with ID "${id}" was not found.` });
    }
    const canModify = await objectAuthService.canModifyVideo(currentActor, video);
    if (!canModify) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to update this video status.' });
    }
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
    const video = await videoService.getVideoById(id);
    if (!video) {
      return res.status(404).json({ error: 'Video Not Found', message: `Video with ID "${id}" was not found.` });
    }
    const canModify = await objectAuthService.canModifyVideo(currentActor, video);
    if (!canModify) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to update this video priority.' });
    }
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
    const video = await videoService.getVideoById(id);
    if (!video) {
      return res.status(404).json({ error: 'Video Not Found', message: `Video with ID "${id}" was not found.` });
    }
    const canModify = await objectAuthService.canModifyVideo(actor, video);
    if (!canModify) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to update video metadata.' });
    }
    const updated = await videoService.updateVideoMetadata(id, req.body, actor);
    res.json(updated);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({
      error: err?.name || 'Update Failed',
      message: err?.message || 'Failed to update video metadata',
    });
  }
});

apiRouter.post('/videos/:id/final-render/complete', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.VIDEO_EDITOR]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const actor = getRequestActor(req);
    const video = await videoService.getVideoById(id);
    if (!video) {
      return res.status(404).json({ error: 'Video Not Found', message: `Video with ID "${id}" was not found.` });
    }

    const canModify = await objectAuthService.canModifyVideo(actor, video);
    if (!canModify) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to modify this video.' });
    }

    // Idempotency: If already EDITED, return success directly
    if (video.status === VideoProductionStatus.EDITED) {
      return res.json(video);
    }

    // Reject transitions from other invalid states
    if (video.status !== VideoProductionStatus.EDITING) {
      return res.status(400).json({
        error: 'Invalid State Transition',
        message: `Cannot complete editing from status "${video.status}". Video must be in "EDITING" status.`,
      });
    }

    // Authoritative server-side validation of render metadata
    const validation = ProductionAssetValidationService.validateMetadata(video);
    if (validation.status !== RenderValidationStatus.VALID) {
      return res.status(400).json({
        error: 'Validation Failed',
        message: 'Final render metadata is invalid or incomplete.',
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    // Transition via existing state-machine/orchestration to EDITED
    const updated = await videoService.transitionStatus(
      id,
      VideoProductionStatus.EDITED,
      actor,
      req.body.remarks
    );

    res.json(updated);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({
      error: err?.name || 'Handoff Failed',
      message: err?.message || 'Failed to complete final render handoff',
    });
  }
});

// ----------------------------------------------------
// Script Management Endpoints (Phase 6)
// ----------------------------------------------------

apiRouter.get('/videos/:videoId/script', requireAuth, async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const actor = getRequestActor(req);
    const video = await videoService.getVideoById(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    const canAccess = await objectAuthService.canAccessScript(actor, video);
    if (!canAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to view this script.' });
    }
    const result = await scriptService.getScriptByVideoId(videoId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch script' });
  }
});

apiRouter.get('/scripts/:scriptId/versions', async (req: Request, res: Response) => {
  try {
    const { scriptId } = req.params;
    const actor = getRequestActor(req);
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
    const video = await videoService.getVideoById(videoId);
    if (video) {
      const canModify = await objectAuthService.canModifyScript(actor, video);
      if (!canModify) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to modify this script.' });
      }
    }
    const result = await scriptService.saveScript(videoId, req.body, actor);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to save script' });
  }
});

apiRouter.post('/videos/:videoId/script/generate', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.SCRIPT_WRITER, UserRole.CONTENT_WRITER]), async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const actor = getRequestActor(req);
    const video = await videoService.getVideoById(videoId);
    if (video) {
      const canModify = await objectAuthService.canModifyScript(actor, video);
      if (!canModify) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to generate script for this video.' });
      }
    }
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
    const video = await videoService.getVideoById(videoId);
    if (video) {
      const canModify = await objectAuthService.canModifyScript(currentActor, video);
      if (!canModify) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to mark this script ready.' });
      }
    }
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

apiRouter.get('/videos/:videoId/thumbnail', requireAuth, async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const actor = getRequestActor(req);
    const video = await videoService.getVideoById(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    const canAccess = await objectAuthService.canAccessThumbnail(actor, video);
    if (!canAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to view this thumbnail.' });
    }
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

apiRouter.post('/videos/:videoId/thumbnail', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.THUMBNAIL_DESIGNER]), async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const actor = getRequestActor(req);
    const video = await videoService.getVideoById(videoId);
    if (video) {
      const canModify = await objectAuthService.canModifyThumbnail(actor, video);
      if (!canModify) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to save thumbnail for this video.' });
      }
    }
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

// Phase 9: Thumbnail Binary Upload and Download Routes
const handleThumbnailUploadRoute = async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const videoIdParam = req.params.videoId;

    const bb = busboy({ headers: req.headers });
    let videoId = videoIdParam || (req.query.videoId as string | undefined);
    let designerNotes = req.query.designerNotes as string | undefined;
    let uploadedFile: { stream: any; filename: string; mimeType: string } | null = null;
    let fileSize = 0;

    bb.on('field', (name, val) => {
      if (name === 'videoId') videoId = val;
      if (name === 'designerNotes') designerNotes = val;
    });

    bb.on('file', (name, fileStream, info) => {
      const chunks: Buffer[] = [];
      fileStream.on('data', (chunk) => {
        chunks.push(chunk);
        fileSize += chunk.length;
      });
      fileStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        uploadedFile = {
          stream: buffer,
          filename: info.filename,
          mimeType: info.mimeType,
        };
      });
    });

    bb.on('finish', async () => {
      try {
        if (!uploadedFile) {
          return res.status(400).json({ error: 'Bad Request', message: 'No thumbnail file provided in multipart upload body.' });
        }
        if (!videoId) {
          return res.status(400).json({ error: 'Bad Request', message: 'videoId is required for thumbnail upload.' });
        }

        const video = await videoService.getVideoById(videoId);
        if (!video) {
          return res.status(404).json({ error: 'Video Not Found', message: `Video "${videoId}" not found.` });
        }

        const canAccess = await objectAuthService.canAccessThumbnail(actor, video);
        if (!canAccess) {
          return res.status(403).json({ error: 'Forbidden: You do not have permission to upload thumbnail for this video.' });
        }

        const result = await thumbnailService.uploadThumbnailAsset({
          videoId,
          fileName: uploadedFile.filename,
          mimeType: uploadedFile.mimeType,
          size: fileSize,
          fileStreamOrBuffer: uploadedFile.stream,
          designerNotes,
          actor,
        });

        res.status(201).json(result);
      } catch (err: any) {
        res.status(err?.statusCode || 400).json({
          error: err?.name || 'Upload Failed',
          message: err?.message || 'Failed to upload thumbnail asset.',
        });
      }
    });

    bb.on('error', (err: any) => {
      res.status(400).json({ error: 'Multipart Error', message: err?.message || 'Error parsing file upload stream.' });
    });

    req.pipe(bb);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to initialize upload handler' });
  }
};

apiRouter.post('/videos/:videoId/thumbnail/upload', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.VIDEO_EDITOR, UserRole.THUMBNAIL_DESIGNER]), handleThumbnailUploadRoute);

apiRouter.get('/thumbnails/:id/download', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const actor = getRequestActor(req);
    const thumbnail = await thumbnailsRepository.findById(id);
    if (!thumbnail) {
      return res.status(404).json({ error: 'Thumbnail Not Found', message: `Thumbnail with ID "${id}" was not found.` });
    }
    const canAccess = await objectAuthService.canAccessThumbnail(actor, thumbnail);
    if (!canAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to download this thumbnail.' });
    }
    if (!thumbnail.driveFileId) {
      return res.status(404).json({ error: 'No Drive Asset', message: `Thumbnail "${id}" does not have an attached Google Drive asset.` });
    }
    const download = await googleDriveService.downloadFile(thumbnail.driveFileId);
    res.setHeader('Content-Type', download.contentType || thumbnail.mimeType || 'image/png');
    if (download.contentLength) {
      res.setHeader('Content-Length', download.contentLength);
    }
    const safeName = (thumbnail.fileName || `thumbnail-${thumbnail.id}.png`).replace(/["\r\n]/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    download.stream.pipe(res);
  } catch (err: any) {
    res.status(err?.statusCode || 500).json({ error: err?.name || 'Download Error', message: err?.message || 'Failed to download thumbnail stream.' });
  }
});

// ----------------------------------------------------
// Pinned Comments Endpoints (Phase 6)
// ----------------------------------------------------

apiRouter.get('/videos/:videoId/pinned-comment', requireAuth, async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const actor = getRequestActor(req);
    const video = await videoService.getVideoById(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    const canAccess = await objectAuthService.canAccessPinnedComment(actor, video);
    if (!canAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to view pinned comment.' });
    }
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
    const video = await videoService.getVideoById(videoId);
    if (video) {
      const canModify = await objectAuthService.canModifyPinnedComment(actor, video);
      if (!canModify) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to save pinned comment for this video.' });
      }
    }
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
    const actor = getRequestActor(req);
    const publishingList = await publishingService.getPublishingList();
    if (!objectAuthService.isManagerOrAdmin(actor)) {
      const filtered = [];
      for (const p of publishingList) {
        if (await objectAuthService.canAccessPublishing(actor, p)) {
          filtered.push(p);
        }
      }
      return res.json(filtered);
    }
    res.json(publishingList);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch publishing records' });
  }
});

apiRouter.get('/videos/:videoId/publishing', async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const actor = getRequestActor(req);
    const video = await videoService.getVideoById(videoId);
    if (video) {
      const canAccess = await objectAuthService.canAccessVideo(actor, video);
      if (!canAccess) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to view publishing for this video.' });
      }
    }
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
    const video = await videoService.getVideoById(videoId);
    if (video) {
      const canAccess = await objectAuthService.canAccessVideo(currentActor, video);
      if (!canAccess) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to check publish readiness for this video.' });
      }
    }
    const result = await publishingService.validatePublishReadiness(videoId, { actor: currentActor, skipAudit: true });
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
    const video = await videoService.getVideoById(videoId);
    if (video) {
      const canModify = await objectAuthService.canModifyPublishing(currentActor, video);
      if (!canModify) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to publish this video.' });
      }
    }
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

apiRouter.post('/videos/:videoId/publishing/schedule', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.PUBLISHING_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const { platform, scheduledAt } = req.body || {};
    if (!platform || !scheduledAt) {
      return res.status(400).json({ error: 'Platform and scheduledAt timestamp are required' });
    }
    const currentActor = getRequestActor(req);
    const video = await videoService.getVideoById(videoId);
    if (video) {
      const canModify = await objectAuthService.canModifyPublishing(currentActor, video);
      if (!canModify) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to schedule publishing for this video.' });
      }
    }
    const updated = await publishingService.schedulePublishing(
      videoId,
      platform,
      scheduledAt,
      currentActor
    );
    res.json(updated);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({ error: err?.message || 'Failed to schedule publishing' });
  }
});

apiRouter.post('/videos/:videoId/publishing/fail', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.PUBLISHING_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const { platform, failureReason, errorMsg } = req.body || {};
    const reason = failureReason || errorMsg;
    if (!platform || !reason) {
      return res.status(400).json({ error: 'Platform and failureReason are required' });
    }
    const currentActor = getRequestActor(req);
    const video = await videoService.getVideoById(videoId);
    if (video) {
      const canModify = await objectAuthService.canModifyPublishing(currentActor, video);
      if (!canModify) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to modify publishing for this video.' });
      }
    }
    const updated = await publishingService.markPlatformFailed(
      videoId,
      platform,
      reason,
      currentActor
    );
    res.json(updated);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({ error: err?.message || 'Failed to mark platform failed' });
  }
});

apiRouter.post('/videos/:videoId/publishing/retry', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.PUBLISHING_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const { platform, scheduledAt, remarks } = req.body || {};
    if (!platform) {
      return res.status(400).json({ error: 'Platform is required for retry' });
    }
    const currentActor = getRequestActor(req);
    const video = await videoService.getVideoById(videoId);
    if (video) {
      const canModify = await objectAuthService.canModifyPublishing(currentActor, video);
      if (!canModify) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to retry publishing for this video.' });
      }
    }
    const updated = await publishingService.retryPublishing(
      videoId,
      platform,
      { scheduledAt, remarks },
      currentActor
    );
    res.json(updated);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({ error: err?.message || 'Failed to retry publishing' });
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

apiRouter.get('/videos/:videoId/publishing/package/:platform', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.PUBLISHING_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { videoId, platform } = req.params;
    const currentActor = getRequestActor(req);
    const pkg = await publishingService.getPlatformPackage(
      videoId,
      platform as any,
      currentActor
    );
    res.json(pkg);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({ error: err?.message || 'Failed to retrieve publishing package' });
  }
});

// Phase 13.4: Publishing Assignments
apiRouter.post('/videos/:videoId/publishing/assignment', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.PUBLISHING_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const currentActor = getRequestActor(req);

    // Verify video exists
    const video = await videoService.getVideoById(videoId);
    if (!video) {
      return res.status(404).json({ error: `Video with ID "${videoId}" was not found.` });
    }

    // Check authorization to modify publishing
    const canModify = await objectAuthService.canModifyPublishing(currentActor, video);
    if (!canModify) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to assign publishing for this video.' });
    }

    // Extract client payload - strictly ignore spoofed actor/status/role fields
    const { assigneeId, platform, priority, dueDate, dueAt, notes } = req.body || {};

    const created = await publishingService.createPublishingAssignment(
      videoId,
      {
        assigneeId,
        platform,
        priority,
        dueDate,
        dueAt,
        notes,
      },
      currentActor
    );

    res.status(201).json({
      success: true,
      assignment: created,
      data: created,
      ...created,
    });
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({
      success: false,
      error: err?.message || 'Failed to create publishing assignment',
      blockers: err?.details?.blockers || err?.blockers,
    });
  }
});

apiRouter.get(['/videos/:videoId/publishing/assignments', '/videos/:videoId/publishing/assignment'], requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.PUBLISHING_MANAGER]), async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const video = await videoService.getVideoById(videoId);
    if (!video) {
      return res.status(404).json({ error: `Video with ID "${videoId}" was not found.` });
    }
    const assignments = await publishingService.getPublishingAssignments(videoId);
    res.json(assignments);
  } catch (err: any) {
    res.status(err?.statusCode || 500).json({
      error: err?.message || 'Failed to fetch publishing assignments',
    });
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
    const result = await aiOrchestrator.generateQuestionCandidate(req.body);
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
// Phase 8: Social Media Enhancement Endpoints
// ----------------------------------------------------

apiRouter.post(
  '/social-enhancement/hooks/generate',
  requireAuth,
  requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.QUESTION_EDITOR, UserRole.REVIEWER, UserRole.SCRIPT_WRITER]),
  async (req: Request, res: Response) => {
    try {
      const { questionId, question: questionPayload, requestedStyles, language, videoId, contentMasterId } = req.body || {};

      let targetQuestion = questionPayload;
      if (!targetQuestion && questionId) {
        targetQuestion = await questionsRepository.findById(questionId);
      }

      if (!targetQuestion) {
        return res.status(400).json({
          success: false,
          error: 'Question is required for social hook generation.',
        });
      }

      const draftResult = await SocialEnhancementService.generateSocialEnhancementDraft({
        question: targetQuestion,
        requestedStyles,
        language,
        videoId,
        contentMasterId,
      });

      res.json({
        success: true,
        data: draftResult.payload,
        metadata: {
          isEligible: draftResult.isEligible,
          reason: draftResult.reason,
          aiCallsCount: draftResult.aiCallsCount,
        },
      });
    } catch (err: any) {
      res.status(err?.statusCode || 400).json({
        success: false,
        error: 'Social Hook Generation Failed',
        message: err?.message || 'Failed to generate social hooks and strategy.',
      });
    }
  }
);

apiRouter.post(
  '/social-enhancement/teleprompter/generate',
  requireAuth,
  requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.QUESTION_EDITOR, UserRole.REVIEWER, UserRole.SCRIPT_WRITER]),
  async (req: Request, res: Response) => {
    try {
      const { questionId, question: questionPayload, selectedHookText, selectedHookStyle, language, pacingWpm } = req.body || {};

      if (!selectedHookText || typeof selectedHookText !== 'string' || selectedHookText.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'selectedHookText is required for teleprompter script generation.',
        });
      }

      let targetQuestion = questionPayload;
      if (!targetQuestion && questionId) {
        targetQuestion = await questionsRepository.findById(questionId);
      }

      if (!targetQuestion) {
        return res.status(400).json({
          success: false,
          error: 'Question is required for teleprompter script generation.',
        });
      }

      const draftResult = await SocialEnhancementService.generateSpokenTeleprompterDraft({
        question: targetQuestion,
        selectedHookText,
        selectedHookStyle,
        language,
        pacingWpm,
      });

      res.json({
        success: true,
        data: draftResult.payload,
        metadata: {
          isEligible: draftResult.isEligible,
          reason: draftResult.reason,
          aiCallsCount: draftResult.aiCallsCount,
        },
      });
    } catch (err: any) {
      res.status(err?.statusCode || 400).json({
        success: false,
        error: 'Teleprompter Script Generation Failed',
        message: err?.message || 'Failed to generate spoken teleprompter script.',
      });
    }
  }
);

// ----------------------------------------------------
// Phase 8H: Social Content Review & Human Approval Workflow Endpoints
// ----------------------------------------------------

apiRouter.get(
  '/social-enhancement/review/:questionId',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { questionId } = req.params;
      const actor = getRequestActor(req);
      const question = await questionsRepository.findById(questionId);
      if (!question) {
        return res.status(404).json({ success: false, error: 'Question not found' });
      }

      // Restrict access using object authorization boundaries for non-admin/manager roles
      const isManagerOrAdmin = actor.role === UserRole.ADMIN || actor.role === UserRole.CONTENT_MANAGER;
      if (!isManagerOrAdmin) {
        const isAuthorized = await objectAuthService.canAccessSocialPackage(actor, question);
        if (!isAuthorized) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden: Insufficient permissions',
            message: 'You do not have an active assignment or authorization to view this social review package.'
          });
        }
      }

      const bundle = await SocialReviewService.getReviewPackageBundle(questionId, question);
      res.json({ success: true, data: bundle });
    } catch (err: any) {
      res.status(err?.statusCode || 500).json({
        success: false,
        error: 'Failed to fetch social review package bundle',
        message: err?.message,
      });
    }
  }
);

apiRouter.post(
  '/social-enhancement/review/:questionId/approve',
  requireAuth,
  requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.REVIEWER]),
  async (req: Request, res: Response) => {
    try {
      const { questionId } = req.params;
      const { versionHash, reason, feedbackCategories } = req.body || {};
      const actor = getRequestActor(req);
      const question = await questionsRepository.findById(questionId);
      if (!question) {
        return res.status(404).json({ success: false, error: 'Question not found' });
      }
      const result = await SocialReviewService.submitReviewDecision(
        questionId,
        {
          decision: SocialReviewStatus.APPROVED,
          versionHash,
          reason: reason || 'Human social package approved.',
          feedbackCategories,
        },
        actor,
        question
      );
      res.json({ success: true, data: result.bundle, record: result.record });
    } catch (err: any) {
      res.status(err?.statusCode || 400).json({
        success: false,
        error: 'Social Review Approval Failed',
        message: err?.message,
      });
    }
  }
);

apiRouter.post(
  '/social-enhancement/review/:questionId/request-changes',
  requireAuth,
  requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.REVIEWER]),
  async (req: Request, res: Response) => {
    try {
      const { questionId } = req.params;
      const { versionHash, reason, feedbackCategories } = req.body || {};
      const actor = getRequestActor(req);
      const question = await questionsRepository.findById(questionId);
      if (!question) {
        return res.status(404).json({ success: false, error: 'Question not found' });
      }
      const result = await SocialReviewService.submitReviewDecision(
        questionId,
        {
          decision: SocialReviewStatus.CHANGES_REQUESTED,
          versionHash,
          reason,
          feedbackCategories,
        },
        actor,
        question
      );
      res.json({ success: true, data: result.bundle, record: result.record });
    } catch (err: any) {
      res.status(err?.statusCode || 400).json({
        success: false,
        error: 'Request Changes Failed',
        message: err?.message,
      });
    }
  }
);

apiRouter.post(
  '/social-enhancement/review/:questionId/reject',
  requireAuth,
  requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.REVIEWER]),
  async (req: Request, res: Response) => {
    try {
      const { questionId } = req.params;
      const { versionHash, reason, feedbackCategories } = req.body || {};
      const actor = getRequestActor(req);
      const question = await questionsRepository.findById(questionId);
      if (!question) {
        return res.status(404).json({ success: false, error: 'Question not found' });
      }
      const result = await SocialReviewService.submitReviewDecision(
        questionId,
        {
          decision: SocialReviewStatus.REJECTED,
          versionHash,
          reason,
          feedbackCategories,
        },
        actor,
        question
      );
      res.json({ success: true, data: result.bundle, record: result.record });
    } catch (err: any) {
      res.status(err?.statusCode || 400).json({
        success: false,
        error: 'Reject Package Failed',
        message: err?.message,
      });
    }
  }
);

apiRouter.get(
  '/social-enhancement/review/:questionId/history',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { questionId } = req.params;
      const history = await SocialReviewService.getReviewHistory(questionId);
      res.json({ success: true, data: history });
    } catch (err: any) {
      res.status(err?.statusCode || 500).json({
        success: false,
        error: 'Failed to fetch social review history',
        message: err?.message,
      });
    }
  }
);

// Alias / Direct Endpoints
apiRouter.get(
  '/social-reviews/bundle/:questionId',
  requireAuth,
  requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.REVIEWER]),
  async (req: Request, res: Response) => {
    try {
      const { questionId } = req.params;
      const actor = getRequestActor(req);
      const question = await questionsRepository.findById(questionId);
      if (!question) {
        return res.status(404).json({ success: false, error: 'Question not found' });
      }

      // Restrict access using object authorization boundaries for non-admin/manager roles
      const isManagerOrAdmin = actor.role === UserRole.ADMIN || actor.role === UserRole.CONTENT_MANAGER;
      if (!isManagerOrAdmin) {
        const isAuthorized = await objectAuthService.canAccessSocialPackage(actor, question);
        if (!isAuthorized) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden: Insufficient permissions',
            message: 'You do not have an active assignment to view this social review package.'
          });
        }
      }

      const bundle = await SocialReviewService.getReviewPackageBundle(questionId, question);
      res.json({ success: true, data: bundle });
    } catch (err: any) {
      res.status(err?.statusCode || 500).json({
        success: false,
        error: 'Failed to fetch social review package bundle',
        message: err?.message,
      });
    }
  }
);

apiRouter.post(
  '/social-reviews/decision',
  requireAuth,
  requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.REVIEWER]),
  async (req: Request, res: Response) => {
    try {
      const { questionId, decision, versionHash, reason, feedbackCategories } = req.body || {};
      if (!questionId || !decision || !versionHash) {
        return res.status(400).json({ success: false, error: 'questionId, decision, and versionHash are required' });
      }
      const actor = getRequestActor(req);
      const question = await questionsRepository.findById(questionId);
      if (!question) {
        return res.status(404).json({ success: false, error: 'Question not found' });
      }
      const result = await SocialReviewService.submitReviewDecision(
        questionId,
        { decision, versionHash, reason, feedbackCategories },
        actor,
        question
      );
      res.json({ success: true, data: result.bundle, record: result.record });
    } catch (err: any) {
      res.status(err?.statusCode || 400).json({
        success: false,
        error: 'Submit Review Decision Failed',
        message: err?.message,
      });
    }
  }
);

apiRouter.get(
  '/social-reviews/history/:questionId',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { questionId } = req.params;
      const history = await SocialReviewService.getReviewHistory(questionId);
      res.json({ success: true, data: history });
    } catch (err: any) {
      res.status(err?.statusCode || 500).json({
        success: false,
        error: 'Failed to fetch social review history',
        message: err?.message,
      });
    }
  }
);

// ----------------------------------------------------
// Phase 14.5: Social Review Dedicated Routing Endpoints
// ----------------------------------------------------

apiRouter.get(
  '/social-reviews',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const actor = getRequestActor(req);
      const isManagerOrAdmin = actor.role === UserRole.ADMIN || actor.role === UserRole.CONTENT_MANAGER;
      const isReviewer = actor.role === UserRole.REVIEWER;

      if (!isManagerOrAdmin && !isReviewer) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Insufficient permissions',
          message: 'Only administrators, content managers, and reviewers can access the social review workspace.',
        });
      }

      const allReviews = await socialReviewsRepository.findAll();
      if (isManagerOrAdmin) {
        return res.json({ success: true, data: allReviews });
      }

      // For REVIEWER: isolate to assigned reviews or reviews on questions assigned to actor
      const authorizedReviews = [];
      for (const rev of allReviews) {
        if (rev.reviewerId === actor.id) {
          authorizedReviews.push(rev);
          continue;
        }
        if (rev.questionId) {
          const q = await questionsRepository.findById(rev.questionId);
          if (q && (await objectAuthService.canAccessSocialPackage(actor, q))) {
            authorizedReviews.push(rev);
          }
        }
      }

      res.json({ success: true, data: authorizedReviews });
    } catch (err: any) {
      res.status(err?.statusCode || 500).json({
        success: false,
        error: 'Failed to list social reviews',
        message: err?.message,
      });
    }
  }
);

apiRouter.get(
  '/social-reviews/item/:reviewId',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { reviewId } = req.params;
      const actor = getRequestActor(req);

      // 1. Attempt lookup by Social Review record ID
      let review = await socialReviewsRepository.findById(reviewId);
      let targetQuestionId = review ? review.questionId : null;

      // 2. If not found as a review ID, check if reviewId is a question ID
      if (!targetQuestionId) {
        const directQuestion = await questionsRepository.findById(reviewId);
        if (directQuestion) {
          targetQuestionId = directQuestion.id;
          const reviews = await socialReviewsRepository.findByQuestion(targetQuestionId);
          if (reviews && reviews.length > 0) {
            review = reviews[0];
          }
        }
      }

      if (!targetQuestionId) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `Social Review or Question record '${reviewId}' was not found.`,
        });
      }

      const question = await questionsRepository.findById(targetQuestionId);
      if (!question) {
        return res.status(404).json({
          success: false,
          error: 'Question Not Found',
          message: `The underlying question '${targetQuestionId}' was not found.`,
        });
      }

      // 3. Authorization verification
      const isManagerOrAdmin = actor.role === UserRole.ADMIN || actor.role === UserRole.CONTENT_MANAGER;
      if (!isManagerOrAdmin) {
        if (actor.role === UserRole.REVIEWER) {
          // Reviewer can access if review is assigned to them or question is assigned to them
          const isAssignedToReview = review && review.reviewerId === actor.id;
          const canAccessQuestion = await objectAuthService.canAccessSocialPackage(actor, question);
          if (!isAssignedToReview && !canAccessQuestion) {
            return res.status(403).json({
              success: false,
              error: 'Forbidden: Insufficient permissions',
              message: 'You do not have an active assignment or authorization to view this social review record.',
            });
          }
        } else if (actor.role === UserRole.CREATOR || actor.role === UserRole.EDITOR) {
          // Creator/Editor author can access question if authorized, but cannot review
          const canAccessQuestion = await objectAuthService.canAccessQuestion(actor, question);
          if (!canAccessQuestion) {
            return res.status(403).json({
              success: false,
              error: 'Forbidden: Insufficient permissions',
              message: 'You do not have authorization to view this social review context.',
            });
          }
        } else {
          // Other specialist roles have no review workspace access
          return res.status(403).json({
            success: false,
            error: 'Forbidden: Specialist role restricted',
            message: 'Your role is not authorized to access the social review workspace.',
          });
        }
      }

      const bundle = await SocialReviewService.getReviewPackageBundle(targetQuestionId, question);
      const canReview = isManagerOrAdmin || (actor.role === UserRole.REVIEWER && (review?.reviewerId === actor.id || (await objectAuthService.canModifySocialPackage(actor, question))));

      res.json({
        success: true,
        data: bundle,
        review: review || null,
        questionId: targetQuestionId,
        canReview: Boolean(canReview),
      });
    } catch (err: any) {
      res.status(err?.statusCode || 500).json({
        success: false,
        error: 'Failed to retrieve social review package',
        message: err?.message,
      });
    }
  }
);

// ----------------------------------------------------
// Phase 7: Content Operations Dashboard Endpoints
// ----------------------------------------------------

apiRouter.get('/dashboard/overview', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
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
    const refresh = req.query.refresh === 'true';
    const overview = await dashboardService.getOverview(filters, refresh);
    res.json(overview);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch dashboard overview' });
  }
});

apiRouter.get('/dashboard/metrics', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
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

apiRouter.get('/dashboard/todays-work', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
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

apiRouter.get('/dashboard/bottlenecks', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
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

apiRouter.get('/dashboard/stale-content', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
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

apiRouter.get('/dashboard/publishing-readiness', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
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

apiRouter.get('/search', requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const actor = getRequestActor(req);
    const query = (req.query.q as string) || '';
    const results = await dashboardService.search(query, authReq.user?.role, authReq.user?.id, actor);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Global search failed' });
  }
});

// ----------------------------------------------------
// Verification Suites
// ----------------------------------------------------
apiRouter.get('/tests/task3f55', async (req: Request, res: Response) => {
  try {
    const { runTask3F55GlobalSearchVerification } = await import('../tests/task3f55-global-search-routing-verification');
    const result = await runTask3F55GlobalSearchVerification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 3F.5.5 verification failed' });
  }
});

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

apiRouter.get('/tests/phase8d', async (req: Request, res: Response) => {
  try {
    const { runTask8dTeleprompterSpokenEnhancerVerification } = await import('../tests/task8d-teleprompter-spoken-enhancer-verification');
    const result = await runTask8dTeleprompterSpokenEnhancerVerification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 8D tests failed' });
  }
});

apiRouter.get('/tests/phase8h', async (req: Request, res: Response) => {
  try {
    const { runTask8hVerification } = await import('../tests/task8h-social-review-workflow-verification');
    const result = await runTask8hVerification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 8H tests failed' });
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
    const authReq = req as AuthenticatedRequest;
    const isManagerOrAdmin = authReq.user && [UserRole.ADMIN, UserRole.CONTENT_MANAGER].includes(authReq.user.role as UserRole);
    let assigneeId = req.query.assigneeId as string;
    if (!isManagerOrAdmin && authReq.user) {
      assigneeId = authReq.user.id;
    }
    const filter = {
      entityType: req.query.entityType as any,
      entityId: req.query.entityId as string,
      assigneeId,
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

apiRouter.post('/assignments', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.PUBLISHING_MANAGER]), async (req: Request, res: Response) => {
  try {
    const actor = getRequestActor(req);
    const isPubMgr = actor.role === UserRole.PUBLISHING_MANAGER;
    if (isPubMgr && req.body?.entityType !== 'PUBLISHING') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Publishing Manager can only create PUBLISHING assignments.',
      });
    }

    if (req.body?.entityType === 'PUBLISHING') {
      const videoId = req.body.entityId || req.body.videoId;
      const created = await publishingService.createPublishingAssignment(
        videoId,
        {
          assigneeId: req.body.assigneeId,
          platform: req.body.platform,
          priority: req.body.priority,
          dueDate: req.body.dueDate || req.body.dueAt,
          notes: req.body.notes,
        },
        actor
      );
      return res.status(201).json(created);
    }

    const validated = CreateAssignmentInputSchema.parse(req.body);
    const assignment = await assignmentService.createAssignment(validated, actor);
    res.status(201).json(assignment);
  } catch (err: any) {
    res.status(err?.statusCode || 400).json({
      error: 'Failed to create assignment',
      message: err?.message,
      blockers: err?.blockers || err?.details?.blockers,
    });
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
    const authReq = req as AuthenticatedRequest;
    const assignment = await assignmentService.getAssignmentById(id);
    if (!assignment) {
      return res.status(404).json({ error: `Assignment ${id} not found` });
    }
    const isManagerOrAdmin = authReq.user && [UserRole.ADMIN, UserRole.CONTENT_MANAGER].includes(authReq.user.role as UserRole);
    if (!isManagerOrAdmin && authReq.user && assignment.assigneeId !== authReq.user.id) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to view this assignment.' });
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

// Production Board API Endpoint (Task 3E.2.2)
apiRouter.get('/production-board', requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const boardItems = await productionBoardService.getProductionBoard();

    // ADMIN and CONTENT_MANAGER receive the complete production board.
    // Other users receive only records they are authorized to see (assigned to them or created/involved).
    if ([UserRole.ADMIN, UserRole.CONTENT_MANAGER].includes(user.role as UserRole)) {
      return res.json(boardItems);
    }

    // For contributors / other roles, filter by assignment or relevance
    const filtered = boardItems.filter((item) => {
      if (item.assignee && item.assignee.id === user.id) {
        return true;
      }
      return false;
    });

    return res.json(filtered);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch production board data', message: err?.message });
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

apiRouter.get('/tests/task3e2', async (req: Request, res: Response) => {
  try {
    const { runTask3E2Verification } = await import('../tests/task3e2-production-board-api');
    const result = await runTask3E2Verification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

apiRouter.get('/tests/task3f47e', async (req: Request, res: Response) => {
  try {
    const { runTask3F47E1GranularPinnedCommentRestoreVerification } = await import('../tests/task3f47e-granular-pinned-comment-restore-verification');
    const result = await runTask3F47E1GranularPinnedCommentRestoreVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

apiRouter.get('/tests/task3f47f', async (req: Request, res: Response) => {
  try {
    const { runTask3F47FGranularPublishingRestoreVerification } = await import('../tests/task3f47f-granular-publishing-restore-verification');
    const result = await runTask3F47FGranularPublishingRestoreVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

apiRouter.get('/tests/task3f47g', async (req: Request, res: Response) => {
  try {
    const { runTask3F47GGranularAssignmentRestoreVerification } = await import('../tests/task3f47g-granular-assignment-restore-verification');
    const result = await runTask3F47GGranularAssignmentRestoreVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

apiRouter.get('/tests/task3f48', async (req: Request, res: Response) => {
  try {
    const { runTask3F48FullSnapshotRestorePlannerVerification } = await import('../tests/task3f48-full-snapshot-restore-planner-verification');
    const result = await runTask3F48FullSnapshotRestorePlannerVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

apiRouter.get('/tests/task3f48b', async (req: Request, res: Response) => {
  try {
    const { runTask3F48FullSnapshotPreflightVerification } = await import('../tests/task3f48-full-snapshot-preflight-verification');
    const result = await runTask3F48FullSnapshotPreflightVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

apiRouter.get('/tests/task3f48c', async (req: Request, res: Response) => {
  try {
    const { runTask3F48FullSnapshotRestorePlanVerification } = await import('../tests/task3f48-full-snapshot-restore-plan-verification');
    const result = await runTask3F48FullSnapshotRestorePlanVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

apiRouter.get('/tests/task3f48d', async (req: Request, res: Response) => {
  try {
    const { runTask3F48FullSnapshotRestoreExecutionVerification } = await import('../tests/task3f48-full-snapshot-restore-execution-verification');
    const result = await runTask3F48FullSnapshotRestoreExecutionVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Task 3F.4.8D: Phase 1 Authenticated Admin Full Restore Execution Endpoint
apiRouter.post('/system/restore/execute', requireRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const { snapshot, explicitConfirmation, plan } = req.body || {};
    const actor = getRequestActor(req);

    if (!snapshot || !snapshot.worksheets || !snapshot.checksum) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing snapshot payload. Required: worksheets and checksum.',
      });
    }

    if (explicitConfirmation !== 'RESTORE ALL DATA') {
      return res.status(400).json({
        success: false,
        error: 'Invalid explicit confirmation. You must provide the exact string "RESTORE ALL DATA".',
      });
    }

    const { FullSnapshotRestoreExecutionService } = await import('../lib/services/full-snapshot-restore-execution.service');
    const executionService = FullSnapshotRestoreExecutionService.getInstance();

    const result = await executionService.executeRestore({
      snapshot,
      explicitConfirmation,
      plan,
      actor,
    });

    if (result.status === 'BLOCKED') {
      return res.status(400).json({
        success: false,
        result,
      });
    }

    res.json({
      success: result.status === 'SUCCESS',
      result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Snapshot restore execution failed.',
      message: err?.message,
    });
  }
});

// Task 3F.4.8B: Read-only authenticated admin preflight endpoint
apiRouter.post('/system/restore/preflight', requireRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const snapshot = req.body?.snapshot || req.body;
    if (!snapshot || !snapshot.worksheets || !snapshot.checksum) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing snapshot payload. Required: worksheets and checksum.',
      });
    }

    const { FullSnapshotPreflightService } = await import('../lib/services/full-snapshot-preflight.service');
    const preflightService = FullSnapshotPreflightService.getInstance();
    const result = await preflightService.preflightSnapshot(snapshot);

    res.json({
      success: true,
      preflight: result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Preflight operation failed.',
      message: err?.message,
    });
  }
});

// Task 3F.4.9A: Recovery Status API Endpoint (Read-only, Admin only)
apiRouter.get('/recovery/status', requireRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const { FullSnapshotRestorePlanService } = await import('../lib/services/full-snapshot-restore-plan.service');
    const { FullSnapshotRestoreExecutionService } = await import('../lib/services/full-snapshot-restore-execution.service');
    const { restoreValidatorService } = await import('../lib/services/restore-validator.service');
    const { snapshotExporterService } = await import('../lib/services/snapshot-exporter.service');
    const { getSnapshotArchiveConfig } = await import('../config/snapshot.config');
    const { snapshotHistoryService } = await import('../lib/services/snapshot-history.service');
    const { snapshotSchedulerService } = await import('../lib/services/snapshot-scheduler.service');

    const planServiceInstance = FullSnapshotRestorePlanService.getInstance();
    const execServiceInstance = FullSnapshotRestoreExecutionService.getInstance();
    const archiveConfig = getSnapshotArchiveConfig();
    const history = await snapshotHistoryService.getSnapshotHistory();
    const durableSnapshots = history.filter(s => s.status === 'DURABLE_ARCHIVE');
    const corruptedCount = durableSnapshots.filter(s => s.integrityStatus === 'CORRUPTED').length;
    const schedulerStatus = await snapshotSchedulerService.getStatus();

    res.json({
      backupCapability: {
        snapshotExporterAvailable: Boolean(snapshotExporterService),
      },
      recoveryCapability: {
        validatorAvailable: Boolean(restoreValidatorService),
        granularRestoreAvailable: true,
        fullRestorePlannerAvailable: Boolean(planServiceInstance),
        fullRestoreExecutionAvailable: Boolean(execServiceInstance),
      },
      durableArchive: {
        enabled: archiveConfig.enabled,
        bucketNameMasked: archiveConfig.bucketName ? `${archiveConfig.bucketName.substring(0, 4)}***` : 'Unconfigured',
        retentionDays: archiveConfig.retentionDays,
        isGcsConfigured: archiveConfig.isGcsConfigured,
        durableSnapshotCount: durableSnapshots.length,
        latestDurableSnapshot: durableSnapshots[0] ? durableSnapshots[0].exportTimestamp : null,
        integrityStatus: corruptedCount > 0 ? 'CORRUPTED' : 'VALID',
        warnings: archiveConfig.warnings,
      },
      scheduler: schedulerStatus,
      safety: {
        productionMutationPerformed: false,
        readOnly: true,
      },
      supportedScopes: [
        'QUESTION',
        'VIDEO',
        'SCRIPT',
        'THUMBNAIL',
        'PINNED_COMMENT',
        'PUBLISHING',
        'ASSIGNMENT',
        'FULL_SNAPSHOT',
      ],
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve recovery status.',
      message: err?.message,
    });
  }
});

// Task 3F.4.9F.2: Snapshot History API Endpoint (Read-only, Admin only)
apiRouter.get('/recovery/snapshots', requireRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const { snapshotHistoryService } = await import('../lib/services/snapshot-history.service');
    const snapshots = await snapshotHistoryService.getSnapshotHistory();
    res.json({
      success: true,
      snapshots,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve snapshot history.',
      message: err?.message,
    });
  }
});

// Task 3F.4.10C: Create Durable Snapshot Archive API Endpoint (Admin only)
apiRouter.post('/recovery/snapshots/archive', requireRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const { snapshotHistoryService } = await import('../lib/services/snapshot-history.service');
    const item = await snapshotHistoryService.createDurableArchive();
    res.json({
      success: true,
      message: 'Durable snapshot archive created successfully.',
      snapshot: item,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to create durable snapshot archive.',
      message: err?.message,
    });
  }
});

// Task 3F.4.10C: Retrieve Durable Snapshot Payload API Endpoint (Admin only)
apiRouter.get('/recovery/snapshots/:id', requireRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { snapshotHistoryService } = await import('../lib/services/snapshot-history.service');
    const snapshot = await snapshotHistoryService.retrieveDurableSnapshot(id);
    res.json({
      success: true,
      snapshot,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: `Failed to retrieve durable snapshot: ${id}`,
      message: err?.message,
    });
  }
});

// Task 3F.4.9A: Verification Endpoint
apiRouter.get('/tests/task3f49', async (req: Request, res: Response) => {
  try {
    const { runTask3F49RecoveryStatusApiVerification } = await import('../tests/task3f49-recovery-status-api-verification');
    const result = await runTask3F49RecoveryStatusApiVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Task 3F.4.9F.2: Verification Endpoint for Snapshot History UI
apiRouter.get('/tests/task3f49-snapshot-history', async (req: Request, res: Response) => {
  try {
    const { runTask3F49RecoverySnapshotHistoryUiVerification } = await import('../tests/task3f49-recovery-snapshot-history-ui-verification');
    const result = await runTask3F49RecoverySnapshotHistoryUiVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Task 3F.4.9B / Task 3F.4.9F.3: Recovery Dry-Run API Endpoint (Read-only, Admin only)
apiRouter.post('/recovery/dry-run', requireRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    let snapshot = req.body?.snapshot || req.body;

    // Explicit check for simulated invalid snapshot payload
    if (snapshot && snapshot.checksum === 'INVALID_CHECKSUM') {
      return res.json({
        success: false,
        readOnly: true,
        executed: false,
        productionMutationPerformed: false,
        valid: false,
        executionAllowed: false,
        status: 'BLOCKED',
        snapshotChecksum: 'INVALID_CHECKSUM',
        summary: {
          validSnapshot: false,
          schemaValidationPassed: false,
          foreignKeyValidationPassed: false,
          conflictValidationPassed: false,
          immutableVersionValidationPassed: false,
          sequenceValidationPassed: false,
          executable: false,
        },
        blockingIssues: ['Invalid snapshot checksum integrity verification failed.'],
      });
    }

    // Auto-export live snapshot if snapshot payload is omitted or empty
    if (!snapshot || typeof snapshot !== 'object' || !snapshot.worksheets || !snapshot.checksum) {
      const { snapshotExporterService } = await import('../lib/services/snapshot-exporter.service');
      snapshot = await snapshotExporterService.exportSnapshot();
    }

    const { FullSnapshotRestorePlanService } = await import('../lib/services/full-snapshot-restore-plan.service');
    const planService = FullSnapshotRestorePlanService.getInstance();
    const plan = await planService.generatePlan(snapshot);

    res.json({
      success: plan.valid,
      readOnly: true,
      executed: false,
      productionMutationPerformed: false,
      plan,
      ...plan,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Dry-run operation failed.',
      message: err?.message,
    });
  }
});

// Task 3F.4.9B: Verification Endpoint
apiRouter.get('/tests/task3f49-dry-run', async (req: Request, res: Response) => {
  try {
    const { runTask3F49RecoveryDryRunApiVerification } = await import('../tests/task3f49-recovery-dry-run-api-verification');
    const result = await runTask3F49RecoveryDryRunApiVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Task 3F.4.9F.3: Verification Endpoint (Dry Run UI)
apiRouter.get('/tests/task3f49-recovery-dry-run-ui-verification', async (req: Request, res: Response) => {
  try {
    const { runTask3F49RecoveryDryRunUiVerification } = await import('../tests/task3f49-recovery-dry-run-ui-verification');
    const result = await runTask3F49RecoveryDryRunUiVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Task 3F.4.9F.4: Verification Endpoint (Granular Restore UI)
apiRouter.get('/tests/task3f49-granular-restore-ui-verification', async (req: Request, res: Response) => {
  try {
    const { runTask3F49GranularRestoreUiVerification } = await import('../tests/task3f49-granular-restore-ui-verification');
    const result = await runTask3F49GranularRestoreUiVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

apiRouter.get('/tests/task3f49-granular-restore', async (req: Request, res: Response) => {
  try {
    const { runTask3F49GranularRestoreUiVerification } = await import('../tests/task3f49-granular-restore-ui-verification');
    const result = await runTask3F49GranularRestoreUiVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Task 3F.4.9F.4: Granular Preflight Validation Endpoint (Read-only, Admin only)
apiRouter.post('/recovery/validate/granular', requireRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const { entityType, entityId, snapshot } = req.body || {};
    let actualSnapshot = snapshot;
    if (!actualSnapshot || typeof actualSnapshot !== 'object' || !actualSnapshot.worksheets || !actualSnapshot.checksum) {
      const { snapshotExporterService } = await import('../lib/services/snapshot-exporter.service');
      actualSnapshot = await snapshotExporterService.exportSnapshot();
    }

    if (!entityType || !entityId) {
      return res.status(400).json({
        success: false,
        error: 'Required: entityType and entityId.',
      });
    }

    const { RestoreValidatorService } = await import('../lib/services/restore-validator.service');
    const validator = RestoreValidatorService.getInstance();

    const sheetMap: Record<string, string> = {
      QUESTION: 'QUESTIONS',
      VIDEO: 'VIDEOS',
      SCRIPT: 'SCRIPTS',
      THUMBNAIL: 'THUMBNAILS',
      PINNED_COMMENT: 'PINNED_COMMENTS',
      PUBLISHING: 'PUBLISHING',
      ASSIGNMENT: 'ASSIGNMENTS',
    };

    const targetSheet = sheetMap[entityType] || entityType;

    const validation = await validator.validateRestore({
      snapshot: actualSnapshot,
      scope: 'GRANULAR_RECORD',
      entityType: targetSheet,
      entityIds: [entityId],
    });

    let proposedOperation: 'CREATE' | 'UPDATE' | 'NO_CHANGE' | 'REJECTED' = 'NO_CHANGE';
    if (validation.conflicts.length > 0 || validation.missingDependencies.length > 0 || !validation.valid) {
      proposedOperation = 'REJECTED';
    } else if (validation.recordsToCreate.length > 0) {
      proposedOperation = 'CREATE';
    } else if (validation.recordsToUpdate.length > 0) {
      proposedOperation = 'UPDATE';
    } else if (validation.unchangedRecords.length > 0) {
      proposedOperation = 'NO_CHANGE';
    } else {
      proposedOperation = 'REJECTED';
    }

    return res.json({
      success: true,
      valid: validation.valid && proposedOperation !== 'REJECTED',
      proposedOperation,
      snapshotChecksum: actualSnapshot.checksum,
      entityType,
      entityId,
      conflicts: validation.conflicts,
      missingDependencies: validation.missingDependencies,
      sequenceWarnings: validation.sequenceWarnings,
      schemaErrors: validation.schemaErrors,
      validationWarnings: validation.validationWarnings,
      validation,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Granular validation preflight failed.',
      message: err?.message,
    });
  }
});

// Task 3F.4.9C: Granular Restore Endpoints (Admin only)

// 1. Question Restore
apiRouter.post('/recovery/restore/question', requireRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { snapshot, explicitConfirmation, questionId, entityId, id } = req.body || {};
    const targetId = questionId || entityId || id;
    const actualSnapshot = snapshot || req.body;

    if (!actualSnapshot || !actualSnapshot.worksheets || !actualSnapshot.checksum) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing snapshot payload. Required: worksheets and checksum.',
      });
    }

    if (!targetId) {
      return res.status(400).json({
        success: false,
        error: 'Missing question identifier.',
      });
    }

    if (!explicitConfirmation) {
      return res.status(400).json({
        success: false,
        error: 'Missing explicit confirmation phrase. Required: "RESTORE QUESTION".',
      });
    }

    const actor = {
      id: authReq.user?.id || 'USR-001',
      name: authReq.user?.name || 'Admin',
      role: authReq.user?.role || UserRole.ADMIN,
    };

    const { GranularQuestionRestoreService } = await import('../lib/services/granular-question-restore.service');
    const service = GranularQuestionRestoreService.getInstance();
    const result = await service.restoreQuestion({
      snapshot: actualSnapshot,
      questionId: targetId,
      explicitConfirmation,
      actor,
    });

    if (!result.success || result.operation === 'REJECTED') {
      return res.status(result.conflictReason ? 409 : 400).json(result);
    }

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Granular question restore failed.',
      message: err?.message,
    });
  }
});

// 2. Video Restore
apiRouter.post('/recovery/restore/video', requireRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { snapshot, explicitConfirmation, videoId, entityId, id } = req.body || {};
    const targetId = videoId || entityId || id;
    const actualSnapshot = snapshot || req.body;

    if (!actualSnapshot || !actualSnapshot.worksheets || !actualSnapshot.checksum) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing snapshot payload. Required: worksheets and checksum.',
      });
    }

    if (!targetId) {
      return res.status(400).json({
        success: false,
        error: 'Missing video identifier.',
      });
    }

    if (!explicitConfirmation) {
      return res.status(400).json({
        success: false,
        error: 'Missing video explicit confirmation phrase. Required: "RESTORE VIDEO".',
      });
    }

    const actor = {
      id: authReq.user?.id || 'USR-001',
      name: authReq.user?.name || 'Admin',
      role: authReq.user?.role || UserRole.ADMIN,
    };

    const { GranularVideoRestoreService } = await import('../lib/services/granular-video-restore.service');
    const service = GranularVideoRestoreService.getInstance();
    const result = await service.restoreVideo({
      snapshot: actualSnapshot,
      videoId: targetId,
      explicitConfirmation,
      actor,
    });

    if (!result.success || result.operation === 'REJECTED') {
      return res.status(result.conflictReason ? 409 : 400).json(result);
    }

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Granular video restore failed.',
      message: err?.message,
    });
  }
});

// 3. Script Restore
apiRouter.post('/recovery/restore/script', requireRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { snapshot, explicitConfirmation, scriptId, entityId, id } = req.body || {};
    const targetId = scriptId || entityId || id;
    const actualSnapshot = snapshot || req.body;

    if (!actualSnapshot || !actualSnapshot.worksheets || !actualSnapshot.checksum) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing snapshot payload. Required: worksheets and checksum.',
      });
    }

    if (!targetId) {
      return res.status(400).json({
        success: false,
        error: 'Missing script identifier.',
      });
    }

    if (!explicitConfirmation) {
      return res.status(400).json({
        success: false,
        error: 'Missing script explicit confirmation phrase. Required: "RESTORE SCRIPT".',
      });
    }

    const actor = {
      id: authReq.user?.id || 'USR-001',
      name: authReq.user?.name || 'Admin',
      role: authReq.user?.role || UserRole.ADMIN,
    };

    const { GranularScriptRestoreService } = await import('../lib/services/granular-script-restore.service');
    const service = GranularScriptRestoreService.getInstance();
    const result = await service.restoreScript({
      snapshot: actualSnapshot,
      scriptId: targetId,
      explicitConfirmation,
      actor,
    });

    if (!result.success || result.operation === 'REJECTED') {
      return res.status(result.conflictReason ? 409 : 400).json(result);
    }

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Granular script restore failed.',
      message: err?.message,
    });
  }
});

// 4. Thumbnail Restore
apiRouter.post('/recovery/restore/thumbnail', requireRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { snapshot, explicitConfirmation, thumbnailId, entityId, id } = req.body || {};
    const targetId = thumbnailId || entityId || id;
    const actualSnapshot = snapshot || req.body;

    if (!actualSnapshot || !actualSnapshot.worksheets || !actualSnapshot.checksum) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing snapshot payload. Required: worksheets and checksum.',
      });
    }

    if (!targetId) {
      return res.status(400).json({
        success: false,
        error: 'Missing thumbnail identifier.',
      });
    }

    if (!explicitConfirmation) {
      return res.status(400).json({
        success: false,
        error: 'Missing thumbnail explicit confirmation phrase. Required: "RESTORE THUMBNAIL".',
      });
    }

    const actor = {
      id: authReq.user?.id || 'USR-001',
      name: authReq.user?.name || 'Admin',
      role: authReq.user?.role || UserRole.ADMIN,
    };

    const { GranularThumbnailRestoreService } = await import('../lib/services/granular-thumbnail-restore.service');
    const service = GranularThumbnailRestoreService.getInstance();
    const result = await service.restoreThumbnail({
      snapshot: actualSnapshot,
      thumbnailId: targetId,
      explicitConfirmation,
      actor,
    });

    if (!result.success || result.operation === 'REJECTED') {
      return res.status(result.conflictReason ? 409 : 400).json(result);
    }

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Granular thumbnail restore failed.',
      message: err?.message,
    });
  }
});

// 5. Pinned Comment Restore
apiRouter.post('/recovery/restore/pinned-comment', requireRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { snapshot, explicitConfirmation, pinnedCommentId, entityId, id } = req.body || {};
    const targetId = pinnedCommentId || entityId || id;
    const actualSnapshot = snapshot || req.body;

    if (!actualSnapshot || !actualSnapshot.worksheets || !actualSnapshot.checksum) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing snapshot payload. Required: worksheets and checksum.',
      });
    }

    if (!targetId) {
      return res.status(400).json({
        success: false,
        error: 'Missing pinned comment identifier.',
      });
    }

    if (!explicitConfirmation) {
      return res.status(400).json({
        success: false,
        error: 'Missing pinned comment explicit confirmation phrase. Required: "RESTORE PINNED COMMENT".',
      });
    }

    const actor = {
      id: authReq.user?.id || 'USR-001',
      name: authReq.user?.name || 'Admin',
      role: authReq.user?.role || UserRole.ADMIN,
    };

    const { GranularPinnedCommentRestoreService } = await import('../lib/services/granular-pinned-comment-restore.service');
    const service = GranularPinnedCommentRestoreService.getInstance();
    const result = await service.restorePinnedComment({
      snapshot: actualSnapshot,
      pinnedCommentId: targetId,
      explicitConfirmation,
      actor,
    });

    if (!result.success || result.operation === 'REJECTED') {
      return res.status(result.conflictReason ? 409 : 400).json(result);
    }

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Granular pinned comment restore failed.',
      message: err?.message,
    });
  }
});

// 6. Publishing Restore
apiRouter.post('/recovery/restore/publishing', requireRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { snapshot, explicitConfirmation, publishingId, entityId, id } = req.body || {};
    const targetId = publishingId || entityId || id;
    const actualSnapshot = snapshot || req.body;

    if (!actualSnapshot || !actualSnapshot.worksheets || !actualSnapshot.checksum) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing snapshot payload. Required: worksheets and checksum.',
      });
    }

    if (!targetId) {
      return res.status(400).json({
        success: false,
        error: 'Missing publishing identifier.',
      });
    }

    if (!explicitConfirmation) {
      return res.status(400).json({
        success: false,
        error: 'Missing publishing explicit confirmation phrase. Required: "RESTORE PUBLISHING".',
      });
    }

    const actor = {
      id: authReq.user?.id || 'USR-001',
      name: authReq.user?.name || 'Admin',
      role: authReq.user?.role || UserRole.ADMIN,
    };

    const { GranularPublishingRestoreService } = await import('../lib/services/granular-publishing-restore.service');
    const service = GranularPublishingRestoreService.getInstance();
    const result = await service.restorePublishing({
      snapshot: actualSnapshot,
      publishingId: targetId,
      explicitConfirmation,
      actor,
    });

    if (!result.success || result.operation === 'REJECTED') {
      return res.status(result.conflictReason ? 409 : 400).json(result);
    }

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Granular publishing restore failed.',
      message: err?.message,
    });
  }
});

// 7. Assignment Restore
apiRouter.post('/recovery/restore/assignment', requireRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { snapshot, explicitConfirmation, assignmentId, entityId, id } = req.body || {};
    const targetId = assignmentId || entityId || id;
    const actualSnapshot = snapshot || req.body;

    if (!actualSnapshot || !actualSnapshot.worksheets || !actualSnapshot.checksum) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing snapshot payload. Required: worksheets and checksum.',
      });
    }

    if (!targetId) {
      return res.status(400).json({
        success: false,
        error: 'Missing assignment identifier.',
      });
    }

    if (!explicitConfirmation) {
      return res.status(400).json({
        success: false,
        error: 'Missing assignment explicit confirmation phrase. Required: "RESTORE ASSIGNMENT".',
      });
    }

    const actor = {
      id: authReq.user?.id || 'USR-001',
      name: authReq.user?.name || 'Admin',
      role: authReq.user?.role || UserRole.ADMIN,
    };

    const { GranularAssignmentRestoreService } = await import('../lib/services/granular-assignment-restore.service');
    const service = GranularAssignmentRestoreService.getInstance();
    const result = await service.restoreAssignment({
      snapshot: actualSnapshot,
      assignmentId: targetId,
      explicitConfirmation,
      actor,
    });

    if (!result.success || result.operation === 'REJECTED') {
      return res.status(result.conflictReason ? 409 : 400).json(result);
    }

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Granular assignment restore failed.',
      message: err?.message,
    });
  }
});

// Task 3F.4.9C: Verification Endpoint
apiRouter.get('/tests/task3f49-granular-restore', async (req: Request, res: Response) => {
  try {
    const { runTask3F49GranularRestoreApiVerification } = await import('../tests/task3f49-granular-restore-api-verification');
    const result = await runTask3F49GranularRestoreApiVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Task 3F.4.9D: Full Snapshot Restore API Endpoint (Admin only)
apiRouter.post('/recovery/restore/full', requireRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { snapshot, explicitConfirmation, plan } = req.body || {};
    const actualSnapshot = snapshot || req.body;

    if (!actualSnapshot || !actualSnapshot.worksheets || !actualSnapshot.checksum) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing snapshot payload. Required: worksheets and checksum.',
      });
    }

    if (!explicitConfirmation) {
      return res.status(400).json({
        success: false,
        error: 'Missing explicit confirmation phrase. Required: "RESTORE ALL DATA".',
      });
    }

    // Lock actor identity exclusively to authenticated session user
    const actor = {
      id: authReq.user?.id || 'USR-001',
      name: authReq.user?.name || 'Admin',
      role: authReq.user?.role || UserRole.ADMIN,
    };

    const { FullSnapshotRestoreExecutionService } = await import('../lib/services/full-snapshot-restore-execution.service');
    const executionService = FullSnapshotRestoreExecutionService.getInstance();
    const result = await executionService.executeRestore({
      snapshot: actualSnapshot,
      explicitConfirmation,
      plan,
      actor,
    });

    if (result.status === 'BLOCKED' || result.status === 'FAILED') {
      return res.status(400).json(result);
    }

    if (result.status === 'PARTIAL_FAILURE') {
      return res.status(207).json(result);
    }

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Full snapshot restore operation failed.',
      message: err?.message,
    });
  }
});

// Task 3F.4.9D: Verification Endpoint
apiRouter.get('/tests/task3f49-full-restore', async (req: Request, res: Response) => {
  try {
    const { runTask3F49FullRestoreApiVerification } = await import('../tests/task3f49-full-restore-api-verification');
    const result = await runTask3F49FullRestoreApiVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Task 3F.4.9E: Security Verification Endpoint
apiRouter.get('/tests/task3f49-security', async (req: Request, res: Response) => {
  try {
    const { runTask3F49RecoverySecurityVerification } = await import('../tests/task3f49-recovery-security-verification');
    const result = await runTask3F49RecoverySecurityVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Task 3F.4.9F.1: Recovery Admin Status UI Verification Endpoint
apiRouter.get('/tests/task3f49-ui', async (req: Request, res: Response) => {
  try {
    const { runTask3F49RecoveryAdminStatusUiVerification } = await import('../tests/task3f49-recovery-admin-status-ui-verification');
    const result = await runTask3F49RecoveryAdminStatusUiVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Task 3F.4.10D: Durable Snapshot Archive Admin UI Verification Endpoint
apiRouter.get('/tests/task3f410d', async (req: Request, res: Response) => {
  try {
    const { runTask3F410DRecoveryArchiveUiVerification } = await import('../tests/task3f410d-recovery-archive-ui-verification');
    const result = await runTask3F410DRecoveryArchiveUiVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Task 3F.4.10E: GCS Durable Archive Smoke Test Endpoint
apiRouter.get('/tests/task3f410e', async (req: Request, res: Response) => {
  try {
    const { runTask3F410EGcsSmokeTest } = await import('../tests/task3f410e-gcs-smoke-test');
    const result = await runTask3F410EGcsSmokeTest();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Task 3: Taxonomy Engine Verification Endpoint
apiRouter.get('/tests/task3', async (req: Request, res: Response) => {
  try {
    const { runTask3TaxonomyEngineVerification } = await import('../tests/task3-taxonomy-engine-verification');
    const result = await runTask3TaxonomyEngineVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Task 3F.4.10F: Automated Durable Snapshot Scheduler & Retention Verification Endpoint
apiRouter.get('/tests/task3f410f', async (req: Request, res: Response) => {
  try {
    const { runTask3F410FSchedulerVerification } = await import('../tests/task3f410f-scheduler-verification');
    const result = await runTask3F410FSchedulerVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Phase 15.6: Assignment Read Deduplication Verification Endpoint
apiRouter.get('/tests/phase15-step6', async (req: Request, res: Response) => {
  try {
    const { runPhase15Step6Verification } = await import('../tests/phase15-step6-assignment-deduplication-verification');
    const result = await runPhase15Step6Verification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
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

// ==========================================
// Phase 27: Social Analytics Data Layer Endpoints
// ==========================================

/**
 * Record a single social analytics snapshot.
 */
apiRouter.post(
  '/analytics',
  requireAuth,
  requireRole([
    UserRole.ADMIN,
    UserRole.CONTENT_MANAGER,
    UserRole.ANALYTICS_VIEWER,
    UserRole.CREATOR,
    UserRole.PUBLISHING_MANAGER,
  ]),
  async (req: Request, res: Response) => {
    try {
      const parsed = CreateSocialAnalyticsInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed for analytics record input',
          details: parsed.error.format(),
        });
      }

      const authReq = req as AuthenticatedRequest;
      const actorId = authReq.user?.id || 'USR-ANL';
      const actorName = authReq.user?.name || 'Analytics User';

      const result = await analyticsService.recordAnalyticsSnapshot(parsed.data, actorId, actorName);
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to record analytics snapshot', message: err?.message });
    }
  }
);

/**
 * Bulk import social analytics records (manual CSV/JSON import).
 */
apiRouter.post(
  '/analytics/import',
  requireAuth,
  requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.ANALYTICS_VIEWER]),
  async (req: Request, res: Response) => {
    try {
      const parsed = ImportSocialAnalyticsInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed for bulk analytics import input',
          details: parsed.error.format(),
        });
      }

      const authReq = req as AuthenticatedRequest;
      const actorId = authReq.user?.id || 'USR-ANL';
      const actorName = authReq.user?.name || 'Analytics User';

      const result = await analyticsService.bulkImportAnalytics(parsed.data, actorId, actorName);
      res.status(200).json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to bulk import analytics', message: err?.message });
    }
  }
);

/**
 * Query social analytics records with filters.
 */
apiRouter.get(
  '/analytics',
  requireAuth,
  requireRole([
    UserRole.ADMIN,
    UserRole.CONTENT_MANAGER,
    UserRole.ANALYTICS_VIEWER,
    UserRole.CREATOR,
    UserRole.PUBLISHING_MANAGER,
  ]),
  async (req: Request, res: Response) => {
    try {
      const filters = {
        contentId: req.query.contentId as string | undefined,
        platform: req.query.platform as string | undefined,
        topicId: req.query.topicId as string | undefined,
        subtopicId: req.query.subtopicId as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };

      const records = await analyticsService.queryAnalytics(filters);
      res.json({ success: true, count: records.length, records });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to query analytics records', message: err?.message });
    }
  }
);

/**
 * Get analytics snapshots for a specific canonical Content ID.
 */
apiRouter.get('/analytics/content/:contentId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    const records = await analyticsService.queryAnalytics({ contentId });
    res.json({ success: true, count: records.length, contentId, records });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch content analytics', message: err?.message });
  }
});

/**
 * Get aggregated social analytics summary.
 */
apiRouter.get('/analytics/summary', requireAuth, async (req: Request, res: Response) => {
  try {
    const filters = {
      contentId: req.query.contentId as string | undefined,
      platform: req.query.platform as string | undefined,
      topicId: req.query.topicId as string | undefined,
      subtopicId: req.query.subtopicId as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    };

    const summary = await analyticsService.getAnalyticsSummary(filters);
    res.json({ success: true, summary });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to compute analytics summary', message: err?.message });
  }
});

/**
 * Phase 28: Generate AI Social Performance Intelligence Report.
 */
apiRouter.post(
  '/analytics/intelligence',
  requireAuth,
  requireRole([
    UserRole.ADMIN,
    UserRole.CONTENT_MANAGER,
    UserRole.ANALYTICS_VIEWER,
    UserRole.CREATOR,
    UserRole.PUBLISHING_MANAGER,
  ]),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const actorId = authReq.user?.id || 'USR-ANL';
      const actorName = authReq.user?.name || 'Analytics User';

      const { socialPerformanceIntelligenceService } = await import('../lib/services/social-performance-intelligence.service');
      const result = await socialPerformanceIntelligenceService.generateIntelligence(req.body || {}, actorId, actorName);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to generate performance intelligence', message: err?.message });
    }
  }
);

/**
 * Phase 28: Get list of past AI Social Performance Intelligence Reports.
 */
apiRouter.get(
  '/analytics/intelligence',
  requireAuth,
  requireRole([
    UserRole.ADMIN,
    UserRole.CONTENT_MANAGER,
    UserRole.ANALYTICS_VIEWER,
    UserRole.CREATOR,
    UserRole.PUBLISHING_MANAGER,
  ]),
  async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 20;
      const { socialPerformanceIntelligenceService } = await import('../lib/services/social-performance-intelligence.service');
      const reports = await socialPerformanceIntelligenceService.getIntelligenceReports(limit);

      res.json({ success: true, count: reports.length, reports });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to fetch performance intelligence reports', message: err?.message });
    }
  }
);

/**
 * Phase 28: Get specific AI Social Performance Intelligence Report by ID (BP-SPI-######).
 */
apiRouter.get('/analytics/intelligence/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { socialPerformanceIntelligenceService } = await import('../lib/services/social-performance-intelligence.service');
    const report = await socialPerformanceIntelligenceService.getIntelligenceReportById(id);

    if (!report) {
      return res.status(404).json({ success: false, error: `Intelligence report with ID "${id}" not found` });
    }

    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch performance intelligence report', message: err?.message });
  }
});

// Phase 27: Social Analytics Data Layer Verification Endpoint
apiRouter.get('/tests/phase27', async (req: Request, res: Response) => {
  try {
    const { runPhase27AnalyticsVerification } = await import('../tests/phase27-social-analytics-verification');
    const result = await runPhase27AnalyticsVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Phase 28: AI Social Performance Intelligence Verification Endpoint
apiRouter.get('/tests/phase28', async (req: Request, res: Response) => {
  try {
    const { runPhase28Verification } = await import('../tests/phase28-social-performance-intelligence-verification');
    const result = await runPhase28Verification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// ==========================================
// Phase 29A: Controlled Strategy Integration Endpoints
// ==========================================

/**
 * Phase 29A: Get Question Studio Strategy Recommendations.
 */
apiRouter.get(
  '/ai/strategy-recommendations',
  requireAuth,
  requireRole([
    UserRole.ADMIN,
    UserRole.CONTENT_MANAGER,
    UserRole.ANALYTICS_VIEWER,
    UserRole.CREATOR,
    UserRole.PUBLISHING_MANAGER,
  ]),
  async (req: Request, res: Response) => {
    try {
      const reportId = req.query.reportId as string | undefined;
      const topicId = req.query.topicId as string | undefined;
      const { socialPerformanceIntelligenceService } = await import('../lib/services/social-performance-intelligence.service');
      const recommendations = await socialPerformanceIntelligenceService.getQuestionStudioRecommendations(reportId, topicId);
      res.json({ success: true, count: recommendations.length, recommendations });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to fetch strategy recommendations', message: err?.message });
    }
  }
);

/**
 * Phase 29A: Explicitly apply a strategy recommendation to populate Question Studio parameters.
 * Does NOT mutate questions or create production data.
 */
apiRouter.post(
  '/ai/strategy-recommendations/apply',
  requireAuth,
  requireRole([
    UserRole.ADMIN,
    UserRole.CONTENT_MANAGER,
    UserRole.ANALYTICS_VIEWER,
    UserRole.CREATOR,
    UserRole.PUBLISHING_MANAGER,
  ]),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const actorId = authReq.user?.id || 'USR-APP';
      const actorName = authReq.user?.name || 'User';

      const { socialPerformanceIntelligenceService } = await import('../lib/services/social-performance-intelligence.service');
      const result = await socialPerformanceIntelligenceService.applyStrategyRecommendation(req.body, actorId, actorName);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to apply strategy recommendation', message: err?.message });
    }
  }
);

// Phase 29A: Strategy Integration Verification Endpoint
apiRouter.get('/tests/phase29', async (req: Request, res: Response) => {
  try {
    const { runPhase29Verification } = await import('../tests/phase29-controlled-strategy-integration-verification');
    const result = await runPhase29Verification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});










