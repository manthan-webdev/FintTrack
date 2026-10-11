import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Edit2, Trash2, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/common/Button.js';
import { BudgetModal } from '../components/budgets/BudgetModal.js';
import { ConfirmDialog } from '../components/common/ConfirmDialog.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton.js';
import { ErrorState } from '../components/common/ErrorState.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';
import { formatCurrency } from '../utils/currency.js';
import { getMonthName } from '../utils/date.js';

export const Budgets: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const context = useOutletContext<{ refreshTrigger: number; triggerRefresh: () => void }>();

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());

  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<any | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const currency = user?.currency || 'INR';

  const loadBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getBudgets(currentMonth, currentYear);
      setBudgets(data || []);
    } catch (err: any) {
      console.error('Failed to load budgets:', err);
      setError(err?.message || 'Could not retrieve monthly budgets');
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets, context?.refreshTrigger]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleOpenAdd = () => {
    setBudgetToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (b: any) => {
    setBudgetToEdit(b);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!budgetToDelete) return;
    setDeleteLoading(true);
    try {
      await api.deleteBudget(budgetToDelete.id);
      showToast('Budget limit removed', 'success');
      setBudgetToDelete(null);
      loadBudgets();
      context?.triggerRefresh?.();
    } catch (err: any) {
      showToast(err?.message || 'Failed to remove budget', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Aggregates
  const totalBudgeted = budgets.reduce((acc, b) => acc + Number(b.amount || 0), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + Number(b.spent || 0), 0);
  const totalRemaining = Math.max(0, totalBudgeted - totalSpent);
  const overallPercentage = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F4F1EA]">
            Monthly Budgets
          </h1>
          <p className="text-xs sm:text-sm text-[#8E929B] mt-1">
            Establish spending caps per expense category and prevent budget overruns
          </p>
        </div>

        {/* Month Selector & Add Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#15171C] border border-[#252830] rounded-lg p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded text-[#8E929B] hover:text-[#F4F1EA] hover:bg-[#252830] transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-semibold text-[#F4F1EA] min-w-[110px] text-center">
              {getMonthName(currentMonth)} {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded text-[#8E929B] hover:text-[#F4F1EA] hover:bg-[#252830] transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            icon={<Plus className="w-4 h-4" />}
          >
            Set Budget
          </Button>
        </div>
      </div>

      {/* Aggregate Overview Card */}
      {budgets.length > 0 && (
        <div className="p-5 rounded-xl bg-[#15171C] border border-[#252830] grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-xs text-[#8E929B] block">Total Budget Cap</span>
            <span className="text-xl font-bold font-mono text-[#F4F1EA] tabular-nums mt-0.5 block">
              {formatCurrency(totalBudgeted, currency)}
            </span>
          </div>
          <div>
            <span className="text-xs text-[#8E929B] block">Total Spent</span>
            <span className="text-xl font-bold font-mono text-[#E98282] tabular-nums mt-0.5 block">
              {formatCurrency(totalSpent, currency)}
            </span>
          </div>
          <div>
            <span className="text-xs text-[#8E929B] block">Total Remaining</span>
            <span
              className={`text-xl font-bold font-mono tabular-nums mt-0.5 block ${
                totalRemaining > 0 ? 'text-[#7ED6A5]' : 'text-[#E98282]'
              }`}
            >
              {formatCurrency(totalRemaining, currency)}
            </span>
          </div>
        </div>
      )}

      {/* Budgets List */}
      {error ? (
        <ErrorState message={error} onRetry={loadBudgets} />
      ) : loading ? (
        <LoadingSkeleton className="h-28" rows={4} />
      ) : budgets.length === 0 ? (
        <EmptyState
          title={`No budgets set for ${getMonthName(currentMonth)} ${currentYear}`}
          description="Establish category spending limits to keep your expenses under control."
          actionText="Create Budget Target"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const cat = b.category || { name: 'Expense', color: '#C9B58A' };
            const isExceeded = b.is_exceeded;
            const isWarning = b.is_warning;

            return (
              <div
                key={b.id}
                className={`p-5 rounded-xl bg-[#15171C] border transition-all flex flex-col justify-between ${
                  isExceeded
                    ? 'border-[#E98282]/50'
                    : isWarning
                    ? 'border-[#D4A373]/50'
                    : 'border-[#252830] hover:border-[#363A45]'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        style={{ backgroundColor: cat.color }}
                        className="w-3 h-3 rounded-full shrink-0"
                      />
                      <h3 className="text-sm font-semibold text-[#F4F1EA]">{cat.name}</h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isExceeded && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#E98282]">
                          <AlertTriangle className="w-3 h-3" />
                          Exceeded
                        </span>
                      )}
                      {isWarning && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D4A373]">
                          <AlertTriangle className="w-3 h-3" />
                          Approaching limit
                        </span>
                      )}
                      {!isExceeded && !isWarning && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#7ED6A5]">
                          <CheckCircle className="w-3 h-3" />
                          On Track
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#252830]/60 my-2 text-xs">
                    <div>
                      <span className="text-[#8E929B] block text-[10px] uppercase">Budget</span>
                      <span className="font-mono tabular-nums font-semibold text-[#F4F1EA]">
                        {formatCurrency(b.amount, currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#8E929B] block text-[10px] uppercase">Spent</span>
                      <span
                        className={`font-mono tabular-nums font-semibold ${
                          isExceeded ? 'text-[#E98282]' : 'text-[#F4F1EA]'
                        }`}
                      >
                        {formatCurrency(b.spent, currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#8E929B] block text-[10px] uppercase">Remaining</span>
                      <span
                        className={`font-mono tabular-nums font-semibold ${
                          b.remaining > 0 ? 'text-[#7ED6A5]' : 'text-[#E98282]'
                        }`}
                      >
                        {formatCurrency(b.remaining, currency)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[#8E929B]">Progress</span>
                      <span className="font-mono tabular-nums font-semibold text-[#F4F1EA]">
                        {b.percentage}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#101216] overflow-hidden border border-[#252830]">
                      <div
                        style={{ width: `${Math.min(100, b.percentage)}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          isExceeded
                            ? 'bg-[#E98282]'
                            : isWarning
                            ? 'bg-[#D4A373]'
                            : 'bg-[#7ED6A5]'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-[#252830]/40">
                  <button
                    onClick={() => handleEdit(b)}
                    className="p-1 rounded-md text-[#8E929B] hover:text-[#C9B58A] hover:bg-[#101216] transition-colors"
                    title="Edit Budget"
                    aria-label="Edit Budget"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setBudgetToDelete(b)}
                    className="p-1 rounded-md text-[#8E929B] hover:text-[#E98282] hover:bg-[#101216] transition-colors"
                    title="Delete Budget"
                    aria-label="Delete Budget"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          loadBudgets();
          context?.triggerRefresh?.();
        }}
        budgetToEdit={budgetToEdit}
        currentMonth={currentMonth}
        currentYear={currentYear}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={Boolean(budgetToDelete)}
        onClose={() => setBudgetToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove Budget Target"
        message={`Remove monthly budget limit for "${budgetToDelete?.category?.name}"?`}
        confirmText="Remove Budget"
        loading={deleteLoading}
      />
    </div>
  );
};
