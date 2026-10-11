import { Router } from 'express';
import { transactionController } from '../controllers/transactionController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// All transaction routes strictly require authentication
router.use(requireAuth);

router.get('/', (req, res, next) => transactionController.getTransactions(req, res, next));
router.get('/export/csv', (req, res, next) => transactionController.exportTransactions(req, res, next));
router.get('/:id', (req, res, next) => transactionController.getTransactionById(req, res, next));
router.post('/', (req, res, next) => transactionController.createTransaction(req, res, next));
router.put('/:id', (req, res, next) => transactionController.updateTransaction(req, res, next));
router.delete('/:id', (req, res, next) => transactionController.deleteTransaction(req, res, next));

export default router;
