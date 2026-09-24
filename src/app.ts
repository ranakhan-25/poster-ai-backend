import express from 'express';
import cors from 'cors';
import cookieParser from "cookie-parser";
import helmet from 'helmet';
import { env } from './config/env';
import { apiLimiter } from './middleware/rateLimit';
import { errorHandler, notFound } from './middleware/error';
import { router } from './routes';

/** Strips keys starting with `$` or containing `.` to block NoSQL operator injection. */
function sanitize(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sanitize);
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v).filter(([k]) => !k.startsWith('$') && !k.includes('.')).map(([k, x]) => [k, sanitize(x)]));
  }
  return v;
}

export function createApp() {
  const app = express();
  app.use(cookieParser());
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN.split(','), credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use((req, _res, next) => { req.body = sanitize(req.body); next(); });
  app.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
  app.use('/api', apiLimiter, router);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
