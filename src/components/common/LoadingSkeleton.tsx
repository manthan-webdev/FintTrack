import React from 'react';

export interface LoadingSkeletonProps {
  className?: string;
  rows?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = 'h-6 w-full',
  rows = 1,
}) => {
  return (
    <div className="flex flex-col gap-3 w-full animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`bg-[#1A1D24] rounded-lg ${className}`}
        />
      ))}
    </div>
  );
};
