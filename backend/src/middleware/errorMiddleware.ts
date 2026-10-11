import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/responseHelper.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // 1. Zod Validation Error (HTTP 422 Unprocessable Entity)
  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    res.status(422).json({
      success: false,
      message: 'Validation failed. Please correct input fields.',
      errors: formattedErrors,
    });
    return;
  }

  // 2. PostgreSQL / Supabase Specific Error Codes
  if (err?.code) {
    // 23505: Unique constraint violation (e.g. duplicate category or budget for same month)
    if (err.code === '23505') {
      sendError(res, 'A record with this name or unique key already exists.', 409);
      return;
    }
    // 23503: Foreign key constraint violation (e.g. category has dependent transactions)
    if (err.code === '23503') {
      sendError(
        res,
        'Cannot complete operation. Dependent records (e.g. transactions or categories) exist.',
        400
      );
      return;
    }
    // 23502: Not null violation
    if (err.code === '23502') {
      sendError(res, 'Missing required database field.', 400);
      return;
    }
  }

  // 3. Known Application Errors
  const statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);
  const message = err.message || 'Internal Server Error';

  // Do not leak stack traces or internal secrets to production clients
  const isProduction = process.env.NODE_ENV === 'production';
  const errorDetails = isProduction ? undefined : err.stack;

  sendError(res, message, statusCode, errorDetails);
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  sendError(res, 'The requested API resource does not exist.', 404);
};
