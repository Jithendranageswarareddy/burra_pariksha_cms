/**
 * BURRA PARIKSHA CMS — Script Management Modular Router
 * Stage 03: Audience Script Generation & Versioning Lifecycle (S8-T08 / S8-T09)
 * 
 * Modular Express router extracted from monolithic routes.ts per Option B architecture.
 * Mounts on apiRouter with 100% path compatibility:
 *   - GET  /videos/:videoId/script
 *   - GET  /scripts/:scriptId/versions
 *   - POST /videos/:videoId/script
 *   - POST /videos/:videoId/script/generate
 *   - POST /scripts/:scriptId/revert
 *   - POST /videos/:videoId/script/mark-ready
 *   - POST /videos/:videoId/script/return-to-editing
 */

import { Router, Request, Response } from 'express';
import {
  scriptService,
  videoService,
  objectAuthService,
} from '../../infrastructure/services';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { UserRole } from '../../../shared';
import { getRequestActor } from './routes';

export const scriptRouter = Router();

// ----------------------------------------------------
// Script Management Endpoints (Phase 6 / Stage 03)
// ----------------------------------------------------

scriptRouter.get('/videos/:videoId/script', requireAuth, async (req: Request, res: Response) => {
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

scriptRouter.get('/scripts/:scriptId/versions', async (req: Request, res: Response) => {
  try {
    const { scriptId } = req.params;
    const actor = getRequestActor(req);
    const versions = await scriptService.getScriptVersions(scriptId);
    res.json(versions);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch script versions' });
  }
});

scriptRouter.post('/videos/:videoId/script', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.SCRIPT_WRITER, UserRole.CONTENT_WRITER]), async (req: Request, res: Response) => {
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

scriptRouter.post('/videos/:videoId/script/generate', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.SCRIPT_WRITER, UserRole.CONTENT_WRITER]), async (req: Request, res: Response) => {
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

scriptRouter.post('/scripts/:scriptId/revert', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.SCRIPT_WRITER]), async (req: Request, res: Response) => {
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

scriptRouter.post('/videos/:videoId/script/mark-ready', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.SCRIPT_WRITER]), async (req: Request, res: Response) => {
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

scriptRouter.post('/videos/:videoId/script/return-to-editing', requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER]), async (req: Request, res: Response) => {
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
