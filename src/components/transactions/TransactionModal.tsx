import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Input } from '../common/Input.js';
import { Select } from '../common/Select.js';
import { Button } from '../common/Button.js';
import { useToast } from '../../context/ToastContext.js';
import { useTranslation } from '../../context/LanguageContext.js';
import { api } from '../../services/api.js';
import { getTodayDateString } from '../../utils/date.js';
import { useAuth } from '../../context/AuthContext.js';
import { CURRENCY_CONFIGS } from '../../utils/currency.js';

export interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transactionToEdit?: any | null;
  defaultType?: 'expense' | 'income';
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  transactionToEdit,
  defaultType = 'expense',
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const currencySymbol = CURRENCY_CONFIGS[user?.currency || 'INR']?.symbol || '₹';

  const [type, setType] = useState<'expense' | 'income'>(defaultType);
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState<string>(
    user?.preferred_payment_method || 'UPI'
  );
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch categories when modal opens
  useEffect(() => {
    if (isOpen) {
      api.getCategories()
        .then((cats) => {
          setCategories(cats || []);
        })
        .catch((err) => {
          console.error('Failed to fetch categories:', err);
        });
    }
  }, [isOpen]);

  // Set initial form state for edit vs create
  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type || 'expense');
      setAmount(String(transactionToEdit.amount || ''));
      setCategoryId(transactionToEdit.category_id || '');
      setDescription(transactionToEdit.description || '');
      setDate(transactionToEdit.date || getTodayDateString());
      setPaymentMethod(transactionToEdit.payment_method || 'UPI');
      setNotes(transactionToEdit.notes || '');
    } else {
      setType(defaultType);
      setAmount('');
      setDescription('');
      setDate(getTodayDateString());
      setPaymentMethod(user?.preferred_payment_method || 'UPI');
      setNotes('');
    }
    setErrors({});
  }, [transactionToEdit, isOpen, defaultType, user?.preferred_payment_method]);

  // Filter categories by type
  const filteredCategories = categories.filter((c) => c.type === type);

  // Set default category if none selected
  useEffect(() => {
    if (filteredCategories.length > 0 && !categoryId) {
      setCategoryId(filteredCategories[0].id);
    }
  }, [filteredCategories, categoryId]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const parsedAmount = parseFloat(amount);

    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      errs.amount = 'Please enter a valid amount greater than 0';
    }
    if (!description.trim()) {
      errs.description = 'Please describe this payment';
    } else if (description.length > 255) {
      errs.description = 'Description must not exceed 255 characters';
    }
    if (!categoryId) {
      errs.categoryId = 'Please select a category';
    }
    if (!date) {
      errs.date = 'Date is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        type,
        amount: parseFloat(amount),
        category_id: categoryId,
        description: description.trim(),
        date,
        payment_method: paymentMethod,
        notes: notes.trim() || undefined,
      };

      if (transactionToEdit) {
        await api.updateTransaction(transactionToEdit.id, payload);
        showToast(t('common.success'), 'success');
      } else {
        await api.createTransaction(payload);
        showToast(t('common.success'), 'success');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || t('common.error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transactionToEdit ? t('transactions.editTransaction') : t('transactions.recordTransaction')}
      subtitle={transactionToEdit ? t('transactions.saveChanges') : t('transactions.descriptionLabel')}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Type Toggle: Income / Expense */}
        <div className="flex p-1 bg-[#101216] border border-[#262932] rounded-lg">
          <button
            type="button"
            onClick={() => {
              setType('expense');
              setCategoryId('');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              type === 'expense'
                ? 'bg-[#D97979]/15 text-[#D97979] border border-[#D97979]/30 shadow-xs'
                : 'text-[#9297A1] hover:text-[#F4F1EA]'
            }`}
          >
            {t('transactions.expenses')}
          </button>
          <button
            type="button"
            onClick={() => {
              setType('income');
              setCategoryId('');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              type === 'income'
                ? 'bg-[#78C99A]/15 text-[#78C99A] border border-[#78C99A]/30 shadow-xs'
                : 'text-[#9297A1] hover:text-[#F4F1EA]'
            }`}
          >
            {t('transactions.income')}
          </button>
        </div>

        {/* Amount Input */}
        <Input
          label={t('transactions.amount')}
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
          required
          icon={<span className="font-mono font-bold text-sm text-[#C9B58A]">{currencySymbol}</span>}
          autoFocus
        />

        {/* Description: "What was this payment for?" */}
        <Input
          label={t('transactions.descriptionLabel')}
          placeholder={t('transactions.descriptionPlaceholder')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
          required
        />

        {/* Category & Payment Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label={t('transactions.category')}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            error={errors.categoryId}
            options={filteredCategories.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
            required
          />

          <Select
            label={t('transactions.method')}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={[
              { value: 'UPI', label: 'UPI' },
              { value: 'Cash', label: 'Cash' },
              { value: 'Card', label: 'Card' },
              { value: 'Bank Transfer', label: 'Bank Transfer' },
              { value: 'Other', label: 'Other' },
            ]}
            required
          />
        </div>

        {/* Date */}
        <Input
          label={t('transactions.date')}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          error={errors.date}
          required
        />

        {/* Notes (Optional) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#9297A1]">
            {t('transactions.notesLabel')}
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('transactions.notesPlaceholder')}
            className="w-full bg-[#101216] border border-[#262932] focus:border-[#C9B58A]/60 rounded-lg px-3 py-2 text-sm text-[#F4F1EA] placeholder-[#9297A1]/50 transition-colors focus:outline-none focus:ring-1 focus:ring-[#C9B58A]/30 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#262932]">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={loading}>
            {transactionToEdit ? t('transactions.saveChanges') : t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
