import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, rightElement, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-[#8E929B] flex items-center justify-between">
            <span>{label}</span>
            {props.required && <span className="text-[#C9B58A] text-[10px]">*required</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-[#8E929B] pointer-events-none flex items-center">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-[#101216] border ${
              error ? 'border-[#E98282] focus:border-[#E98282]' : 'border-[#252830] focus:border-[#C9B58A]/60'
            } rounded-lg px-3 py-2 text-sm text-[#F4F1EA] placeholder-[#8E929B]/50 transition-colors focus:outline-none focus:ring-1 ${
              error ? 'focus:ring-[#E98282]/30' : 'focus:ring-[#C9B58A]/30'
            } ${icon ? 'pl-9' : ''} ${rightElement ? 'pr-10' : ''} disabled:opacity-50 disabled:bg-[#08090B] ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 flex items-center text-[#8E929B]">
              {rightElement}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-[#E98282] font-medium mt-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#8E929B] mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
