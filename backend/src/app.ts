import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import healthRoutes from './routes/healthRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import { createRateLimiter } from './middleware/rateLimitMiddleware.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';

dotenv.config();

export const createApp = (): Express => {
  const app = express();

  // Security: HTTP headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Vite inline styles & fonts in dev
      crossOriginEmbedderPolicy: false,
    })
  );

  // Security: Strict CORS configuration
  const allowedOrigin = process.env.FRONTEND_URL;
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or same-origin preview)
        if (!origin) return callback(null, true);
        if (allowedOrigin && origin === allowedOrigin) return callback(null, true);
        if (origin.endsWith('.run.app')) return callback(null, true);
        // Only permit localhost origins during local development
        if (process.env.NODE_ENV !== 'production' && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
          return callback(null, true);
        }
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body Parsing with sensible request size limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Rate Limiting Protection (500 requests per 15 minutes per IP)
  app.use('/api', createRateLimiter({ windowMs: 15 * 60 * 1000, max: 500 }));

  // REST API Endpoints
  app.use('/api', healthRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/budgets', budgetRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/profile', profileRoutes);

  // 404 handler for unmatched /api routes
  app.use('/api/*', notFoundHandler);

  // Centralized Error Middleware
  app.use(errorHandler);

  return app;
};

export default createApp;
