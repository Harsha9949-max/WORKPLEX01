import React, { useState } from 'react';
import toast from 'react-hot-toast';

interface Props {
  onComplete: () => void;
  prevStep: () => void;
  isSubmitting: boolean;
}

export default function Step7Agreement({ onComplete, prevStep, isSubmitting }: Props) {
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = () => {
    if (!agreed) {
      toast.error('You must agree to the terms and conditions to continue');
      return;
    }
    onComplete();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Contractor Agreement</h2>
        <p className="text-gray-400">Please review and accept the terms</p>
      </div>

      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4 h-48 overflow-y-auto text-sm text-gray-300 space-y-3 custom-scrollbar">
        <h3 className="font-bold text-white">Independent Contractor Agreement</h3>
        <p>
          This Independent Contractor Agreement ("Agreement") is entered into by and between HVRS Innovations ("Company") and you ("Contractor").
        </p>
        <p>
          <strong>1. Services:</strong> Contractor agrees to perform marketing, content creation, or reselling services as selected during onboarding.
        </p>
        <p>
          <strong>2. Compensation:</strong> Contractor will be paid based on completed tasks and commissions. A signup bonus of Rs.27 is credited to the pending wallet upon signup and unlocks after the first task.
        </p>
        <p>
          <strong>3. Independent Status:</strong> Contractor is an independent contractor, not an employee. Contractor is responsible for their own taxes and equipment.
        </p>
        <p>
          <strong>4. Confidentiality:</strong> Contractor agrees to keep all proprietary information, including coupon codes and client lists, confidential.
        </p>
        <p>
          <strong>5. Termination:</strong> Either party may terminate this agreement at any time. Fraudulent activity will result in immediate termination and forfeiture of pending funds.
        </p>
      </div>

      <label className="flex items-start space-x-3 cursor-pointer">
        <div className="flex-shrink-0 mt-1">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-5 h-5 rounded border-gray-500 text-[#E8B84B] focus:ring-[#E8B84B] bg-[#1A1A1A]"
          />
        </div>
        <span className="text-sm text-gray-400">
          I have read and agree to the Independent Contractor Agreement and the Terms & Conditions of WorkPlex.
        </span>
      </label>

      <div className="flex gap-3 pt-4">
        <button
          onClick={prevStep}
          disabled={isSubmitting}
          className="w-1/3 bg-[#1A1A1A] text-white font-semibold rounded-lg px-4 py-3 hover:bg-[#2A2A2A] transition-colors border border-[#2A2A2A] disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!agreed || isSubmitting}
          className="w-2/3 bg-[#E8B84B] text-black font-semibold rounded-lg px-4 py-3 hover:bg-[#d4a63f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating Account...' : 'Submit & Start Earning'}
        </button>
      </div>
    </div>
  );
}
