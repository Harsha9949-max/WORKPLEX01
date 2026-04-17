import React from 'react';

interface Props {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressBar({ currentStep, totalSteps }: Props) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-xs font-bold text-[#E8B84B]">
          {Math.round(progress)}% Complete
        </span>
      </div>
      <div className="w-full h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#E8B84B] to-[#d4a63f] transition-all duration-500 ease-out shadow-[0_0_10px_rgba(232,184,75,0.3)]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
