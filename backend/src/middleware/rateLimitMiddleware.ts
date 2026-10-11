import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/responseHelper.js';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

/**
 * Lightweight in-memory sliding-window rate limiter for production API protection.
 * Protects auth and transactional endpoints from brute-force attempts and DoS.
 */
export const createRateLimiter = (options: RateLimitOptions) => {
  const windowMs = options.windowMs;
  const max = options.max;
  const message = options.message || 'Too many requests. Please try again later.';
  const hits = new Map<string, { count: number; resetTime: number }>();

  // Periodically clean up expired bucket entries
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, data] of hits.entries()) {
      if (now > data.resetTime) {
        hits.delete(key);
      }
    }
  }, 60000);

  if (timer.unref) {
    timer.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = hits.get(ip);

    if (!entry || now > entry.resetTime) {
      hits.set(ip, { count: 1, resetTime: now + windowMs });
      res.setHeader('RateLimit-Limit', max);
      res.setHeader('RateLimit-Remaining', max - 1);
      res.setHeader('RateLimit-Reset', Math.ceil((now + windowMs) / 1000));
      return next();
    }

    entry.count += 1;
    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', Math.max(0, max - entry.count));
    res.setHeader('RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.resetTime - now) / 1000));
      sendError(res, message, 429);
      return;
    }

    return next();
  };
};
