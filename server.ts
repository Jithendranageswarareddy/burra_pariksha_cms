/**
 * BURRA PARIKSHA CMS - Express & Vite Full-Stack Entrypoint
 * Phase 2: Google Sheets Database Architecture & Persistence
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/routes';
import { snapshotSchedulerService } from './src/lib/services/snapshot-scheduler.service';
import { usersRepository } from './src/lib/repositories/users.repository';

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  const PORT = 3000;

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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Burra Pariksha CMS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
