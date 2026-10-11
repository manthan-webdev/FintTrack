import React from 'react';
import { Button } from './Button.js';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-[#252830] rounded-xl bg-[#101216]/50 ${className}`}
    >
      {icon && (
        <div className="p-3.5 rounded-xl bg-[#15171C] border border-[#252830] text-[#C9B58A] mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[#F4F1EA] mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-[#8E929B] max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
