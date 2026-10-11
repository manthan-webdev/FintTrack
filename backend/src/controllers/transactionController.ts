import { Request, Response, NextFunction } from 'express';
import { transactionService } from '../services/transactionService.js';
import { createTransactionSchema, updateTransactionSchema } from '../validators/index.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

export class TransactionController {
  async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { search, type, category_id, payment_method, startDate, endDate, sort, limit, offset } = req.query;

      const result = await transactionService.getTransactions(userId, {
        search: search as string,
        type: type as any,
        category_id: category_id as string,
        payment_method: payment_method as string,
        startDate: startDate as string,
        endDate: endDate as string,
        sort: sort as any,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      sendSuccess(res, result.transactions, 'Transactions retrieved successfully', 200, {
        total: result.total,
        count: result.transactions.length,
      });
    } catch (err) {
      next(err);
    }
  }

  async getTransactionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const transaction = await transactionService.getTransactionById(userId, id);
      if (!transaction) {
        sendError(res, 'Transaction not found', 404);
        return;
      }

      sendSuccess(res, transaction, 'Transaction details retrieved');
    } catch (err) {
      next(err);
    }
  }

  async createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const validatedData = createTransactionSchema.parse(req.body);

      const created = await transactionService.createTransaction(userId, validatedData);
      sendSuccess(res, created, 'Transaction created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async updateTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const validatedData = updateTransactionSchema.parse(req.body);

      const updated = await transactionService.updateTransaction(userId, id, validatedData);
      sendSuccess(res, updated, 'Transaction updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async deleteTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await transactionService.deleteTransaction(userId, id);
      sendSuccess(res, { id }, 'Transaction deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  async exportTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await transactionService.getTransactions(userId, { limit: 5000 });

      // Generate CSV format
      const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Payment Method', 'Notes'];
      const rows = result.transactions.map(t => [
        t.date,
        t.type,
        `"${(t.category?.name || 'Uncategorized').replace(/"/g, '""')}"`,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        t.amount,
        t.payment_method,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="fintrack_transactions_${new Date().toISOString().split('T')[0]}.csv"`);
      res.status(200).send(csvContent);
    } catch (err) {
      next(err);
    }
  }
}

export const transactionController = new TransactionController();
