import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Download, Plus, BarChart3 } from 'lucide-react';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton.js';
import { ErrorState } from '../components/common/ErrorState.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from '../context/LanguageContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';
import { formatCurrency } from '../utils/currency.js';

export const Analytics: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [range, setRange] = useState<string>('30d');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<any>({
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    savings: 0,
    savingsRate: 0,
    transactionCount: 0,
  });

  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  const currency = user?.currency || 'INR';

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const monthsCount =
        range === '1y' ? 12 : range === '6m' ? 6 : range === '3m' ? 3 : 6;
      const [sum, monthly, categories] = await Promise.all([
        api.getAnalyticsSummary(range),
        api.getAnalyticsMonthly(monthsCount),
        api.getAnalyticsCategories(range),
      ]);

      setSummary(sum || {
        totalBalance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        savings: 0,
        savingsRate: 0,
        transactionCount: 0,
      });
      setMonthlyData(monthly || []);
      setCategoryData(categories || []);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
      setError(err?.message || 'Failed to aggregate analytics data');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleExportCSV = async () => {
    try {
      showToast('Exporting analytics data...', 'info');
      await api.exportTransactionsCSV();
      showToast(t('common.success'), 'success');
    } catch {
      showToast(t('common.error'), 'error');
    }
  };

  const rangeOptions = [
    { label: t('analytics.range7d'), val: '7d' },
    { label: t('analytics.range30d'), val: '30d' },
    { label: t('analytics.range3m'), val: '3m' },
    { label: t('analytics.range6m'), val: '6m' },
    { label: t('analytics.range1y'), val: '1y' },
  ];

  const hasTransactions = summary.transactionCount > 0;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Top Header & Range Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F4F1EA]">
            {t('analytics.title')}
          </h1>
          <p className="text-xs sm:text-sm text-[#9297A1] mt-1">
            {t('analytics.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Timeframe Filter Buttons */}
          <div className="flex p-1 bg-[#111318] border border-[#262932] rounded-lg">
            {rangeOptions.map((opt) => (
              <button
                key={opt.val}
                onClick={() => setRange(opt.val)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  range === opt.val
                    ? 'bg-[#17191F] text-[#C9B58A] border border-[#C9B58A]/30 shadow-xs'
                    : 'text-[#9297A1] hover:text-[#F4F1EA]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            {t('analytics.export')}
          </Button>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadAnalytics} />
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LoadingSkeleton className="h-64" rows={2} />
          <LoadingSkeleton className="h-64" rows={2} />
        </div>
      ) : !hasTransactions ? (
        /* Empty Analytics State */
        <EmptyState
          icon={<BarChart3 className="w-6 h-6" />}
          title={t('analytics.noDataTitle')}
          description={t('analytics.noDataDesc')}
          actionText={t('dashboard.addIncome')}
          onAction={() => (window.location.href = '/dashboard')}
        />
      ) : (
        <>
          {/* Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-xl bg-[#17191F] border border-[#262932]">
            <div>
              <span className="text-xs text-[#9297A1] block">{t('dashboard.totalIncome')}</span>
              <span className="text-lg sm:text-xl font-bold font-mono text-[#78C99A] tabular-nums mt-0.5 block">
                {formatCurrency(summary.totalIncome, currency)}
              </span>
            </div>
            <div>
              <span className="text-xs text-[#9297A1] block">{t('dashboard.totalExpenses')}</span>
              <span className="text-lg sm:text-xl font-bold font-mono text-[#D97979] tabular-nums mt-0.5 block">
                {formatCurrency(summary.totalExpenses, currency)}
              </span>
            </div>
            <div>
              <span className="text-xs text-[#9297A1] block">{t('dashboard.netSavings')}</span>
              <span className="text-lg sm:text-xl font-bold font-mono text-[#F4F1EA] tabular-nums mt-0.5 block">
                {formatCurrency(summary.savings, currency)}
              </span>
            </div>
            <div>
              <span className="text-xs text-[#9297A1] block">{t('analytics.savingsRatio')}</span>
              <span className="text-lg sm:text-xl font-bold font-mono text-[#C9B58A] tabular-nums mt-0.5 block">
                {summary.savingsRate}%
              </span>
            </div>
          </div>

          {/* Grid of Analytical Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Inflow vs Outflow */}
            <Card className="p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-[#F4F1EA] mb-1">
                {t('analytics.inflowOutflow')}
              </h3>
              <p className="text-xs text-[#9297A1] mb-4">Monthly cash inflow vs expenses</p>
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} barGap={4}>
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
                      tickFormatter={(v) => `${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#17191F',
                        borderColor: '#262932',
                        borderRadius: '8px',
                        color: '#F4F1EA',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [formatCurrency(Number(val), currency), '']}
                    />
                    <Bar dataKey="income" fill="#78C99A" radius={[3, 3, 0, 0]} name="Income" />
                    <Bar dataKey="expense" fill="#D97979" radius={[3, 3, 0, 0]} name="Expense" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Net Savings Curve */}
            <Card className="p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-[#F4F1EA] mb-1">
                {t('analytics.netSavingsCurve')}
              </h3>
              <p className="text-xs text-[#9297A1] mb-4">Net retained surplus over time</p>
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
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
                      tickFormatter={(v) => `${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#17191F',
                        borderColor: '#262932',
                        borderRadius: '8px',
                        color: '#F4F1EA',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [formatCurrency(Number(val), currency), 'Savings']}
                    />
                    <Line
                      type="monotone"
                      dataKey="savings"
                      stroke="#C9B58A"
                      strokeWidth={2}
                      dot={{ fill: '#C9B58A', r: 3 }}
                      name="Savings"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Category Allocation Donut Chart */}
            <Card className="p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-[#F4F1EA] mb-1">
                {t('analytics.expenseAllocation')}
              </h3>
              <p className="text-xs text-[#9297A1] mb-4">Distribution by expense category</p>
              <div className="h-64 w-full flex items-center justify-center">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={categoryData}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={2}
                      >
                        {categoryData.map((entry, index) => (
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
                        formatter={(val: any) => [formatCurrency(Number(val), currency), '']}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-[#9297A1]">{t('analytics.noDataTitle')}</div>
                )}
              </div>
            </Card>

            {/* Top Spending Categories List */}
            <Card className="p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-[#F4F1EA] mb-1">
                {t('analytics.topSpending')}
              </h3>
              <p className="text-xs text-[#9297A1] mb-4">Largest expense categories ranked</p>
              <div className="flex flex-col gap-3.5 py-2">
                {categoryData.slice(0, 5).map((cat, idx) => (
                  <div key={cat.id} className="flex flex-col gap-1 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#9297A1] text-[11px] w-4">
                          {idx + 1}.
                        </span>
                        <span
                          style={{ backgroundColor: cat.color }}
                          className="w-2.5 h-2.5 rounded-full inline-block"
                        />
                        <span className="font-semibold text-[#F4F1EA]">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-[#F4F1EA] tabular-nums">
                          {formatCurrency(cat.amount, currency)}
                        </span>
                        <span className="text-[#9297A1] font-mono w-10 text-right">
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#111318] overflow-hidden">
                      <div
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.color || '#C9B58A',
                        }}
                        className="h-full rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
