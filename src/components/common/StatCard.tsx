import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  subtitle,
}) => {
  return (
    <div className="bg-[#15171C] border border-[#252830] rounded-xl p-5 sm:p-6 transition-all hover:border-[#363A45]">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-medium text-[#8E929B] tracking-wide uppercase">{title}</span>
        {icon && (
          <div className="p-2 rounded-lg bg-[#101216] border border-[#252830] text-[#C9B58A]">
            {icon}
          </div>
        )}
      </div>

      <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F1EA] font-mono tabular-nums mb-2">
        {value}
      </div>

      <div className="flex items-center gap-2 text-xs">
        {change && (
          <span
            className={`inline-flex items-center gap-1 font-medium ${
              changeType === 'positive'
                ? 'text-[#7ED6A5]'
                : changeType === 'negative'
                ? 'text-[#E98282]'
                : 'text-[#8E929B]'
            }`}
          >
            {changeType === 'positive' && <TrendingUp className="w-3.5 h-3.5" />}
            {changeType === 'negative' && <TrendingDown className="w-3.5 h-3.5" />}
            {changeType === 'neutral' && <Minus className="w-3.5 h-3.5" />}
            <span>{change}</span>
          </span>
        )}
        {subtitle && (
          <span className="text-[#8E929B] truncate">
            {change && <span aria-hidden="true" className="mr-1">·</span>}
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
