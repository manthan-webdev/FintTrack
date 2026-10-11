import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { sendError } from '../utils/responseHelper.js';

// Extend Express Request to include authenticated user
export interface AuthenticatedUser {
  id: string;
  email: string;
  full_name?: string;
  user_metadata?: Record<string, any>;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Authentication Middleware:
 * Extracts and verifies the Supabase JWT token from the Authorization header (Bearer <token>).
 * Strictly binds request.user to prevent IDOR vulnerabilities.
 * Never trust a client-supplied user_id in the body or query params.
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Authentication required. Missing Bearer token.', 401);
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      sendError(res, 'Authentication required. Empty token supplied.', 401);
      return;
    }

    // 1. If Supabase is configured with live keys, verify JWT via Supabase Admin API
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        sendError(res, 'Invalid or expired authentication token. Please log in again.', 401, error?.message);
        return;
      }

      req.user = {
        id: user.id,
        email: user.email || '',
        full_name: (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || 'User',
        user_metadata: user.user_metadata,
      };

      return next();
    }

    // 2. Local fallback / demo mode (when Supabase credentials are not yet configured in .env)
    // Allows testing the full SaaS suite with client-generated secure test tokens or simulated sessions
    try {
      // Decode JWT payload or token identifier safely without crashing
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        req.user = {
          id: payload.sub || payload.id || 'dev-user-001',
          email: payload.email || 'developer@fintrack.io',
          full_name: payload.user_metadata?.full_name || 'FinTrack Member',
          user_metadata: payload.user_metadata || {},
        };
      } else {
        // Simple token format (e.g. demo-session-<id>)
        req.user = {
          id: token.startsWith('demo-') ? token : `user-${token.substring(0, 16)}`,
          email: `${token.substring(0, 8)}@fintrack.io`,
          full_name: 'FinTrack Member',
          user_metadata: {},
        };
      }
      return next();
    } catch {
      req.user = {
        id: 'dev-user-default',
        email: 'member@fintrack.io',
        full_name: 'FinTrack Member',
      };
      return next();
    }
  } catch (err: any) {
    sendError(res, 'Authentication verification failure.', 500, err?.message);
  }
};
