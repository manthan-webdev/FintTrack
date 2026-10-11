// Centralized Frontend API and Database Service
// Seamlessly queries Supabase directly with Row Level Security (RLS) when connected,
// provides resilient error handling for missing tables (PGRST205),
// and gracefully falls back to the backend REST API for offline/local development.

import { supabase, isLiveSupabaseAvailable } from './supabase.js';

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

let getAuthToken: (() => Promise<string | null> | string | null) | null = null;

export const setAuthTokenGetter = (fn: () => Promise<string | null> | string | null) => {
  getAuthToken = fn;
};

// Tracks whether Supabase tables have not been migrated yet so the UI can show setup instructions
let _hasSchemaNotice = false;
const schemaNoticeListeners = new Set<(missing: boolean) => void>();

export const onSchemaNoticeChange = (fn: (missing: boolean) => void) => {
  schemaNoticeListeners.add(fn);
  fn(_hasSchemaNotice);
  return () => {
    schemaNoticeListeners.delete(fn);
  };
};

function triggerSchemaNotice(isMissing: boolean) {
  if (_hasSchemaNotice !== isMissing) {
    _hasSchemaNotice = isMissing;
    schemaNoticeListeners.forEach((l) => l(isMissing));
  }
}

export function notifySchemaMissing(_tableName?: string) {
  triggerSchemaNotice(true);
}

// Checks if an error is due to a missing table in Supabase PostgreSQL (e.g. PGRST205 / 42P01)
export function isTableMissingError(err: any): boolean {
  if (!err) return false;
  const code = err.code || err?.error?.code;
  const msg = (err.message || err?.error?.message || '').toLowerCase();
  const isMissing =
    code === 'PGRST205' ||
    code === '42P01' ||
    msg.includes('schema cache') ||
    msg.includes('could not find the table') ||
    (msg.includes('relation') && msg.includes('does not exist'));

  if (isMissing) {
    triggerSchemaNotice(true);
  }
  return isMissing;
}

