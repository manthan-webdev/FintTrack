import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/summary', (req, res, next) => analyticsController.getSummary(req, res, next));
router.get('/monthly', (req, res, next) => analyticsController.getMonthly(req, res, next));
router.get('/categories', (req, res, next) => analyticsController.getCategories(req, res, next));

export default router;
