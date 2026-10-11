import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Input } from '../common/Input.js';
import { Select } from '../common/Select.js';
import { Button } from '../common/Button.js';

export interface FilterState {
  search: string;
  type: string;
  category_id: string;
  payment_method: string;
  sort: string;
}

interface TransactionFiltersProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  categories: any[];
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  filters,
  onChange,
  categories,
}) => {
  const handleFieldChange = (field: keyof FilterState, val: string) => {
    onChange({
      ...filters,
      [field]: val,
    });
  };

  const handleReset = () => {
    onChange({
      search: '',
      type: '',
      category_id: '',
      payment_method: '',
      sort: 'date_desc',
    });
  };

  const isFiltered =
    filters.search ||
    filters.type ||
    filters.category_id ||
    filters.payment_method ||
    filters.sort !== 'date_desc';

  return (
    <div className="bg-[#15171C] border border-[#252830] rounded-xl p-4 flex flex-col gap-3">
      {/* Top Search bar & Reset */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search transactions by description, notes, or category..."
            value={filters.search}
            onChange={(e) => handleFieldChange('search', e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Type Segmented Filter (Button Tabs) */}
        <div className="flex p-1 bg-[#101216] border border-[#252830] rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => handleFieldChange('type', '')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filters.type === ''
                ? 'bg-[#15171C] text-[#F4F1EA] shadow-xs'
                : 'text-[#8E929B] hover:text-[#F4F1EA]'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => handleFieldChange('type', 'expense')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filters.type === 'expense'
                ? 'bg-[#E98282]/15 text-[#E98282]'
                : 'text-[#8E929B] hover:text-[#F4F1EA]'
            }`}
          >
            Expenses
          </button>
          <button
            type="button"
            onClick={() => handleFieldChange('type', 'income')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filters.type === 'income'
                ? 'bg-[#7ED6A5]/15 text-[#7ED6A5]'
                : 'text-[#8E929B] hover:text-[#F4F1EA]'
            }`}
          >
            Income
          </button>
        </div>

        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset
          </Button>
        )}
      </div>

      {/* Secondary dropdown row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#252830]/60">
        <Select
          value={filters.category_id}
          onChange={(e) => handleFieldChange('category_id', e.target.value)}
          options={[
            { value: '', label: 'All Categories' },
            ...categories.map((c) => ({
              value: c.id,
              label: `${c.name} (${c.type})`,
            })),
          ]}
        />

        <Select
          value={filters.payment_method}
          onChange={(e) => handleFieldChange('payment_method', e.target.value)}
          options={[
            { value: '', label: 'All Payment Methods' },
            { value: 'Card', label: 'Card' },
            { value: 'UPI', label: 'UPI' },
            { value: 'Bank Transfer', label: 'Bank Transfer' },
            { value: 'Cash', label: 'Cash' },
            { value: 'Other', label: 'Other' },
          ]}
        />

        <Select
          value={filters.sort}
          onChange={(e) => handleFieldChange('sort', e.target.value)}
          options={[
            { value: 'date_desc', label: 'Newest First' },
            { value: 'date_asc', label: 'Oldest First' },
            { value: 'amount_desc', label: 'Highest Amount' },
            { value: 'amount_asc', label: 'Lowest Amount' },
          ]}
        />
      </div>
    </div>
  );
};
