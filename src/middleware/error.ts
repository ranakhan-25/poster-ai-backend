import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';
import { AppError } from '../utils/errors';
import { isProd } from '../config/env';

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, 'Route not found'));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  let status = 500;
  let message = 'Something went wrong';
  let details: unknown;

  if (err instanceof AppError) { status = err.statusCode; message = err.message; }
  else if (err instanceof ZodError) {
    status = 400; message = 'Validation failed';
    details = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
  } else if (err instanceof multer.MulterError) {
    status = 400; message = err.code === 'LIMIT_FILE_SIZE' ? 'Each photo must be 5MB or smaller' : err.message;
  } else if ((err as { code?: number })?.code === 11000) { status = 409; message = 'Already exists'; }

  if (status === 500) console.error(err);
  res.status(status).json({
    success: false, message, ...(details ? { details } : {}),
    ...(!isProd && status === 500 && err instanceof Error ? { stack: err.stack } : {}),
  });
}
