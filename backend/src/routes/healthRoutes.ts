import { Router, Request, Response } from 'express';
import { isSupabaseConfigured } from '../config/supabase.js';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'FinTrack REST API',
    version: '1.0.0',
    database: isSupabaseConfigured ? 'Supabase PostgreSQL' : 'Memory Adapter (Dev Mode)',
  });
});

export default router;
