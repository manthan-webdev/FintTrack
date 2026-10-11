import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'positive' | 'negative' | 'neutral' | 'accent' | 'warning';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
}) => {
  const variantStyles = {
    positive: 'bg-[#7ED6A5]/10 text-[#7ED6A5] border-[#7ED6A5]/25',
    negative: 'bg-[#E98282]/10 text-[#E98282] border-[#E98282]/25',
    neutral: 'bg-[#1A1D24] text-[#8E929B] border-[#252830]',
    accent: 'bg-[#C9B58A]/10 text-[#C9B58A] border-[#C9B58A]/25',
    warning: 'bg-[#D4A373]/10 text-[#D4A373] border-[#D4A373]/25',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
