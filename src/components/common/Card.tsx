import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={`bg-[#15171C] border border-[#252830] rounded-xl p-5 sm:p-6 transition-all duration-150 ${
        hoverable ? 'hover:border-[#363A45] hover:bg-[#181B21]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
