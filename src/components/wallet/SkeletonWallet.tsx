import React from 'react';

export default function SkeletonWallet() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4 text-white">
      <div className="h-8 w-32 bg-[#1A1A1A] animate-pulse rounded mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-[#1A1A1A] animate-pulse rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
