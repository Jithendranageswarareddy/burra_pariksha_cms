/**
 * BURRA PARIKSHA CMS - Express & Vite Full-Stack Entrypoint
 * Phase 2: Google Sheets Database Architecture & Persistence
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/routes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Mount API routes FIRST
  app.use('/api', apiRouter);

  // Vite middleware for development vs Static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexHtmlPath = path.join(distPath, 'index.html');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }
    app.get('*', (req, res) => {
      if (fs.existsSync(indexHtmlPath)) {
        res.sendFile(indexHtmlPath);
      } else {
        res.status(200).send(`<!doctype html><html><head><meta charset="UTF-8"><title>Burra Pariksha CMS</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`);
      }
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
