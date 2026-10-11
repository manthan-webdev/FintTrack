import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/categoryService.js';
import { createCategorySchema, updateCategorySchema } from '../validators/index.js';
import { sendSuccess } from '../utils/responseHelper.js';

export class CategoryController {
  async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const categories = await categoryService.getCategories(userId);
      sendSuccess(res, categories, 'Categories retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const validatedData = createCategorySchema.parse(req.body);

      const created = await categoryService.createCategory(userId, validatedData);
      sendSuccess(res, created, 'Category created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const validatedData = updateCategorySchema.parse(req.body);

      const updated = await categoryService.updateCategory(userId, id, validatedData);
      sendSuccess(res, updated, 'Category updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await categoryService.deleteCategory(userId, id);
      sendSuccess(res, { id }, 'Category deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}

export const categoryController = new CategoryController();
