import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, helperText, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-xs font-medium text-[#8E929B] flex items-center justify-between">
            <span>{label}</span>
            {props.required && <span className="text-[#C9B58A] text-[10px]">*required</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            className={`w-full appearance-none bg-[#101216] border ${
              error ? 'border-[#E98282]' : 'border-[#252830] focus:border-[#C9B58A]/60'
            } rounded-lg px-3 py-2 pr-9 text-sm text-[#F4F1EA] transition-colors focus:outline-none focus:ring-1 ${
              error ? 'focus:ring-[#E98282]/30' : 'focus:ring-[#C9B58A]/30'
            } disabled:opacity-50 cursor-pointer ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled} className="bg-[#15171C] text-[#F4F1EA]">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 pointer-events-none text-[#8E929B]">
            <ChevronDown className="w-4 h-4" />
          </div>
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

Select.displayName = 'Select';
