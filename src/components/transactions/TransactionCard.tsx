import React from 'react';
import { Edit2, Trash2, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatCurrency, SupportedCurrency } from '../../utils/currency.js';
import { formatDate } from '../../utils/date.js';

export interface TransactionCardProps {
  transaction: any;
  currency: SupportedCurrency;
  onEdit: (tx: any) => void;
  onDelete: (tx: any) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  currency,
  onEdit,
  onDelete,
}) => {
  const isIncome = transaction.type === 'income';
  const category = transaction.category || { name: 'General', color: '#C9B58A' };

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-[#101216] border border-[#252830] hover:border-[#363A45] transition-all group">
      {/* Left Details */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            isIncome
              ? 'bg-[#7ED6A5]/10 border-[#7ED6A5]/25 text-[#7ED6A5]'
              : 'bg-[#E98282]/10 border-[#E98282]/25 text-[#E98282]'
          }`}
        >
          {isIncome ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-[#F4F1EA] truncate">
              {transaction.description}
            </h4>
          </div>
          {/* Metadata with unboxed text and clean separator */}
          <div className="flex items-center gap-1.5 text-xs text-[#8E929B] mt-0.5">
            <span style={{ color: category.color }} className="font-medium">
              {category.name}
            </span>
            <span aria-hidden="true">·</span>
            <span>{formatDate(transaction.date)}</span>
            <span aria-hidden="true">·</span>
            <span className="hidden sm:inline">{transaction.payment_method}</span>
          </div>
        </div>
      </div>

      {/* Right Amount & Actions */}
      <div className="flex items-center gap-3 shrink-0 ml-3">
        <div className="text-right">
          <span
            className={`font-mono tabular-nums font-semibold text-sm sm:text-base ${
              isIncome ? 'text-[#7ED6A5]' : 'text-[#F4F1EA]'
            }`}
          >
            {isIncome ? '+' : '-'}
            {formatCurrency(transaction.amount, currency, false)}
          </span>
          {transaction.notes && (
            <p className="text-[11px] text-[#8E929B] truncate max-w-[120px] text-right">
              {transaction.notes}
            </p>
          )}
        </div>

        {/* Action buttons with visible affordance */}
        <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(transaction)}
            className="p-1.5 rounded-lg text-[#8E929B] hover:text-[#C9B58A] hover:bg-[#15171C] transition-colors"
            title="Edit Transaction"
            aria-label="Edit Transaction"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(transaction)}
            className="p-1.5 rounded-lg text-[#8E929B] hover:text-[#E98282] hover:bg-[#15171C] transition-colors"
            title="Delete Transaction"
            aria-label="Delete Transaction"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
