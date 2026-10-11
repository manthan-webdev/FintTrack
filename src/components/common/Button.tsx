import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B58A]/50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap select-none cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[32px]',
    md: 'text-sm px-4 py-2 gap-2 min-h-[40px]',
    lg: 'text-sm px-5 py-2.5 gap-2.5 min-h-[44px]',
  };

  const variantStyles = {
    primary:
      'bg-[#C9B58A] text-[#08090B] font-semibold hover:bg-[#D6C59E] active:scale-[0.99] shadow-sm',
    secondary:
      'bg-[#1A1D24] text-[#F4F1EA] border border-[#252830] hover:bg-[#222630] hover:border-[#363A45] active:scale-[0.99]',
    outline:
      'bg-transparent text-[#F4F1EA] border border-[#252830] hover:bg-[#15171C] hover:border-[#363A45]',
    ghost:
      'bg-transparent text-[#8E929B] hover:text-[#F4F1EA] hover:bg-[#15171C]',
    danger:
      'bg-[#E98282]/15 text-[#E98282] border border-[#E98282]/30 hover:bg-[#E98282]/25 active:scale-[0.99]',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span className="truncate">{children}</span>
    </button>
  );
};
