import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Input } from '../common/Input.js';
import { Button } from '../common/Button.js';
import { useToast } from '../../context/ToastContext.js';
import { api } from '../../services/api.js';

export interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoryToEdit?: any | null;
}

const PRESET_COLORS = [
  '#E98282', // negative red
  '#7ED6A5', // positive green
  '#C9B58A', // accent gold
  '#D4A373', // warm amber
  '#90A4AE', // slate blue
  '#BA68C8', // purple
  '#4DB6AC', // teal
  '#64B5F6', // sky
  '#FFB74D', // orange
  '#9575CD', // deep violet
  '#8E929B', // muted secondary
];

const PRESET_ICONS = [
  'Utensils',
  'ShoppingBag',
  'Car',
  'Film',
  'FileText',
  'Activity',
  'BookOpen',
  'Plane',
  'Repeat',
  'Briefcase',
  'Laptop',
  'TrendingUp',
  'DollarSign',
  'Tag',
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  categoryToEdit,
}) => {
  const { showToast } = useToast();
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [color, setColor] = useState<string>('#C9B58A');
  const [icon, setIcon] = useState<string>('Tag');
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name || '');
      setType(categoryToEdit.type || 'expense');
      setColor(categoryToEdit.color || '#C9B58A');
      setIcon(categoryToEdit.icon || 'Tag');
    } else {
      setName('');
      setType('expense');
      setColor('#C9B58A');
      setIcon('Tag');
    }
    setErrors({});
  }, [categoryToEdit, isOpen]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = 'Category name is required';
    } else if (name.length > 50) {
      errs.name = 'Name must be 50 characters or less';
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
        name: name.trim(),
        type,
        color,
        icon,
      };

      if (categoryToEdit) {
        await api.updateCategory(categoryToEdit.id, payload);
        showToast('Category updated successfully', 'success');
      } else {
        await api.createCategory(payload);
        showToast('Category created successfully', 'success');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to save category', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={categoryToEdit ? 'Edit Category' : 'Create Category'}
      subtitle={categoryToEdit ? 'Modify category properties' : 'Group your transactions with tailored classifications'}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Type Toggle */}
        <div className="flex p-1 bg-[#101216] border border-[#252830] rounded-lg">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              type === 'expense'
                ? 'bg-[#E98282]/15 text-[#E98282] border border-[#E98282]/30 shadow-xs'
                : 'text-[#8E929B] hover:text-[#F4F1EA]'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              type === 'income'
                ? 'bg-[#7ED6A5]/15 text-[#7ED6A5] border border-[#7ED6A5]/30 shadow-xs'
                : 'text-[#8E929B] hover:text-[#F4F1EA]'
            }`}
          >
            Income
          </button>
        </div>

        {/* Category Name */}
        <Input
          label="Category Name"
          placeholder="e.g. Cloud Subscriptions, Gym & Fitness"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
        />

        {/* Color Palette Picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#8E929B]">Theme Color</label>
          <div className="flex flex-wrap gap-2 p-2.5 bg-[#101216] border border-[#252830] rounded-lg">
            {PRESET_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-6 h-6 rounded-md transition-transform ${
                  color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                }`}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>

        {/* Icon Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#8E929B]">Icon Tag</label>
          <select
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="w-full bg-[#101216] border border-[#252830] focus:border-[#C9B58A]/60 rounded-lg px-3 py-2 text-sm text-[#F4F1EA] transition-colors focus:outline-none"
          >
            {PRESET_ICONS.map((ic) => (
              <option key={ic} value={ic} className="bg-[#15171C]">
                {ic}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#252830]">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={loading}>
            {categoryToEdit ? 'Save Changes' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
