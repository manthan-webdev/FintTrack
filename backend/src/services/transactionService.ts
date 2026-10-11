import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { memoryStore, TransactionRecord } from './store.js';

export interface TransactionFilterOptions {
  search?: string;
  type?: 'income' | 'expense';
  category_id?: string;
  payment_method?: string;
  startDate?: string;
  endDate?: string;
  sort?: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
  limit?: number;
  offset?: number;
}

export class TransactionService {
  async getTransactions(userId: string, filters: TransactionFilterOptions = {}): Promise<{ transactions: any[]; total: number }> {
    if (isSupabaseConfigured && supabaseAdmin) {
      let query = supabaseAdmin
        .from('transactions')
        .select('*, category:categories(id, name, type, icon, color)', { count: 'exact' })
        .eq('user_id', userId);

      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      if (filters.payment_method) {
        query = query.eq('payment_method', filters.payment_method);
      }
      if (filters.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('date', filters.endDate);
      }
      if (filters.search) {
        query = query.ilike('description', `%${filters.search}%`);
      }

      // Sorting
      if (filters.sort === 'date_asc') {
        query = query.order('date', { ascending: true });
      } else if (filters.sort === 'amount_desc') {
        query = query.order('amount', { ascending: false });
      } else if (filters.sort === 'amount_asc') {
        query = query.order('amount', { ascending: true });
      } else {
        query = query.order('date', { ascending: false });
      }

      if (filters.limit) {
        const offset = filters.offset || 0;
        query = query.range(offset, offset + filters.limit - 1);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      return { transactions: data || [], total: count || 0 };
    }

    // In-memory store fallback
    let all = memoryStore.getTransactions(userId);
    const categories = memoryStore.getCategories(userId);
    const catMap = new Map(categories.map(c => [c.id, c]));

    // Join category
    let enriched = all.map(t => ({
      ...t,
      category: catMap.get(t.category_id) || {
        id: t.category_id,
        name: 'Uncategorized',
        type: t.type,
        icon: 'Tag',
        color: '#8E929B',
      },
    }));

    if (filters.type) {
      enriched = enriched.filter(t => t.type === filters.type);
    }
    if (filters.category_id) {
      enriched = enriched.filter(t => t.category_id === filters.category_id);
    }
    if (filters.payment_method) {
      enriched = enriched.filter(t => t.payment_method === filters.payment_method);
    }
    if (filters.startDate) {
      enriched = enriched.filter(t => t.date >= filters.startDate!);
    }
    if (filters.endDate) {
      enriched = enriched.filter(t => t.date <= filters.endDate!);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      enriched = enriched.filter(t =>
        t.description.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q)) ||
        t.category.name.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (filters.sort === 'date_asc') {
      enriched.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (filters.sort === 'amount_desc') {
      enriched.sort((a, b) => b.amount - a.amount);
    } else if (filters.sort === 'amount_asc') {
      enriched.sort((a, b) => a.amount - b.amount);
    } else {
      enriched.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    const total = enriched.length;
    if (filters.limit) {
      const offset = filters.offset || 0;
      enriched = enriched.slice(offset, offset + filters.limit);
    }

    return { transactions: enriched, total };
  }

  async getTransactionById(userId: string, id: string): Promise<any | null> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('transactions')
        .select('*, category:categories(*)')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    }

    const tx = memoryStore.getTransactionById(userId, id);
    if (!tx) return null;
    const categories = memoryStore.getCategories(userId);
    const category = categories.find(c => c.id === tx.category_id);
    return { ...tx, category };
  }

  async createTransaction(
    userId: string,
    data: {
      type: 'income' | 'expense';
      amount: number;
      category_id: string;
      description: string;
      date: string;
      payment_method: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Other';
      notes?: string | null;
    }
  ): Promise<any> {
    if (isSupabaseConfigured && supabaseAdmin) {
      if (data.category_id) {
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
      }

      const { data: created, error } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: userId,
          type: data.type,
          amount: data.amount,
          category_id: data.category_id,
          description: data.description,
          date: data.date,
          payment_method: data.payment_method,
          notes: data.notes || null,
        })
        .select('*, category:categories(*)')
        .single();

      if (error) throw error;
      return created;
    }

    if (data.category_id) {
      const categories = memoryStore.getCategories(userId);
      const catExists = categories.some(c => c.id === data.category_id);
      if (!catExists) {
        const err: any = new Error('Category not found or unauthorized for this user');
        err.statusCode = 400;
        throw err;
      }
    }

    const created = memoryStore.createTransaction(userId, data);
    const categories = memoryStore.getCategories(userId);
    const category = categories.find(c => c.id === created.category_id);
    return { ...created, category };
  }

  async updateTransaction(
    userId: string,
    id: string,
    data: Partial<{
      type: 'income' | 'expense';
      amount: number;
      category_id: string;
      description: string;
      date: string;
      payment_method: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Other';
      notes?: string | null;
    }>
  ): Promise<any> {
    if (isSupabaseConfigured && supabaseAdmin) {
      if (data.category_id) {
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
      }

      const { data: updated, error } = await supabaseAdmin
        .from('transactions')
        .update(data)
        .eq('id', id)
        .eq('user_id', userId)
        .select('*, category:categories(*)')
        .single();

      if (error) throw error;
      return updated;
    }

    if (data.category_id) {
      const categories = memoryStore.getCategories(userId);
      const catExists = categories.some(c => c.id === data.category_id);
      if (!catExists) {
        const err: any = new Error('Category not found or unauthorized for this user');
        err.statusCode = 400;
        throw err;
      }
    }

    const updated = memoryStore.updateTransaction(userId, id, data);
    const categories = memoryStore.getCategories(userId);
    const category = categories.find(c => c.id === updated.category_id);
    return { ...updated, category };
  }

  async deleteTransaction(userId: string, id: string): Promise<void> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      return;
    }

    return memoryStore.deleteTransaction(userId, id);
  }
}

export const transactionService = new TransactionService();
