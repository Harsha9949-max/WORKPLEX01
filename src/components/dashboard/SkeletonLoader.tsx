import React from 'react';

export const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-[#1A1A1A] rounded-xl ${className}`}>
    <div className="w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
  </div>
);

export default function SkeletonLoader() {
  return (
    <div className="space-y-6 p-4">
      {/* Top Bar Skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="w-24 h-4" />
            <Skeleton className="w-16 h-3" />
          </div>
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="w-20 h-6" />
          <Skeleton className="w-16 h-3" />
        </div>
      </div>

      {/* Coupon Card Skeleton */}
      <Skeleton className="w-full h-40" />

      {/* Predictor Skeleton */}
      <Skeleton className="w-full h-24" />

      {/* Tasks Skeleton */}
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="w-32 h-6" />
          <Skeleton className="w-16 h-4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48 hidden md:block" />
          <Skeleton className="h-48 hidden md:block" />
        </div>
      </div>

      {/* Progress Skeleton */}
      <Skeleton className="w-full h-32" />
    </div>
  );
}
