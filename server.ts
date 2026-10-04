/**
 * BURRA PARIKSHA CMS - Express & Vite Full-Stack Entrypoint
 * Phase 2: Google Sheets Database Architecture & Persistence
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/routes';
import { healthRouter } from './src/server/health.routes';
import { snapshotSchedulerService } from './src/lib/services/snapshot-scheduler.service';
import { usersRepository } from './src/lib/repositories/users.repository';
import { googleDriveService } from './src/lib/services/google-drive.service';

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);

  // Mount Health & System Probes (FC-004)
  app.use(healthRouter);
  // Determine port and host from CLI args or environment variables
  const portArgIndex = process.argv.indexOf('--port');
  const portFromArg = portArgIndex !== -1 && process.argv[portArgIndex + 1] ? parseInt(process.argv[portArgIndex + 1], 10) : NaN;
  const PORT = !isNaN(portFromArg) ? portFromArg : (parseInt(process.env.PORT || '3000', 10) || 3000);

  const hostArgIndex = process.argv.indexOf('--host');
  const HOST = hostArgIndex !== -1 && process.argv[hostArgIndex + 1] ? process.argv[hostArgIndex + 1] : (process.env.HOST || '0.0.0.0');

  // Log Google Drive OAuth configuration status without revealing secrets
  const driveStatus = googleDriveService.getDriveConfigurationStatus();
  console.log('Google Drive OAuth configuration:');
  console.log(`  mode: ${driveStatus.mode}`);
  console.log(`  refresh token: ${driveStatus.refreshToken}`);
  console.log(`  client ID: ${driveStatus.clientId}`);
  console.log(`  client secret: ${driveStatus.clientSecret}`);
  console.log(`  root folder: ${driveStatus.rootFolder}`);

  // Initialize server-side snapshot scheduler (starts if GCS_SNAPSHOT_SCHEDULE_ENABLED=true)
  snapshotSchedulerService.startScheduler();

  // Preload authoritative users and persistent session versions from Google Sheets
  usersRepository.findAll().catch((err) => {
    console.warn('Initial users preload warning:', err?.message);
  });

  // Mount API routes FIRST
  app.use('/api', apiRouter);

  // Vite middleware for development, static bundle for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexHtmlPath = path.join(distPath, 'index.html');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(indexHtmlPath);
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Burra Pariksha CMS server running on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
