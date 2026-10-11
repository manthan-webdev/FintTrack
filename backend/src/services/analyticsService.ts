import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { memoryStore } from './store.js';

export class AnalyticsService {
  async getSummary(userId: string, range: string = '30d'): Promise<{
    totalBalance: number;
    totalIncome: number;
    totalExpenses: number;
    savings: number;
    savingsRate: number;
    transactionCount: number;
  }> {
    const { startDate, endDate } = this.resolveDateRange(range);

    let transactions: any[] = [];
    if (isSupabaseConfigured && supabaseAdmin) {
      let query = supabaseAdmin
        .from('transactions')
        .select('type, amount, date')
        .eq('user_id', userId);

      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);

      const { data, error } = await query;
      if (error) throw error;
      transactions = data || [];
    } else {
      transactions = memoryStore.getTransactions(userId);
      if (startDate) transactions = transactions.filter(t => t.date >= startDate);
      if (endDate) transactions = transactions.filter(t => t.date <= endDate);
    }

    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(t => {
      const amt = Number(t.amount);
      if (t.type === 'income') totalIncome += amt;
      else if (t.type === 'expense') totalExpenses += amt;
    });

    const savings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;
    const totalBalance = savings;

    return {
      totalBalance,
      totalIncome,
      totalExpenses,
      savings,
      savingsRate,
      transactionCount: transactions.length,
    };
  }

  async getMonthlyTrends(userId: string, monthsCount: number = 6): Promise<any[]> {
    // Generate months array in chronological order
    const months: { label: string; yearMonth: string; income: number; expense: number; savings: number }[] = [];
    const now = new Date();

    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      months.push({ label, yearMonth, income: 0, expense: 0, savings: 0 });
    }

    const minDate = `${months[0].yearMonth}-01`;

    let transactions: any[] = [];
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('transactions')
        .select('type, amount, date')
        .eq('user_id', userId)
        .gte('date', minDate);

      if (error) throw error;
      transactions = data || [];
    } else {
      transactions = memoryStore.getTransactions(userId).filter(t => t.date >= minDate);
    }

    // Aggregate into months
    const monthMap = new Map(months.map(m => [m.yearMonth, m]));

    transactions.forEach(t => {
      const ym = t.date.substring(0, 7);
      const m = monthMap.get(ym);
      if (m) {
        const amt = Number(t.amount);
        if (t.type === 'income') m.income += amt;
        else if (t.type === 'expense') m.expense += amt;
      }
    });

    let runningCumulative = 0;
    months.forEach(m => {
      m.savings = m.income - m.expense;
      runningCumulative += m.savings;
      (m as any).cumulativeSavings = runningCumulative;
    });

    return months;
  }

  async getCategoryBreakdown(userId: string, range: string = '30d'): Promise<any[]> {
    const { startDate, endDate } = this.resolveDateRange(range);

    let transactions: any[] = [];
    let categories: any[] = [];

    if (isSupabaseConfigured && supabaseAdmin) {
      const [txResult, catResult] = await Promise.all([
        (() => {
          let q = supabaseAdmin.from('transactions').select('category_id, amount, type, date').eq('user_id', userId).eq('type', 'expense');
          if (startDate) q = q.gte('date', startDate);
          if (endDate) q = q.lte('date', endDate);
          return q;
        })(),
        supabaseAdmin.from('categories').select('*').or(`user_id.eq.${userId},user_id.is.null`),
      ]);

      if (txResult.error) throw txResult.error;
      if (catResult.error) throw catResult.error;
      transactions = txResult.data || [];
      categories = catResult.data || [];
    } else {
      transactions = memoryStore.getTransactions(userId).filter(t => t.type === 'expense');
      if (startDate) transactions = transactions.filter(t => t.date >= startDate);
      if (endDate) transactions = transactions.filter(t => t.date <= endDate);
      categories = memoryStore.getCategories(userId);
    }

    const catMap = new Map(categories.map(c => [c.id, c]));
    const totals: Record<string, number> = {};
    let totalExpense = 0;

    transactions.forEach(t => {
      const amt = Number(t.amount);
      totals[t.category_id] = (totals[t.category_id] || 0) + amt;
      totalExpense += amt;
    });

    const result = Object.entries(totals).map(([catId, amount]) => {
      const cat = catMap.get(catId);
      const percentage = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
      return {
        id: catId,
        name: cat?.name || 'Other',
        color: cat?.color || '#C9B58A',
        icon: cat?.icon || 'Tag',
        amount,
        percentage,
      };
    });

    // Sort descending by amount
    return result.sort((a, b) => b.amount - a.amount);
  }

  private resolveDateRange(range: string): { startDate?: string; endDate?: string } {
    const now = new Date();
    const endStr = now.toISOString().split('T')[0];
    let start = new Date();

    switch (range) {
      case '7d':
        start.setDate(now.getDate() - 7);
        return { startDate: start.toISOString().split('T')[0], endDate: endStr };
      case '30d':
        start.setDate(now.getDate() - 30);
        return { startDate: start.toISOString().split('T')[0], endDate: endStr };
      case '3m':
        start.setMonth(now.getMonth() - 3);
        return { startDate: start.toISOString().split('T')[0], endDate: endStr };
      case '6m':
        start.setMonth(now.getMonth() - 6);
        return { startDate: start.toISOString().split('T')[0], endDate: endStr };
      case '1y':
        start.setFullYear(now.getFullYear() - 1);
        return { startDate: start.toISOString().split('T')[0], endDate: endStr };
      case 'all':
      default:
        return {};
    }
  }
}

export const analyticsService = new AnalyticsService();
