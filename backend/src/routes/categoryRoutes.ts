import { Router } from 'express';
import { categoryController } from '../controllers/categoryController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', (req, res, next) => categoryController.getCategories(req, res, next));
router.post('/', (req, res, next) => categoryController.createCategory(req, res, next));
router.put('/:id', (req, res, next) => categoryController.updateCategory(req, res, next));
router.delete('/:id', (req, res, next) => categoryController.deleteCategory(req, res, next));

export default router;
