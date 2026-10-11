import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Download, Edit2, Trash2, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Button } from '../components/common/Button.js';
import { TransactionFilters, FilterState } from '../components/transactions/TransactionFilters.js';
import { TransactionCard } from '../components/transactions/TransactionCard.js';
import { TransactionModal } from '../components/transactions/TransactionModal.js';
import { ConfirmDialog } from '../components/common/ConfirmDialog.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton.js';
import { ErrorState } from '../components/common/ErrorState.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';
import { formatCurrency } from '../utils/currency.js';
import { formatDate } from '../utils/date.js';

export const Transactions: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const context = useOutletContext<{ refreshTrigger: number; triggerRefresh: () => void }>();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: '',
    category_id: '',
    payment_method: '',
    sort: 'date_desc',
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [txToDelete, setTxToDelete] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  const currency = user?.currency || 'INR';

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [txResult, catResult] = await Promise.all([
        api.getTransactions({
          search: filters.search || undefined,
          type: filters.type || undefined,
          category_id: filters.category_id || undefined,
          payment_method: filters.payment_method || undefined,
          sort: filters.sort || undefined,
        }),
        api.getCategories(),
      ]);

      setTransactions(txResult || []);
      setTotalCount(txResult?.length || 0);
      setCategories(catResult || []);
    } catch (err: any) {
      console.error('Failed to load transactions:', err);
      setError(err?.message || 'Could not retrieve transactions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData, context?.refreshTrigger]);

  const handleExport = async () => {
    try {
      showToast('Generating CSV report...', 'info');
      await api.exportTransactionsCSV();
      showToast('Ledger exported successfully!', 'success');
    } catch {
      showToast('Export failed. Please try again.', 'error');
    }
  };

  const handleOpenAdd = () => {
    setSelectedTx(null);
    setIsModalOpen(true);
  };

  const handleEdit = (tx: any) => {
    setSelectedTx(tx);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!txToDelete) return;
    setDeleteLoading(true);
    try {
      await api.deleteTransaction(txToDelete.id);
      showToast('Transaction deleted', 'success');
      setTxToDelete(null);
      loadData();
      context?.triggerRefresh?.();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete transaction', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F4F1EA]">
            Financial Transactions
          </h1>
          <p className="text-xs sm:text-sm text-[#8E929B] mt-1">
            Complete transaction ledger with search, category filtering, and export
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <TransactionFilters
        filters={filters}
        onChange={setFilters}
        categories={categories}
      />

      {/* Transactions List / Table */}
      {error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : loading ? (
        <LoadingSkeleton className="h-16" rows={5} />
      ) : transactions.length === 0 ? (
        <EmptyState
          title="No transactions found"
          description={
            filters.search || filters.type || filters.category_id || filters.payment_method
              ? 'No transactions match your current search and filter criteria.'
              : 'You haven’t recorded any transactions yet. Start tracking your income and expenses today.'
          }
          actionText="Log Transaction"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block rounded-xl border border-[#252830] bg-[#15171C] overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#101216] border-b border-[#252830] text-xs font-semibold text-[#8E929B]">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252830]/60">
                {transactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const cat = tx.category || { name: 'General', color: '#C9B58A' };
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-[#1A1D24] transition-colors group text-xs sm:text-sm"
                    >
                      <td className="py-3 px-4 text-[#8E929B] font-mono whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#F4F1EA]">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                              isIncome
                                ? 'bg-[#7ED6A5]/10 text-[#7ED6A5]'
                                : 'bg-[#E98282]/10 text-[#E98282]'
                            }`}
                          >
                            {isIncome ? (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <span className="truncate block font-semibold">{tx.description}</span>
                            {tx.notes && (
                              <span className="text-[11px] text-[#8E929B] block truncate max-w-xs">
                                {tx.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            style={{ backgroundColor: cat.color }}
                            className="w-2 h-2 rounded-full shrink-0"
                          />
                          <span className="text-[#F4F1EA] font-medium">{cat.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#8E929B] whitespace-nowrap font-mono text-xs">
                        {tx.payment_method}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums whitespace-nowrap">
                        <span className={isIncome ? 'text-[#7ED6A5]' : 'text-[#F4F1EA]'}>
                          {isIncome ? '+' : '-'}
                          {formatCurrency(tx.amount, currency, false)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(tx)}
                            className="p-1 rounded-md text-[#8E929B] hover:text-[#C9B58A] hover:bg-[#101216] transition-colors"
                            title="Edit"
                            aria-label="Edit transaction"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setTxToDelete(tx)}
                            className="p-1 rounded-md text-[#8E929B] hover:text-[#E98282] hover:bg-[#101216] transition-colors"
                            title="Delete"
                            aria-label="Delete transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (< 768px) */}
          <div className="flex md:hidden flex-col gap-2.5">
            {transactions.map((tx) => (
              <TransactionCard
                key={tx.id}
                transaction={tx}
                currency={currency}
                onEdit={handleEdit}
                onDelete={(t) => setTxToDelete(t)}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-[#8E929B] px-1 pt-2">
            <span>Showing {transactions.length} entries</span>
            <span>Ledger fully synchronized</span>
          </div>
        </div>
      )}

      {/* Transaction Modal (Add/Edit) */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          loadData();
          context?.triggerRefresh?.();
        }}
        transactionToEdit={selectedTx}
      />

      {/* Confirm Deletion Dialog */}
      <ConfirmDialog
        isOpen={Boolean(txToDelete)}
        onClose={() => setTxToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Transaction"
        message={`Are you sure you want to permanently delete "${txToDelete?.description}"?`}
        confirmText="Delete Entry"
        loading={deleteLoading}
      />
    </div>
  );
};
