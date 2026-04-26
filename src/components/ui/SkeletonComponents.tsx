import React from 'react';

const shimmerClass = "animate-pulse bg-gradient-to-r from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] bg-[length:200%_100%]";

export const SkeletonStreakCard = () => (
  <div className={`h-24 rounded-2xl w-full mb-6 ${shimmerClass}`} style={{ animationDuration: '1.5s' }} />
);

export const SkeletonTaskCard = () => (
  <div className={`h-32 rounded-2xl w-full mb-4 ${shimmerClass}`} style={{ animationDuration: '1.5s' }} />
);

export const SkeletonWalletCard = () => (
  <div className={`h-28 rounded-2xl w-full ${shimmerClass}`} style={{ animationDuration: '1.5s' }} />
);

export const SkeletonCouponCard = () => (
  <div className={`h-40 rounded-[24px] w-full mb-6 ${shimmerClass}`} style={{ animationDuration: '1.5s' }} />
);

export const SkeletonTransactionItem = () => (
  <div className={`h-16 rounded-2xl w-full mb-3 ${shimmerClass}`} style={{ animationDuration: '1.5s' }} />
);

export const SkeletonProfileHero = () => (
  <div className={`h-40 rounded-[24px] w-full mb-6 ${shimmerClass}`} style={{ animationDuration: '1.5s' }} />
);
