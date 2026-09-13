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

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  const PORT = 3000;

  // Initialize server-side snapshot scheduler (starts if GCS_SNAPSHOT_SCHEDULE_ENABLED=true)
  snapshotSchedulerService.startScheduler();

  // Mount API routes FIRST
  app.use('/api', apiRouter);

  // Mount static bundle when dist bundle exists, or fallback to Vite dev middleware
  const distPath = path.join(process.cwd(), 'dist');
  const indexHtmlPath = path.join(distPath, 'index.html');
  const isProductionBundleReady = fs.existsSync(indexHtmlPath);

  if (!isProductionBundleReady) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
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
