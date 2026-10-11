import { Request, Response, NextFunction } from 'express';
import { budgetService } from '../services/budgetService.js';
import { createBudgetSchema, updateBudgetSchema } from '../validators/index.js';
import { sendSuccess } from '../utils/responseHelper.js';

export class BudgetController {
  async getBudgets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { month, year } = req.query;

      const m = month ? parseInt(month as string, 10) : undefined;
      const y = year ? parseInt(year as string, 10) : undefined;

      const budgets = await budgetService.getBudgets(userId, m, y);
      sendSuccess(res, budgets, 'Budgets retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async createBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const validatedData = createBudgetSchema.parse(req.body);

      const created = await budgetService.createBudget(userId, validatedData);
      sendSuccess(res, created, 'Budget limit created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async updateBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const validatedData = updateBudgetSchema.parse(req.body);

      const updated = await budgetService.updateBudget(userId, id, validatedData.amount);
      sendSuccess(res, updated, 'Budget updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async deleteBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await budgetService.deleteBudget(userId, id);
      sendSuccess(res, { id }, 'Budget removed successfully');
    } catch (err) {
      next(err);
    }
  }
}

export const budgetController = new BudgetController();
