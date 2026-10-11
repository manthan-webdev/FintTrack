import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analyticsService.js';
import { sendSuccess } from '../utils/responseHelper.js';

export class AnalyticsController {
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { range } = req.query;

      const summary = await analyticsService.getSummary(userId, (range as string) || '30d');
      sendSuccess(res, summary, 'Analytics summary retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getMonthly(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { months } = req.query;
      const count = months ? parseInt(months as string, 10) : 6;

      const trends = await analyticsService.getMonthlyTrends(userId, count);
      sendSuccess(res, trends, 'Monthly trends retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { range } = req.query;

      const breakdown = await analyticsService.getCategoryBreakdown(userId, (range as string) || '30d');
      sendSuccess(res, breakdown, 'Category spending breakdown retrieved');
    } catch (err) {
      next(err);
    }
  }
}

export const analyticsController = new AnalyticsController();
