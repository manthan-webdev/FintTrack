import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { memoryStore, BudgetRecord } from './store.js';

export interface BudgetWithSpending extends BudgetRecord {
  category: {
    id: string;
    name: string;
    type: string;
    icon: string;
    color: string;
  };
  spent: number;
  remaining: number;
  percentage: number;
  is_warning: boolean;
  is_exceeded: boolean;
}

export class BudgetService {
  async getBudgets(userId: string, month?: number, year?: number): Promise<BudgetWithSpending[]> {
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();

    // 1. Fetch budgets for the month and year
    let budgets: any[] = [];
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('budgets')
        .select('*, category:categories(*)')
        .eq('user_id', userId)
        .eq('month', targetMonth)
        .eq('year', targetYear);

      if (error) throw error;
      budgets = data || [];
    } else {
      const rawBudgets = memoryStore.getBudgets(userId, targetMonth, targetYear);
      const categories = memoryStore.getCategories(userId);
      const catMap = new Map(categories.map(c => [c.id, c]));
      budgets = rawBudgets.map(b => ({
        ...b,
        category: catMap.get(b.category_id) || {
          id: b.category_id,
          name: 'Category',
          type: 'expense',
          icon: 'Tag',
          color: '#8E929B',
        },
      }));
    }

    // 2. Fetch all expenses for that month & year to compute spent per category
    const startStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const endStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    let spentByCategory: Record<string, number> = {};

    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: txs, error: txError } = await supabaseAdmin
        .from('transactions')
        .select('category_id, amount')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('date', startStr)
        .lte('date', endStr);

      if (txError) throw txError;
      (txs || []).forEach(tx => {
        spentByCategory[tx.category_id] = (spentByCategory[tx.category_id] || 0) + Number(tx.amount);
      });
    } else {
      const txs = memoryStore.getTransactions(userId).filter(
        t => t.type === 'expense' && t.date >= startStr && t.date <= endStr
      );
      txs.forEach(tx => {
        spentByCategory[tx.category_id] = (spentByCategory[tx.category_id] || 0) + Number(tx.amount);
      });
    }

    // 3. Assemble budget health statistics
    return budgets.map(b => {
      const budgetAmount = Number(b.amount);
      const spent = spentByCategory[b.category_id] || 0;
      const remaining = Math.max(0, budgetAmount - spent);
      const percentage = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0;
      const is_warning = percentage >= 80 && percentage <= 100;
      const is_exceeded = percentage > 100;

      return {
        ...b,
        spent,
        remaining,
        percentage,
        is_warning,
        is_exceeded,
      };
    });
  }

  async createBudget(
    userId: string,
    data: { category_id: string; amount: number; month: number; year: number }
  ): Promise<any> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: cat } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('id', data.category_id)
        .eq('user_id', userId)
        .maybeSingle();

      if (!cat) {
        const err: any = new Error('Category not found or unauthorized for this user');
        err.statusCode = 400;
        throw err;
      }

      const { data: created, error } = await supabaseAdmin
        .from('budgets')
        .insert({
          user_id: userId,
          category_id: data.category_id,
          amount: data.amount,
          month: data.month,
          year: data.year,
        })
        .select('*, category:categories(*)')
        .single();

      if (error) throw error;
      return created;
    }

    const categories = memoryStore.getCategories(userId);
    const catExists = categories.some(c => c.id === data.category_id);
    if (!catExists) {
      const err: any = new Error('Category not found or unauthorized for this user');
      err.statusCode = 400;
      throw err;
    }

    const created = memoryStore.createBudget(userId, data);
    const category = categories.find(c => c.id === created.category_id);
    return { ...created, category };
  }

  async updateBudget(userId: string, id: string, amount: number): Promise<any> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: updated, error } = await supabaseAdmin
        .from('budgets')
        .update({ amount })
        .eq('id', id)
        .eq('user_id', userId)
        .select('*, category:categories(*)')
        .single();

      if (error) throw error;
      return updated;
    }

    const updated = memoryStore.updateBudget(userId, id, { amount });
    const categories = memoryStore.getCategories(userId);
    const category = categories.find(c => c.id === updated.category_id);
    return { ...updated, category };
  }

  async deleteBudget(userId: string, id: string): Promise<void> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      return;
    }

    return memoryStore.deleteBudget(userId, id);
  }
}

export const budgetService = new BudgetService();
