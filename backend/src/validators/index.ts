import { z } from 'zod';

// Transaction Validation Schema
export const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense'] as const),
  amount: z
    .number()
    .positive('Amount must be greater than zero')
    .max(1000000000, 'Amount exceeds sensible financial limit'),
  category_id: z.string().min(1, 'Category is required'),
  description: z
    .string()
    .trim()
    .min(1, 'Description cannot be empty')
    .max(255, 'Description cannot exceed 255 characters'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  payment_method: z.enum(['Cash', 'Card', 'UPI', 'Bank Transfer', 'Other'] as const),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional().nullable(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

// Category Validation Schema
export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Category name cannot be empty')
    .max(50, 'Category name cannot exceed 50 characters'),
  type: z.enum(['income', 'expense'] as const),
  icon: z.string().trim().min(1, 'Icon name is required').max(50),
  color: z
    .string()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Color must be a valid hex code (e.g. #7ED6A5)'),
});

export const updateCategorySchema = createCategorySchema.partial();

// Budget Validation Schema
export const createBudgetSchema = z.object({
  category_id: z.string().min(1, 'Category is required'),
  amount: z
    .number()
    .positive('Budget amount must be greater than zero')
    .max(1000000000, 'Budget exceeds sensible financial limit'),
  month: z
    .number()
    .int('Month must be an integer')
    .min(1, 'Month must be between 1 and 12')
    .max(12, 'Month must be between 1 and 12'),
  year: z
    .number()
    .int('Year must be an integer')
    .min(2020, 'Year must be at least 2020')
    .max(2100, 'Year must not exceed 2100'),
});

export const updateBudgetSchema = z.object({
  amount: z
    .number()
    .positive('Budget amount must be greater than zero')
    .max(1000000000, 'Budget exceeds sensible financial limit'),
});

// Profile Update Schema
export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, 'Full name cannot be empty')
    .max(100, 'Full name cannot exceed 100 characters')
    .optional(),
  avatar_url: z.string().url('Avatar URL must be a valid URL').optional().nullable(),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD'] as const).optional(),
  monthly_income: z.number().min(0).max(1000000000).optional(),
  average_monthly_spending: z.number().min(0).max(1000000000).optional(),
  average_monthly_savings: z.number().min(0).max(1000000000).optional(),
  preferred_payment_method: z.enum(['UPI', 'Cash', 'Card', 'Debit/Credit Card', 'Bank Transfer', 'Other'] as const).optional(),
  onboarding_completed: z.boolean().optional(),
  preferred_language: z.enum(['en', 'hi'] as const).optional(),
});

