import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { yarnsRouter } from './routes/yarns.js';
import { metaRouter } from './routes/meta.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/yarns', yarnsRouter);
  app.use('/api', metaRouter);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  // In production, serve the built Vue app from the same origin (single deploy).
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
  if (existsSync(dist)) {
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error(err);
    const dbDown = err.code === 'ECONNREFUSED' || err.code === '3D000' || err.code === '42P01';
    res.status(dbDown ? 503 : 500).json({
      error: dbDown ? 'Database unavailable — is Postgres running and migrated?' : 'Something went wrong',
    });
  });

  return app;
}