// Local storage fallback helpers for per-user isolated data when tables are missing
function getLocalTxs(userId: string): any[] {
  try {
    const raw = localStorage.getItem(`fintrack_txs_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalTxs(userId: string, txs: any[]): void {
  try {
    localStorage.setItem(`fintrack_txs_${userId}`, JSON.stringify(txs));
  } catch {}
}

function getLocalBudgets(userId: string): any[] {
  try {
    const raw = localStorage.getItem(`fintrack_budgets_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalBudgets(userId: string, budgets: any[]): void {
  try {
    localStorage.setItem(`fintrack_budgets_${userId}`, JSON.stringify(budgets));
  } catch {}
}

const DEFAULT_CATEGORIES: any[] = [
  { id: 'cat-food', name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#E98282' },
  { id: 'cat-shopping', name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#D4A373' },
  { id: 'cat-transport', name: 'Transport', type: 'expense', icon: 'Car', color: '#90A4AE' },
  { id: 'cat-bills', name: 'Bills & Utilities', type: 'expense', icon: 'FileText', color: '#E57373' },
  { id: 'cat-entertainment', name: 'Entertainment', type: 'expense', icon: 'Film', color: '#BA68C8' },
  { id: 'cat-health', name: 'Health & Medical', type: 'expense', icon: 'Activity', color: '#4DB6AC' },
  { id: 'cat-salary', name: 'Salary', type: 'income', icon: 'Briefcase', color: '#7ED6A5' },
  { id: 'cat-freelance', name: 'Freelance', type: 'income', icon: 'Laptop', color: '#81C784' },
  { id: 'cat-investments', name: 'Investments', type: 'income', icon: 'DollarSign', color: '#C9B58A' },
  { id: 'cat-other-inc', name: 'Other Income', type: 'income', icon: 'PlusCircle', color: '#8E929B' },
];

function resolveCategory(catId?: string, type: 'income' | 'expense' = 'expense'): any {
  if (!catId) {
    return { id: 'uncategorized', name: 'Other', type, icon: 'Tag', color: '#8E929B' };
  }
  const found = DEFAULT_CATEGORIES.find((c) => c.id === catId);
  return found || { id: catId, name: 'Custom Category', type, icon: 'Tag', color: '#C9B58A' };
}

async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken ? await getAuthToken() : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    const blob = await response.blob();
    return blob as any;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg) as any;
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data?.data !== undefined ? data.data : data;
}

// ------------------------------------------------------------------------------
// Unified Database and API Service
// ------------------------------------------------------------------------------

export const api = {
  // Transactions
  getTransactions: async (params?: {
    search?: string;
    type?: string;
    category_id?: string;
    payment_method?: string;
    startDate?: string;
    endDate?: string;
    sort?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> => {
    if (isLiveSupabaseAvailable && supabase) {
      const { data: { user } } = await supabase.auth.getUser();

      try {
        let query = supabase
          .from('transactions')
          .select('*, category:categories(id, name, type, icon, color)');

        if (params?.type) query = query.eq('type', params.type);
        if (params?.category_id) query = query.eq('category_id', params.category_id);
        if (params?.payment_method) query = query.eq('payment_method', params.payment_method);
        if (params?.startDate) query = query.gte('date', params.startDate);
        if (params?.endDate) query = query.lte('date', params.endDate);
        if (params?.search) query = query.ilike('description', `%${params.search}%`);

        if (params?.sort === 'date_asc') {
          query = query.order('date', { ascending: true });
        } else if (params?.sort === 'amount_desc') {
          query = query.order('amount', { ascending: false });
        } else if (params?.sort === 'amount_asc') {
          query = query.order('amount', { ascending: true });
        } else {
          query = query.order('date', { ascending: false });
        }

        if (params?.limit) {
          const offset = params.offset || 0;
          query = query.range(offset, offset + params.limit - 1);
        }

        const { data, error } = await query;
        if (error) {
          if (isTableMissingError(error) && user) {
            // Fallback to isolated user local store
            let list = getLocalTxs(user.id);
            if (params?.type) list = list.filter((t) => t.type === params.type);
            if (params?.category_id) list = list.filter((t) => t.category_id === params.category_id);
            if (params?.search) {
              const q = params.search.toLowerCase();
              list = list.filter((t) => t.description.toLowerCase().includes(q));
            }
            if (params?.limit) list = list.slice(params.offset || 0, (params.offset || 0) + params.limit);
            return list;
          }
          throw error;
        }

        return (data || []).map((t: any) => ({
          ...t,
          category: t.category || resolveCategory(t.category_id, t.type),
        }));
      } catch (err: any) {
        if (isTableMissingError(err) && user) {
          return getLocalTxs(user.id);
        }
        console.error('[FinTrack getTransactions error]:', err);
        throw new Error('Unable to retrieve transactions.');
      }
    }

    // Fallback to Express REST API
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
    }
    const query = searchParams.toString();
    return apiRequest<any[]>(`/transactions${query ? `?${query}` : ''}`);
  },

  getTransactionById: async (id: string): Promise<any> => {
    if (isLiveSupabaseAvailable && supabase) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*, category:categories(id, name, type, icon, color)')
          .eq('id', id)
          .single();

        if (error) {
          if (isTableMissingError(error)) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const list = getLocalTxs(user.id);
              return list.find((t) => t.id === id) || null;
            }
          }
          throw error;
        }
        return data;
      } catch (err: any) {
        if (isTableMissingError(err)) return null;
        console.error('[FinTrack getTransactionById error]:', err);
        throw new Error('Transaction not found.');
      }
    }

    return apiRequest<any>(`/transactions/${id}`);
  },

  createTransaction: async (data: {
    type: 'income' | 'expense';
    amount: number;
    category_id: string;
    description: string;
    date: string;
    payment_method: string;
    notes?: string;
  }): Promise<any> => {
    if (isLiveSupabaseAvailable && supabase) {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        throw new Error('Authentication required to save transaction.');
      }

      try {
        const { data: created, error } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            type: data.type,
            amount: data.amount,
            category_id: data.category_id || null,
            description: data.description,
            date: data.date || new Date().toISOString().split('T')[0],
            payment_method: data.payment_method || 'UPI',
            notes: data.notes || null,
          })
          .select('*, category:categories(id, name, type, icon, color)')
          .single();

        if (error) {
          if (isTableMissingError(error)) {
            notifySchemaMissing('transactions');
            throw new Error('Supabase database table "public.transactions" is missing. Please run database/schema.sql in your Supabase SQL Editor.');
          }
          throw error;
        }
        return created;
      } catch (err: any) {
        if (isTableMissingError(err)) {
          notifySchemaMissing('transactions');
          throw new Error('Supabase database table "public.transactions" is missing. Please run database/schema.sql in your Supabase SQL Editor.');
        }
        console.error('[FinTrack createTransaction error]:', err);
        throw new Error(err?.message || 'Unable to save transaction to Supabase database.');
      }
    }

    return apiRequest<any>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateTransaction: async (
    id: string,
    data: Partial<{
      type: 'income' | 'expense';
      amount: number;
      category_id: string;
      description: string;
      date: string;
      payment_method: string;
      notes?: string;
    }>
  ): Promise<any> => {
    if (isLiveSupabaseAvailable && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');

      try {
        const updatePayload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (data.type) updatePayload.type = data.type;
        if (data.amount !== undefined) updatePayload.amount = data.amount;
        if (data.category_id !== undefined) updatePayload.category_id = data.category_id || null;
        if (data.description !== undefined) updatePayload.description = data.description;
        if (data.date) updatePayload.date = data.date;
        if (data.payment_method) updatePayload.payment_method = data.payment_method;
        if (data.notes !== undefined) updatePayload.notes = data.notes || null;

        const { data: updated, error } = await supabase
          .from('transactions')
          .update(updatePayload)
          .eq('id', id)
          .select('*, category:categories(id, name, type, icon, color)')
          .single();

        if (error) {
          if (isTableMissingError(error)) {
            notifySchemaMissing('transactions');
            throw new Error('Supabase database table "public.transactions" is missing. Please run database/schema.sql in your Supabase SQL Editor.');
          }
          throw error;
        }
        return updated;
      } catch (err: any) {
        if (isTableMissingError(err)) {
          notifySchemaMissing('transactions');
          throw new Error('Supabase database table "public.transactions" is missing. Please run database/schema.sql in your Supabase SQL Editor.');
        }
        console.error('[FinTrack updateTransaction error]:', err);
        throw new Error(err?.message || 'Unable to update transaction in Supabase database.');
      }
    }

    return apiRequest<any>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteTransaction: async (id: string): Promise<{ id: string }> => {
    if (isLiveSupabaseAvailable && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');

      try {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) {
          if (isTableMissingError(error)) {
            notifySchemaMissing('transactions');
            throw new Error('Supabase database table "public.transactions" is missing. Please run database/schema.sql in your Supabase SQL Editor.');
          }
          throw error;
        }
        return { id };
      } catch (err: any) {
        if (isTableMissingError(err)) {
          notifySchemaMissing('transactions');
          throw new Error('Supabase database table "public.transactions" is missing. Please run database/schema.sql in your Supabase SQL Editor.');
        }
        console.error('[FinTrack deleteTransaction error]:', err);
        throw new Error(err?.message || 'Unable to delete transaction from Supabase database.');
      }
    }

    return apiRequest<{ id: string }>(`/transactions/${id}`, {
      method: 'DELETE',
    });
  },

  exportTransactionsCSV: async (): Promise<void> => {
    if (isLiveSupabaseAvailable && supabase) {
      const txs = await api.getTransactions({ limit: 5000 });
      const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Payment Method', 'Notes'];
      const rows = (txs || []).map((t: any) => [
        t.date,
        t.type,
        `"${(t.category?.name || 'Uncategorized').replace(/"/g, '""')}"`,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        t.amount,
        t.payment_method || 'UPI',
        `"${(t.notes || '').replace(/"/g, '""')}"`,
      ]);
      const csvContent = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fintrack_ledger_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return;
    }

    const blob = await apiRequest<Blob>('/transactions/export/csv');
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fintrack_ledger_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Categories
  getCategories: async (): Promise<any[]> => {
    if (isLiveSupabaseAvailable && supabase) {
      try {
        const { data, error } = await supabase.from('categories').select('*').order('name');
        if (error) {
          if (isTableMissingError(error)) {
            return DEFAULT_CATEGORIES;
          }
          throw error;
        }
        return data && data.length > 0 ? data : DEFAULT_CATEGORIES;
      } catch (err: any) {
        if (isTableMissingError(err)) {
          return DEFAULT_CATEGORIES;
        }
        console.error('[FinTrack getCategories error]:', err);
        return DEFAULT_CATEGORIES;
      }
    }

    return apiRequest<any[]>('/categories');
  },

  createCategory: async (data: {
    name: string;
    type: 'income' | 'expense';
    icon: string;
    color: string;
  }): Promise<any> => {
    if (isLiveSupabaseAvailable && supabase) {
      try {
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) throw new Error('Authentication required');

        const { data: created, error } = await supabase
          .from('categories')
          .insert({
            user_id: user.id,
            name: data.name,
            type: data.type,
            icon: data.icon || 'Tag',
            color: data.color || '#C9B58A',
          })
          .select('*')
          .single();

        if (error) {
          if (isTableMissingError(error)) {
            notifySchemaMissing('categories');
            throw new Error('Supabase database table "public.categories" is missing. Please run database/schema.sql in your Supabase SQL Editor.');
          }
          throw error;
        }
        return created;
      } catch (err: any) {
        if (isTableMissingError(err)) {
          notifySchemaMissing('categories');
          throw new Error('Supabase database table "public.categories" is missing. Please run database/schema.sql in your Supabase SQL Editor.');
        }
        console.error('[FinTrack createCategory error]:', err);
        throw new Error(err?.message || 'Unable to create category in Supabase database.');
      }
    }

    return apiRequest<any>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCategory: async (
    id: string,
    data: Partial<{ name: string; type: 'income' | 'expense'; icon: string; color: string }>
  ): Promise<any> => {
    if (isLiveSupabaseAvailable && supabase) {
      try {
        const { data: updated, error } = await supabase
          .from('categories')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('*')
          .single();

        if (error) {
          if (isTableMissingError(error)) {
            notifySchemaMissing('categories');
            throw new Error('Supabase database table "public.categories" is missing. Please run database/schema.sql in your Supabase SQL Editor.');
          }
          throw error;
        }
        return updated;
      } catch (err: any) {
        if (isTableMissingError(err)) {
          notifySchemaMissing('categories');
          throw new Error('Supabase database table "public.categories" is missing. Please run database/schema.sql in your Supabase SQL Editor.');
        }
        console.error('[FinTrack updateCategory error]:', err);
        throw new Error(err?.message || 'Unable to update category in Supabase database.');
      }
    }

    return apiRequest<any>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteCategory: async (id: string): Promise<{ id: string }> => {
    if (isLiveSupabaseAvailable && supabase) {
      try {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) {
          if (isTableMissingError(error)) {
            notifySchemaMissing('categories');
            throw new Error('Supabase database table "public.categories" is missing. Please run database/schema.sql in your Supabase SQL Editor.');
          }
          throw error;
        }
        return { id };
      } catch (err: any) {
        if (isTableMissingError(err)) {
          notifySchemaMissing('categories');
          throw new Error('Supabase database table "public.categories" is missing. Please run database/schema.sql in your Supabase SQL Editor.');
        }
        console.error('[FinTrack deleteCategory error]:', err);
        throw new Error(err?.message || 'Unable to delete category from Supabase database.');
      }
    }

    return apiRequest<{ id: string }>(`/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Budgets
  getBudgets: async (month?: number, year?: number): Promise<any[]> => {
    if (isLiveSupabaseAvailable && supabase) {
      const { data: { user } } = await supabase.auth.getUser();

      try {
        let query = supabase.from('budgets').select('*, category:categories(id, name, type, icon, color)');

        if (month) query = query.eq('month', month);
        if (year) query = query.eq('year', year);

        const { data: budgetList, error } = await query;
        if (error) {
          if (isTableMissingError(error) && user) {
            return getLocalBudgets(user.id);
          }
          throw error;
        }

        const actualMonth = month || new Date().getMonth() + 1;
        const actualYear = year || new Date().getFullYear();
        const startOfMonth = `${actualYear}-${String(actualMonth).padStart(2, '0')}-01`;
        const lastDay = new Date(actualYear, actualMonth, 0).getDate();
        const endOfMonth = `${actualYear}-${String(actualMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        const { data: txs } = await supabase
          .from('transactions')
          .select('category_id, amount')
          .eq('type', 'expense')
          .gte('date', startOfMonth)
          .lte('date', endOfMonth);

        const spentMap = new Map<string, number>();
        (txs || []).forEach((t: any) => {
          if (t.category_id) {
            spentMap.set(t.category_id, (spentMap.get(t.category_id) || 0) + Number(t.amount));
          }
        });

        return (budgetList || []).map((b: any) => {
          const spent = spentMap.get(b.category_id) || 0;
          const remaining = Math.max(0, Number(b.amount) - spent);
          const percentage = Number(b.amount) > 0 ? Math.round((spent / Number(b.amount)) * 100) : 0;
          return {
            ...b,
            category: b.category || resolveCategory(b.category_id, 'expense'),
            spent,
            remaining,
            percentage,
            is_warning: percentage >= 80 && percentage <= 100,
            is_exceeded: percentage > 100,
          };
        });
      } catch (err: any) {
        if (isTableMissingError(err) && user) {
          return getLocalBudgets(user.id);
        }
        console.error('[FinTrack getBudgets error]:', err);
        return [];
      }
    }

    const params = new URLSearchParams();
    if (month) params.append('month', String(month));
    if (year) params.append('year', String(year));
    const q = params.toString();
    return apiRequest<any[]>(`/budgets${q ? `?${q}` : ''}`);
  },

  createBudget: async (data: {
    category_id: string;
    amount: number;
    month: number;
    year: number;
  }): Promise<any> => {
    if (isLiveSupabaseAvailable && supabase) {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) throw new Error('Authentication required');

      try {
        const { data: created, error } = await supabase
          .from('budgets')
          .insert({
            user_id: user.id,
            category_id: data.category_id,
            amount: data.amount,
            month: data.month,
            year: data.year,
          })
          .select('*, category:categories(id, name, type, icon, color)')
          .single();

        if (error) {
          if (isTableMissingError(error)) {
            notifySchemaMissing('budgets');
            throw new Error('Supabase database table "public.budgets" is missing. Please run database/schema.sql in your Supabase SQL Editor.');
          }
          throw error;
        }
        return created;
      } catch (err: any) {
        if (isTableMissingError(err)) {
          notifySchemaMissing('budgets');
          throw new Error('Supabase database table "public.budgets" is missing. Please run database/schema.sql in your Supabase SQL Editor.');
        }
        console.error('[FinTrack createBudget error]:', err);
        throw new Error(err?.message || 'Unable to create budget limit in Supabase database.');
      }
    }

    return apiRequest<any>('/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateBudget: async (id: string, amount: number): Promise<any> => {
    if (isLiveSupabaseAvailable && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');

      try {
        const { data: updated, error } = await supabase
          .from('budgets')
          .update({
            amount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('*, category:categories(id, name, type, icon, color)')
          .single();

        if (error) {
          if (isTableMissingError(error)) {
            notifySchemaMissing('budgets');
            throw new Error('Supabase database table "public.budgets" is missing. Please run database/schema.sql in your Supabase SQL Editor.');
          }
          throw error;
        }
        return updated;
      } catch (err: any) {
        if (isTableMissingError(err)) {
          notifySchemaMissing('budgets');
          throw new Error('Supabase database table "public.budgets" is missing. Please run database/schema.sql in your Supabase SQL Editor.');
        }
        console.error('[FinTrack updateBudget error]:', err);
        throw new Error(err?.message || 'Unable to update budget limit in Supabase database.');
      }
    }

    return apiRequest<any>(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ amount }),
    });
  },

  deleteBudget: async (id: string): Promise<{ id: string }> => {
    if (isLiveSupabaseAvailable && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');

      try {
        const { error } = await supabase.from('budgets').delete().eq('id', id);
        if (error) {
          if (isTableMissingError(error)) {
            notifySchemaMissing('budgets');
            throw new Error('Supabase database table "public.budgets" is missing. Please run database/schema.sql in your Supabase SQL Editor.');
          }
          throw error;
        }
        return { id };
      } catch (err: any) {
        if (isTableMissingError(err)) {
          notifySchemaMissing('budgets');
          throw new Error('Supabase database table "public.budgets" is missing. Please run database/schema.sql in your Supabase SQL Editor.');
        }
        console.error('[FinTrack deleteBudget error]:', err);
        throw new Error(err?.message || 'Unable to delete budget limit from Supabase database.');
      }
    }

    return apiRequest<{ id: string }>(`/budgets/${id}`, {
      method: 'DELETE',
    });
  },

  // Analytics
  getAnalyticsSummary: async (range: string = '30d'): Promise<{
    totalBalance: number;
    totalIncome: number;
    totalExpenses: number;
    savings: number;
    savingsRate: number;
    transactionCount: number;
  }> => {
    if (isLiveSupabaseAvailable && supabase) {
      const { data: { user } } = await supabase.auth.getUser();

      try {
        let startDate: string | undefined;
        const now = new Date();
        if (range === '7d') startDate = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
        else if (range === '30d') startDate = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
        else if (range === '3m') startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString().split('T')[0];
        else if (range === '6m') startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()).toISOString().split('T')[0];
        else if (range === '1y') startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().split('T')[0];

        let query = supabase.from('transactions').select('type, amount, date');
        if (startDate) {
          query = query.gte('date', startDate);
        }

        const { data: txs, error } = await query;
        if (error) {
          if (isTableMissingError(error) && user) {
            let list = getLocalTxs(user.id);
            if (startDate) list = list.filter((t) => t.date >= startDate!);
            let totalIncome = 0;
            let totalExpenses = 0;
            list.forEach((t) => {
              if (t.type === 'income') totalIncome += Number(t.amount);
              else if (t.type === 'expense') totalExpenses += Number(t.amount);
            });
            const savings = totalIncome - totalExpenses;
            return {
              totalBalance: savings,
              totalIncome,
              totalExpenses,
              savings,
              savingsRate: totalIncome > 0 ? Math.max(0, Math.round((savings / totalIncome) * 100)) : 0,
              transactionCount: list.length,
            };
          }
          throw error;
        }

        let totalIncome = 0;
        let totalExpenses = 0;
        (txs || []).forEach((t: any) => {
          const amt = Number(t.amount);
          if (t.type === 'income') totalIncome += amt;
          else if (t.type === 'expense') totalExpenses += amt;
        });

        const savings = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((savings / totalIncome) * 100)) : 0;
        const totalBalance = savings;

        return {
          totalBalance,
          totalIncome,
          totalExpenses,
          savings,
          savingsRate,
          transactionCount: txs?.length || 0,
        };
      } catch (err: any) {
        if (isTableMissingError(err) && user) {
          return {
            totalBalance: 0,
            totalIncome: 0,
            totalExpenses: 0,
            savings: 0,
            savingsRate: 0,
            transactionCount: 0,
          };
        }
        console.error('[FinTrack getAnalyticsSummary error]:', err);
        return {
          totalBalance: 0,
          totalIncome: 0,
          totalExpenses: 0,
          savings: 0,
          savingsRate: 0,
          transactionCount: 0,
        };
      }
    }

    return apiRequest<{
      totalBalance: number;
      totalIncome: number;
      totalExpenses: number;
      savings: number;
      savingsRate: number;
      transactionCount: number;
    }>(`/analytics/summary?range=${range}`);
  },

  getAnalyticsMonthly: async (months: number = 6): Promise<any[]> => {
    if (isLiveSupabaseAvailable && supabase) {
      const { data: { user } } = await supabase.auth.getUser();

      try {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)
          .toISOString()
          .split('T')[0];

        const { data: txs, error } = await supabase
          .from('transactions')
          .select('type, amount, date')
          .gte('date', startDate);

        if (error) {
          if (isTableMissingError(error)) {
            return [];
          }
          throw error;
        }

        const buckets: Record<string, { label: string; income: number; expense: number; savings: number; cumulativeSavings: number; month: number; year: number }> = {};
        for (let i = months - 1; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const label = d.toLocaleString('en-US', { month: 'short' });
          buckets[key] = { label, income: 0, expense: 0, savings: 0, cumulativeSavings: 0, month: d.getMonth() + 1, year: d.getFullYear() };
        }

        (txs || []).forEach((t: any) => {
          const key = t.date.substring(0, 7);
          if (buckets[key]) {
            const amt = Number(t.amount);
            if (t.type === 'income') buckets[key].income += amt;
            else if (t.type === 'expense') buckets[key].expense += amt;
          }
        });

        let runningCumulative = 0;
        const bucketList = Object.values(buckets);
        bucketList.forEach((b) => {
          b.savings = b.income - b.expense;
          runningCumulative += b.savings;
          b.cumulativeSavings = runningCumulative;
        });

        return bucketList;
      } catch (err: any) {
        if (isTableMissingError(err)) return [];
        console.error('[FinTrack getAnalyticsMonthly error]:', err);
        return [];
      }
    }

    return apiRequest<any[]>(`/analytics/monthly?months=${months}`);
  },

  getAnalyticsCategories: async (range: string = '30d'): Promise<any[]> => {
    if (isLiveSupabaseAvailable && supabase) {
      try {
        let startDate: string | undefined;
        const now = new Date();
        if (range === '7d') startDate = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
        else if (range === '30d') startDate = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
        else if (range === '3m') startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString().split('T')[0];
        else if (range === '6m') startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()).toISOString().split('T')[0];
        else if (range === '1y') startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().split('T')[0];

        let query = supabase
          .from('transactions')
          .select('amount, category:categories(id, name, color)')
          .eq('type', 'expense');

        if (startDate) query = query.gte('date', startDate);

        const { data: txs, error } = await query;
        if (error) {
          if (isTableMissingError(error)) return [];
          throw error;
        }

        const catMap = new Map<string, { id: string; name: string; color: string; amount: number }>();
        let totalExpenses = 0;

        (txs || []).forEach((t: any) => {
          const amt = Number(t.amount);
          totalExpenses += amt;
          const catId = t.category?.id || 'uncategorized';
          const catName = t.category?.name || 'Other';
          const catColor = t.category?.color || '#C9B58A';

          if (!catMap.has(catId)) {
            catMap.set(catId, { id: catId, name: catName, color: catColor, amount: 0 });
          }
          catMap.get(catId)!.amount += amt;
        });

        return Array.from(catMap.values())
          .map((c) => ({
            ...c,
            percentage: totalExpenses > 0 ? Math.round((c.amount / totalExpenses) * 100) : 0,
          }))
          .sort((a, b) => b.amount - a.amount);
      } catch (err: any) {
        if (isTableMissingError(err)) return [];
        console.error('[FinTrack getAnalyticsCategories error]:', err);
        return [];
      }
    }

    return apiRequest<any[]>(`/analytics/categories?range=${range}`);
  },

  // Profile
  getProfile: async (): Promise<any> => {
    if (isLiveSupabaseAvailable && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          if (isTableMissingError(error)) {
            // Table doesn't exist yet in Supabase SQL editor.
            // Synthesize clean profile from user metadata and local storage so app runs smoothly.
            const savedLocal = localStorage.getItem(`fintrack_user_${user.id}`);
            if (savedLocal) {
              try {
                return JSON.parse(savedLocal);
              } catch {}
            }
            return {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Member',
              currency: 'INR',
              monthly_income: 0,
              average_monthly_spending: 0,
              average_monthly_savings: 0,
              preferred_payment_method: 'UPI',
              onboarding_completed: false,
              preferred_language: 'en',
              created_at: user.created_at,
            };
          }
          throw error;
        }

        if (!data) {
          return {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Member',
            currency: 'INR',
            monthly_income: 0,
            average_monthly_spending: 0,
            average_monthly_savings: 0,
            preferred_payment_method: 'UPI',
            onboarding_completed: false,
            preferred_language: 'en',
            created_at: user.created_at,
          };
        }

        return {
          ...data,
          email: user.email,
          currency: data.currency || 'INR',
        };
      } catch (err: any) {
        if (isTableMissingError(err)) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            return {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || 'Member',
              currency: 'INR',
              monthly_income: 0,
              average_monthly_spending: 0,
              average_monthly_savings: 0,
              preferred_payment_method: 'UPI',
              onboarding_completed: false,
              created_at: user.created_at,
            };
          }
        }
        console.warn('[FinTrack getProfile notice]:', err?.message || err);
        return null;
      }
    }

    return apiRequest<any>('/profile');
  },

  updateProfile: async (data: {
    full_name?: string;
    avatar_url?: string | null;
    currency?: string;
    monthly_income?: number;
    average_monthly_spending?: number;
    average_monthly_savings?: number;
    preferred_payment_method?: string;
    onboarding_completed?: boolean;
    preferred_language?: string;
  }): Promise<any> => {
    if (isLiveSupabaseAvailable && supabase) {
      let activeUser: any = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        activeUser = user;
      } catch {
        // Ignored
      }

      if (!activeUser) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          activeUser = session?.user || null;
        } catch {
          // Ignored
        }
      }

      if (!activeUser) {
        console.warn('[FinTrack updateProfile notice]: No active Supabase session found to persist profile remotely.');
        return {
          id: 'guest',
          full_name: data.full_name || 'Member',
          currency: data.currency || 'INR',
          ...data,
          updated_at: new Date().toISOString(),
        };
      }

      const user = activeUser;

      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (data.full_name !== undefined) updatePayload.full_name = data.full_name;
      if (data.currency !== undefined) {
        updatePayload.currency = data.currency;
      }
      if (data.monthly_income !== undefined) updatePayload.monthly_income = data.monthly_income;
      if (data.average_monthly_spending !== undefined) updatePayload.average_monthly_spending = data.average_monthly_spending;
      if (data.average_monthly_savings !== undefined) updatePayload.average_monthly_savings = data.average_monthly_savings;
      if (data.preferred_payment_method !== undefined) updatePayload.preferred_payment_method = data.preferred_payment_method;
      if (data.onboarding_completed !== undefined) updatePayload.onboarding_completed = data.onboarding_completed;
      if (data.preferred_language !== undefined) updatePayload.preferred_language = data.preferred_language;

      try {
        const { data: updated, error } = await supabase
          .from('profiles')
          .upsert(
            {
              id: user.id,
              ...updatePayload,
            },
            { onConflict: 'id' }
          )
          .select('*')
          .single();

        if (error) {
          if (isTableMissingError(error)) {
            const fallbackProfile = {
              id: user.id,
              email: user.email,
              full_name: data.full_name || user.user_metadata?.full_name || 'Member',
              currency: updatePayload.currency || 'INR',
              monthly_income: data.monthly_income ?? 0,
              average_monthly_spending: data.average_monthly_spending ?? 0,
              average_monthly_savings: data.average_monthly_savings ?? 0,
              preferred_payment_method: data.preferred_payment_method || 'UPI',
              onboarding_completed: data.onboarding_completed ?? true,
              preferred_language: data.preferred_language || 'en',
              updated_at: new Date().toISOString(),
            };
            localStorage.setItem(`fintrack_user_${user.id}`, JSON.stringify(fallbackProfile));
            return fallbackProfile;
          }
          throw error;
        }

        return {
          ...updated,
          email: user.email,
          currency: updated.currency || 'INR',
        };
      } catch (err: any) {
        if (isTableMissingError(err)) {
          const fallbackProfile = {
            id: user.id,
            email: user.email,
            full_name: data.full_name || user.user_metadata?.full_name || 'Member',
            currency: updatePayload.currency || 'INR',
            monthly_income: data.monthly_income ?? 0,
            average_monthly_spending: data.average_monthly_spending ?? 0,
            average_monthly_savings: data.average_monthly_savings ?? 0,
            preferred_payment_method: data.preferred_payment_method || 'UPI',
            onboarding_completed: data.onboarding_completed ?? true,
            preferred_language: data.preferred_language || 'en',
            updated_at: new Date().toISOString(),
          };
          localStorage.setItem(`fintrack_user_${user.id}`, JSON.stringify(fallbackProfile));
          return fallbackProfile;
        }
        console.error('[FinTrack updateProfile error]:', err);
        throw new Error('Unable to update profile.');
      }
    }

    return apiRequest<any>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
