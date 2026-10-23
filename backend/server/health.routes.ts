/**
 * BURRA PARIKSHA CMS — Health & System Probes Router
 * Stage 27 Feature Contract: FC-004 (Audit Ledger & Observability)
 *
 * - /healthz and /health/live are liveness probes.
 * - /readyz and /health/ready check Firestore connectivity.
 * Probe responses never expose credentials or provider error messages.
 */
import { Router, Request, Response } from 'express';
import { googleDriveService } from '../infrastructure/services/google-drive.service';
import { getAdminFirestore } from '../../database/firestore/adapter/admin';

export const healthRouter = Router();

const livenessHandler = (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};

const readinessHandler = async (_req: Request, res: Response): Promise<void> => {
  const checks: Record<string, string> = {
    database: 'UNKNOWN',
    drive: 'UNKNOWN',
  };

  try {
    const db = getAdminFirestore();
    // Bounded read: check reachability without scanning a business collection.
    await db.collection('__bp_readiness_probe__').limit(1).get();
    checks.database = 'UP';

    const driveStatus = googleDriveService.getDriveConfigurationStatus();
    checks.drive = driveStatus.mode;

    res.status(200).json({
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      checks,
    });
  } catch {
    checks.database = checks.database === 'UP' ? 'UP' : 'DOWN';
    res.status(503).json({
      status: 'error',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      message: 'Service dependencies unavailable',
      checks,
    });
  }
};

healthRouter.get(['/healthz', '/health/live'], livenessHandler);
healthRouter.get(['/readyz', '/health/ready'], readinessHandler);
