import { Router } from 'express';
import { budgetController } from '../controllers/budgetController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', (req, res, next) => budgetController.getBudgets(req, res, next));
router.post('/', (req, res, next) => budgetController.createBudget(req, res, next));
router.put('/:id', (req, res, next) => budgetController.updateBudget(req, res, next));
router.delete('/:id', (req, res, next) => budgetController.deleteBudget(req, res, next));

export default router;
