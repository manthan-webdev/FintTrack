import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Plus,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton.js';
import { ErrorState } from '../components/common/ErrorState.js';
import { TransactionCard } from '../components/transactions/TransactionCard.js';
import { TransactionModal } from '../components/transactions/TransactionModal.js';
import { ConfirmDialog } from '../components/common/ConfirmDialog.js';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from '../context/LanguageContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';
import { formatCurrency } from '../utils/currency.js';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const context = useOutletContext<{ refreshTrigger: number; triggerRefresh: () => void }>();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<{
    totalBalance: number;
    totalIncome: number;
    totalExpenses: number;
    savings: number;
    savingsRate: number;
    transactionCount: number;
  }>({
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    savings: 0,
    savingsRate: 0,
    transactionCount: 0,
  });

  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [modalTxType, setModalTxType] = useState<'expense' | 'income'>('expense');
  const [txToEdit, setTxToEdit] = useState<any | null>(null);
  const [txToDelete, setTxToDelete] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const currency = user?.currency || 'INR';

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sum, trends, categories, txResult] = await Promise.all([
        api.getAnalyticsSummary('30d'),
        api.getAnalyticsMonthly(6),
        api.getAnalyticsCategories('30d'),
        api.getTransactions({ limit: 5 }),
      ]);

      setSummary(sum || {
        totalBalance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        savings: 0,
        savingsRate: 0,
        transactionCount: 0,
      });
      setMonthlyTrends(trends || []);
      setCategoryBreakdown(categories || []);
      setRecentTransactions(txResult || []);
    } catch (err: any) {
      console.error('Dashboard load error:', err);
      setError(err?.message || 'Failed to load dashboard financial data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData, context?.refreshTrigger]);

  const handleOpenAdd = (type: 'expense' | 'income') => {
    setModalTxType(type);
    setTxToEdit(null);
    setIsTxModalOpen(true);
  };

  const handleEdit = (tx: any) => {
    setTxToEdit(tx);
    setIsTxModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!txToDelete) return;
    setDeleteLoading(true);
    try {
      await api.deleteTransaction(txToDelete.id);
      showToast(t('common.success'), 'success');
      setTxToDelete(null);
      loadDashboardData();
      context?.triggerRefresh?.();
    } catch (err: any) {
      showToast(err?.message || t('common.error'), 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greetingMorning');
    if (hour < 18) return t('dashboard.greetingAfternoon');
    return t('dashboard.greetingEvening');
  };

  const hasTransactions = summary.transactionCount > 0 || recentTransactions.length > 0;

  return (
    <div className="flex flex-col gap-6 sm:gap-8 max-w-6xl mx-auto">
      {/* 1. Header Greeting & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F4F1EA]">
            {getGreeting()}, {user?.full_name?.split(' ')[0] || 'Member'}
          </h1>
          <p className="text-xs sm:text-sm text-[#9297A1] mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenAdd('income')}
            icon={<ArrowDownLeft className="w-3.5 h-3.5 text-[#78C99A]" />}
          >
            {t('dashboard.addIncome')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenAdd('expense')}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            {t('dashboard.addExpense')}
          </Button>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadDashboardData} />
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <LoadingSkeleton className="h-28" rows={1} />
          <LoadingSkeleton className="h-28" rows={1} />
          <LoadingSkeleton className="h-28" rows={1} />
          <LoadingSkeleton className="h-28" rows={1} />
        </div>
      ) : (
        <>
          {/* 2. Four Key Financial Metrics (Calculated strictly from real user data) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Balance */}
            <Card className="p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#9297A1] text-xs mb-3">
                <span className="font-medium uppercase tracking-wider">{t('dashboard.totalBalance')}</span>
                <Wallet className="w-4 h-4 text-[#C9B58A]" />
              </div>
              <div className="font-mono text-2xl font-bold text-[#F4F1EA] tabular-nums">
                {formatCurrency(summary.totalBalance, currency)}
              </div>
              <div className="text-[11px] text-[#9297A1] mt-2">
                {t('dashboard.netLiquid')}
              </div>
            </Card>

            {/* Income */}
            <Card className="p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#9297A1] text-xs mb-3">
                <span className="font-medium uppercase tracking-wider">{t('dashboard.totalIncome')}</span>
                <ArrowDownLeft className="w-4 h-4 text-[#78C99A]" />
              </div>
              <div className="font-mono text-2xl font-bold text-[#78C99A] tabular-nums">
                {formatCurrency(summary.totalIncome, currency)}
              </div>
              <div className="text-[11px] text-[#9297A1] mt-2">
                {t('dashboard.past30Days')}
              </div>
            </Card>

            {/* Expenses */}
            <Card className="p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#9297A1] text-xs mb-3">
                <span className="font-medium uppercase tracking-wider">{t('dashboard.totalExpenses')}</span>
                <ArrowUpRight className="w-4 h-4 text-[#D97979]" />
              </div>
              <div className="font-mono text-2xl font-bold text-[#D97979] tabular-nums">
                {formatCurrency(summary.totalExpenses, currency)}
              </div>
              <div className="text-[11px] text-[#9297A1] mt-2">
                {t('dashboard.past30Days')}
              </div>
            </Card>

            {/* Savings */}
            <Card className="p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#9297A1] text-xs mb-3">
                <span className="font-medium uppercase tracking-wider">{t('dashboard.netSavings')}</span>
                <PiggyBank className="w-4 h-4 text-[#C9B58A]" />
              </div>
              <div
                className={`font-mono text-2xl font-bold tabular-nums ${
                  summary.savings >= 0 ? 'text-[#F4F1EA]' : 'text-[#D97979]'
                }`}
              >
                {formatCurrency(summary.savings, currency)}
              </div>
              <div className="text-[11px] text-[#9297A1] mt-2">
                {summary.totalIncome > 0
                  ? `${summary.savingsRate}% ${t('dashboard.savingsRate')}`
                  : summary.savings >= 0 ? t('dashboard.surplus') : t('dashboard.deficit')}
              </div>
            </Card>
          </div>

          {/* 3. Main Dashboard Body: Either Real Charts OR Clean Empty State */}
          {!hasTransactions ? (
            /* CLEAN USER-DRIVEN EMPTY STATE */
            <Card className="py-12 px-6 sm:px-10 text-center flex flex-col items-center justify-center border-dashed border-[#262932]">
              <div className="w-12 h-12 rounded-2xl bg-[#17191F] border border-[#262932] flex items-center justify-center text-[#C9B58A] mb-4">
                <Wallet className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-[#F4F1EA] mb-2">
                {t('dashboard.emptyTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-[#9297A1] max-w-md leading-relaxed mb-6">
                {t('dashboard.emptyDesc')}
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleOpenAdd('income')}
                  icon={<Plus className="w-4 h-4" />}
                >
                  {t('dashboard.addIncome')}
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => handleOpenAdd('expense')}
                  icon={<Plus className="w-4 h-4" />}
                >
                  {t('dashboard.addExpense')}
                </Button>
              </div>
            </Card>
          ) : (
            /* REAL DATA CHARTS & ACTIVITY */
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Real Cash Flow Trend Bar Chart */}
                <Card className="lg:col-span-2 p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[#F4F1EA]">
                        {t('dashboard.incomeVsExpenses')}
                      </h3>
                      <p className="text-xs text-[#9297A1] mt-0.5">{t('dashboard.cashFlowTrend')}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#9297A1]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#78C99A]" />
                        <span>{t('transactions.income')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#D97979]" />
                        <span>{t('transactions.expenses')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-60 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyTrends} barGap={4}>
                        <XAxis
                          dataKey="label"
                          stroke="#9297A1"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#262932' }}
                        />
                        <YAxis
                          stroke="#9297A1"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#262932' }}
                          tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#17191F',
                            borderColor: '#262932',
                            borderRadius: '8px',
                            color: '#F4F1EA',
                            fontSize: '12px',
                          }}
                          formatter={(value: any) => [formatCurrency(Number(value), currency), '']}
                        />
                        <Bar dataKey="income" fill="#78C99A" radius={[3, 3, 0, 0]} name="Income" />
                        <Bar dataKey="expense" fill="#D97979" radius={[3, 3, 0, 0]} name="Expenses" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Real Category Distribution */}
                <Card className="lg:col-span-1 p-5 sm:p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[#F4F1EA]">
                      {t('dashboard.spendingByCategory')}
                    </h3>
                    <p className="text-xs text-[#9297A1] mt-0.5">{t('dashboard.past30Days')}</p>
                  </div>

                  <div className="h-44 w-full my-2">
                    {categoryBreakdown.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={categoryBreakdown}
                            dataKey="amount"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={68}
                            paddingAngle={2}
                          >
                            {categoryBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || '#C9B58A'} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#17191F',
                              borderColor: '#262932',
                              borderRadius: '8px',
                              color: '#F4F1EA',
                              fontSize: '12px',
                            }}
                            formatter={(value: any) => [formatCurrency(Number(value), currency), '']}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-[#9297A1]">
                        {t('dashboard.noActivityTitle')}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {categoryBreakdown.slice(0, 3).map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span
                            style={{ backgroundColor: cat.color }}
                            className="w-2 h-2 rounded-full shrink-0"
                          />
                          <span className="text-[#9297A1] truncate">{cat.name}</span>
                        </div>
                        <span className="font-mono tabular-nums text-[#F4F1EA] font-medium ml-2">
                          {cat.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* 4. Recent Transactions */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-[#F4F1EA]">
                    {t('dashboard.recentTransactions')}
                  </h3>
                  <Link
                    to="/transactions"
                    className="text-xs text-[#C9B58A] hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>{t('dashboard.viewAllLedger')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="flex flex-col gap-2.5">
                  {recentTransactions.map((tx) => (
                    <TransactionCard
                      key={tx.id}
                      transaction={tx}
                      currency={currency}
                      onEdit={handleEdit}
                      onDelete={(t) => setTxToDelete(t)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Transaction Modal (Add/Edit) */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSuccess={() => {
          loadDashboardData();
          context?.triggerRefresh?.();
        }}
        defaultType={modalTxType}
        transactionToEdit={txToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(txToDelete)}
        onClose={() => setTxToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title={t('transactions.deleteConfirmTitle')}
        message={t('transactions.deleteConfirmMessage')}
        confirmText={t('transactions.deleteBtn')}
        loading={deleteLoading}
      />
    </div>
  );
};
