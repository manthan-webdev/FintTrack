import { createServer as createViteServer } from 'vite';
import createApp from './backend/src/app.js';
import path from 'path';
import fs from 'fs';
import express from 'express';

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = createApp();

  if (!isProd) {
    // Development mode: Attach Vite dev server middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);
    console.log('[FinTrack] Running in full-stack development mode with Vite HMR middleware');
  } else {
    // Production mode: Serve pre-built static client assets
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
      console.log('[FinTrack] Serving production build from /dist');
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FinTrack] Full-stack application ready at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[FinTrack] Server startup failed:', err);
  process.exit(1);
});
