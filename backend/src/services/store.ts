// In-memory persistent database store used when SUPABASE_URL & keys are not yet configured.
// Provides complete multi-tenant user isolation, realistic relations, and full CRUD.

export interface CategoryRecord {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransactionRecord {
  id: string;
  user_id: string;
  category_id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  payment_method: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Other';
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetRecord {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileRecord {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  currency: string;
  monthly_income?: number;
  average_monthly_spending?: number;
  average_monthly_savings?: number;
  preferred_payment_method?: string;
  onboarding_completed: boolean;
  preferred_language: string;
  created_at: string;
  updated_at: string;
}

// In-memory data collections indexed by userId
class MemoryStore {
  private profiles = new Map<string, ProfileRecord>();
  private categories = new Map<string, CategoryRecord[]>();
  private transactions = new Map<string, TransactionRecord[]>();
  private budgets = new Map<string, BudgetRecord[]>();

  // Ensure default categories and profile exist for user
  public ensureUserInitialized(userId: string, email: string = 'member@fintrack.io', fullName: string = 'FinTrack Member'): void {
    if (!this.profiles.has(userId)) {
      this.profiles.set(userId, {
        id: userId,
        full_name: fullName,
        avatar_url: null,
        currency: 'INR',
        monthly_income: 0,
        average_monthly_spending: 0,
        average_monthly_savings: 0,
        preferred_payment_method: 'UPI',
        onboarding_completed: false,
        preferred_language: 'en',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    if (!this.categories.has(userId)) {
      const defaultCategories: CategoryRecord[] = [
        // Expenses
        { id: `cat-${userId}-food`, user_id: userId, name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#E98282', is_default: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: `cat-${userId}-shopping`, user_id: userId, name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#D4A373', is_default: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: `cat-${userId}-transport`, user_id: userId, name: 'Transport', type: 'expense', icon: 'Car', color: '#90A4AE', is_default: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: `cat-${userId}-entertainment`, user_id: userId, name: 'Entertainment', type: 'expense', icon: 'Film', color: '#BA68C8', is_default: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: `cat-${userId}-bills`, user_id: userId, name: 'Bills & Utilities', type: 'expense', icon: 'FileText', color: '#E57373', is_default: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: `cat-${userId}-health`, user_id: userId, name: 'Health & Medical', type: 'expense', icon: 'Activity', color: '#4DB6AC', is_default: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: `cat-${userId}-education`, user_id: userId, name: 'Education', type: 'expense', icon: 'BookOpen', color: '#64B5F6', is_default: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: `cat-${userId}-travel`, user_id: userId, name: 'Travel', type: 'expense', icon: 'Plane', color: '#FFB74D', is_default: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: `cat-${userId}-subscriptions`, user_id: userId, name: 'Subscriptions', type: 'expense', icon: 'Repeat', color: '#9575CD', is_default: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: `cat-${userId}-other-exp`, user_id: userId, name: 'Other Expense', type: 'expense', icon: 'MoreHorizontal', color: '#8E929B', is_default: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        // Incomes
        { id: `cat-${userId}-salary`, user_id: userId, name: 'Salary', type: 'income', icon: 'Briefcase', color: '#7ED6A5', is_default: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: `cat-${userId}-freelance`, user_id: userId, name: 'Freelance', type: 'income', icon: 'Laptop', color: '#81C784', is_default: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: `cat-${userId}-business`, user_id: userId, name: 'Business', type: 'income', icon: 'TrendingUp', color: '#A5D6A7', is_default: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: `cat-${userId}-investment`, user_id: userId, name: 'Investment', type: 'income', icon: 'DollarSign', color: '#C9B58A', is_default: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: `cat-${userId}-other-inc`, user_id: userId, name: 'Other Income', type: 'income', icon: 'PlusCircle', color: '#8E929B', is_default: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ];
      this.categories.set(userId, defaultCategories);
    }

    // New accounts start with strictly empty financial history
    if (!this.transactions.has(userId)) {
      this.transactions.set(userId, []);
    }
    if (!this.budgets.has(userId)) {
      this.budgets.set(userId, []);
    }
  }

  // Categories
  getCategories(userId: string): CategoryRecord[] {
    this.ensureUserInitialized(userId);
    return this.categories.get(userId) || [];
  }

  createCategory(userId: string, data: Omit<CategoryRecord, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_default'>): CategoryRecord {
    this.ensureUserInitialized(userId);
    const list = this.categories.get(userId) || [];
    const exists = list.some(c => c.name.toLowerCase() === data.name.toLowerCase() && c.type === data.type);
    if (exists) {
      const err: any = new Error(`Category "${data.name}" already exists for ${data.type}`);
      err.code = '23505';
      throw err;
    }
    const newCat: CategoryRecord = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      ...data,
      is_default: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.push(newCat);
    this.categories.set(userId, list);
    return newCat;
  }

  updateCategory(userId: string, id: string, data: Partial<CategoryRecord>): CategoryRecord {
    this.ensureUserInitialized(userId);
    const list = this.categories.get(userId) || [];
    const index = list.findIndex(c => c.id === id);
    if (index === -1) {
      const err: any = new Error('Category not found');
      err.statusCode = 404;
      throw err;
    }
    const updated = {
      ...list[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    list[index] = updated;
    this.categories.set(userId, list);
    return updated;
  }

  deleteCategory(userId: string, id: string): void {
    this.ensureUserInitialized(userId);
    // Check if category is used by any transactions
    const txs = this.transactions.get(userId) || [];
    const isUsedInTx = txs.some(t => t.category_id === id);
    if (isUsedInTx) {
      const err: any = new Error('Cannot delete category because active transactions are linked to it.');
      err.code = '23503';
      throw err;
    }
    const list = this.categories.get(userId) || [];
    this.categories.set(userId, list.filter(c => c.id !== id));
    // Also remove budgets associated with this category
    const budgets = this.budgets.get(userId) || [];
    this.budgets.set(userId, budgets.filter(b => b.category_id !== id));
  }

  // Transactions
  getTransactions(userId: string): TransactionRecord[] {
    this.ensureUserInitialized(userId);
    return [...(this.transactions.get(userId) || [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  getTransactionById(userId: string, id: string): TransactionRecord | null {
    this.ensureUserInitialized(userId);
    const list = this.transactions.get(userId) || [];
    return list.find(t => t.id === id) || null;
  }

  createTransaction(userId: string, data: Omit<TransactionRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>): TransactionRecord {
    this.ensureUserInitialized(userId);
    const list = this.transactions.get(userId) || [];
    const newTx: TransactionRecord = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(newTx);
    this.transactions.set(userId, list);
    return newTx;
  }

  updateTransaction(userId: string, id: string, data: Partial<TransactionRecord>): TransactionRecord {
    this.ensureUserInitialized(userId);
    const list = this.transactions.get(userId) || [];
    const index = list.findIndex(t => t.id === id);
    if (index === -1) {
      const err: any = new Error('Transaction not found');
      err.statusCode = 404;
      throw err;
    }
    const updated = {
      ...list[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    list[index] = updated;
    this.transactions.set(userId, list);
    return updated;
  }

  deleteTransaction(userId: string, id: string): void {
    this.ensureUserInitialized(userId);
    const list = this.transactions.get(userId) || [];
    const exists = list.some(t => t.id === id);
    if (!exists) {
      const err: any = new Error('Transaction not found');
      err.statusCode = 404;
      throw err;
    }
    this.transactions.set(userId, list.filter(t => t.id !== id));
  }

  // Budgets
  getBudgets(userId: string, month?: number, year?: number): BudgetRecord[] {
    this.ensureUserInitialized(userId);
    const list = this.budgets.get(userId) || [];
    if (month && year) {
      return list.filter(b => b.month === month && b.year === year);
    }
    return list;
  }

  createBudget(userId: string, data: Omit<BudgetRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>): BudgetRecord {
    this.ensureUserInitialized(userId);
    const list = this.budgets.get(userId) || [];
    const exists = list.some(b => b.category_id === data.category_id && b.month === data.month && b.year === data.year);
    if (exists) {
      const err: any = new Error('A budget already exists for this category in the specified month.');
      err.code = '23505';
      throw err;
    }
    const newBudget: BudgetRecord = {
      id: `bg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.push(newBudget);
    this.budgets.set(userId, list);
    return newBudget;
  }

  updateBudget(userId: string, id: string, data: Partial<BudgetRecord>): BudgetRecord {
    this.ensureUserInitialized(userId);
    const list = this.budgets.get(userId) || [];
    const index = list.findIndex(b => b.id === id);
    if (index === -1) {
      const err: any = new Error('Budget not found');
      err.statusCode = 404;
      throw err;
    }
    const updated = {
      ...list[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    list[index] = updated;
    this.budgets.set(userId, list);
    return updated;
  }

  deleteBudget(userId: string, id: string): void {
    this.ensureUserInitialized(userId);
    const list = this.budgets.get(userId) || [];
    this.budgets.set(userId, list.filter(b => b.id !== id));
  }

  // Profile
  getProfile(userId: string): ProfileRecord {
    this.ensureUserInitialized(userId);
    return this.profiles.get(userId)!;
  }

  updateProfile(userId: string, data: Partial<ProfileRecord>): ProfileRecord {
    this.ensureUserInitialized(userId);
    const current = this.profiles.get(userId)!;
    const updated = {
      ...current,
      ...data,
      updated_at: new Date().toISOString(),
    };
    this.profiles.set(userId, updated);
    return updated;
  }
}

export const memoryStore = new MemoryStore();
