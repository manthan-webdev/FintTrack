import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Input } from '../common/Input.js';
import { Select } from '../common/Select.js';
import { Button } from '../common/Button.js';
import { useToast } from '../../context/ToastContext.js';
import { api } from '../../services/api.js';
import { getCurrentMonthYear, getMonthName } from '../../utils/date.js';
import { useAuth } from '../../context/AuthContext.js';
import { CURRENCY_CONFIGS } from '../../utils/currency.js';

export interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  budgetToEdit?: any | null;
  currentMonth: number;
  currentYear: number;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  budgetToEdit,
  currentMonth,
  currentYear,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const currencySymbol = CURRENCY_CONFIGS[user?.currency || 'INR']?.symbol || '₹';

  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      api.getCategories()
        .then((cats) => {
          setCategories(cats.filter((c) => c.type === 'expense'));
        })
        .catch((err) => console.error('Failed to load categories:', err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (budgetToEdit) {
      setCategoryId(budgetToEdit.category_id || '');
      setAmount(String(budgetToEdit.amount || ''));
    } else {
      setCategoryId('');
      setAmount('');
    }
    setErrors({});
  }, [budgetToEdit, isOpen]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      errs.amount = 'Please enter a valid budget amount';
    }
    if (!budgetToEdit && !categoryId) {
      errs.categoryId = 'Please select a category';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (budgetToEdit) {
        await api.updateBudget(budgetToEdit.id, parseFloat(amount));
        showToast('Budget target updated successfully', 'success');
      } else {
        await api.createBudget({
          category_id: categoryId,
          amount: parseFloat(amount),
          month: currentMonth,
          year: currentYear,
        });
        showToast('Monthly budget created successfully', 'success');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to save budget', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={budgetToEdit ? 'Adjust Budget Limit' : 'Set Monthly Budget'}
      subtitle={`Budget for ${getMonthName(currentMonth)} ${currentYear}`}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!budgetToEdit && (
          <Select
            label="Expense Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            error={errors.categoryId}
            options={[
              { value: '', label: 'Select an expense category' },
              ...categories.map((c) => ({
                value: c.id,
                label: c.name,
              })),
            ]}
            required
          />
        )}

        <Input
          label="Budget Limit"
          type="number"
          step="1"
          min="1"
          placeholder="e.g. 10000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
          required
          icon={<span className="font-mono font-bold text-sm text-[#C9B58A]">{currencySymbol}</span>}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#252830]">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={loading}>
            {budgetToEdit ? 'Save Budget' : 'Create Budget'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
