import rateLimit from 'express-rate-limit';

const base = { standardHeaders: true, legacyHeaders: false };
export const apiLimiter = rateLimit({ ...base, windowMs: 15 * 60_000, limit: 300,
  message: { success: false, message: 'Too many requests, please try again later' } });
export const authLimiter = rateLimit({ ...base, windowMs: 15 * 60_000, limit: 20,
  message: { success: false, message: 'Too many attempts, please try again later' } });
export const generationLimiter = rateLimit({ ...base, windowMs: 60 * 60_000, limit: 15,
  message: { success: false, message: 'Poster generation limit reached, try again in an hour' } });
