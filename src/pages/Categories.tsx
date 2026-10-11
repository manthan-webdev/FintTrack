import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Edit2, Trash2, Tag, Shield } from 'lucide-react';
import { Button } from '../components/common/Button.js';
import { CategoryModal } from '../components/categories/CategoryModal.js';
import { ConfirmDialog } from '../components/common/ConfirmDialog.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton.js';
import { ErrorState } from '../components/common/ErrorState.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';

export const Categories: React.FC = () => {
  const { showToast } = useToast();
  const context = useOutletContext<{ refreshTrigger: number; triggerRefresh: () => void }>();

  const [categories, setCategories] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<any | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCategories();
      setCategories(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories, context?.refreshTrigger]);

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  const handleOpenAdd = () => {
    setCategoryToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (cat: any) => {
    setCategoryToEdit(cat);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    setDeleteLoading(true);
    try {
      await api.deleteCategory(categoryToDelete.id);
      showToast(`Category "${categoryToDelete.name}" deleted successfully`, 'success');
      setCategoryToDelete(null);
      loadCategories();
      context?.triggerRefresh?.();
    } catch (err: any) {
      showToast(
        err?.message || 'Cannot delete category because active transactions or budgets are linked to it.',
        'error'
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F4F1EA]">
            Category Management
          </h1>
          <p className="text-xs sm:text-sm text-[#8E929B] mt-1">
            Organize transactions and budgets with custom expense and income labels
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenAdd}
          icon={<Plus className="w-4 h-4" />}
        >
          New Category
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-[#252830] pb-3">
        <div className="flex p-1 bg-[#101216] border border-[#252830] rounded-lg">
          <button
            onClick={() => setActiveTab('expense')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'expense'
                ? 'bg-[#E98282]/15 text-[#E98282] border border-[#E98282]/30 shadow-xs'
                : 'text-[#8E929B] hover:text-[#F4F1EA]'
            }`}
          >
            Expense Categories ({categories.filter((c) => c.type === 'expense').length})
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'income'
                ? 'bg-[#7ED6A5]/15 text-[#7ED6A5] border border-[#7ED6A5]/30 shadow-xs'
                : 'text-[#8E929B] hover:text-[#F4F1EA]'
            }`}
          >
            Income Categories ({categories.filter((c) => c.type === 'income').length})
          </button>
        </div>

        <span className="hidden sm:inline text-xs text-[#8E929B]">
          {filteredCategories.length} Categories Defined
        </span>
      </div>

      {/* Category Grid */}
      {error ? (
        <ErrorState message={error} onRetry={loadCategories} />
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <LoadingSkeleton className="h-28" rows={4} />
        </div>
      ) : filteredCategories.length === 0 ? (
        <EmptyState
          title={`No ${activeTab} categories found`}
          description="Create customized categories to classify your financial activity."
          actionText="Create Category"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="p-4 rounded-xl bg-[#15171C] border border-[#252830] hover:border-[#363A45] transition-all flex flex-col justify-between group"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    style={{ backgroundColor: `${cat.color}20`, borderColor: `${cat.color}40` }}
                    className="w-8 h-8 rounded-lg border flex items-center justify-center text-sm"
                  >
                    <Tag style={{ color: cat.color }} className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#F4F1EA]">{cat.name}</h3>
                    <span className="text-[10px] text-[#8E929B] uppercase font-mono tracking-wider">
                      {cat.type}
                    </span>
                  </div>
                </div>

                {cat.is_default && (
                  <span
                    title="System default category"
                    className="p-1 rounded bg-[#101216] border border-[#252830] text-[#8E929B]"
                  >
                    <Shield className="w-3 h-3 text-[#C9B58A]" />
                  </span>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-[#252830]/60 text-xs">
                <div className="flex items-center gap-1.5">
                  <span
                    style={{ backgroundColor: cat.color }}
                    className="w-2.5 h-2.5 rounded-full inline-block"
                  />
                  <span className="font-mono text-[#8E929B] text-[11px]">{cat.color}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(cat)}
                    className="p-1.5 rounded-md text-[#8E929B] hover:text-[#C9B58A] hover:bg-[#101216] transition-colors"
                    title="Edit Category"
                    aria-label="Edit Category"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCategoryToDelete(cat)}
                    className="p-1.5 rounded-md text-[#8E929B] hover:text-[#E98282] hover:bg-[#101216] transition-colors"
                    title="Delete Category"
                    aria-label="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          loadCategories();
          context?.triggerRefresh?.();
        }}
        categoryToEdit={categoryToEdit}
      />

      {/* Confirm Deletion Dialog */}
      <ConfirmDialog
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete "${categoryToDelete?.name}"? Deletion will be rejected if active transactions are associated with this category.`}
        confirmText="Delete Category"
        loading={deleteLoading}
      />
    </div>
  );
};
