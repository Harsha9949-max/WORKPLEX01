import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { geminiService } from '../services/geminiService';
import toast from 'react-hot-toast';

/**
 * Custom hook for AI operations with rate limiting
 */
export function useAI() {
  const [loading, setLoading] = useState(false);
  const [lastCallTime, setLastCallTime] = useState<number>(0);

  const callAI = async (functionName: string, data: any) => {
    const now = Date.now();
    // 1 minute rate limit
    if (now - lastCallTime < 60000) {
      const remaining = Math.ceil((60000 - (now - lastCallTime)) / 1000);
      toast.error(`AI is cooling down. Try in ${remaining}s`);
      return null;
    }

    setLoading(true);
    try {
      // Direct calls to Gemini service for specific functions to avoid backend "internal" errors
      if (functionName === 'generateAIPredictions') {
        const result = await geminiService.generateAIPredictions(data);
        setLastCallTime(Date.now());
        return result;
      }

      if (functionName === 'reviewProofContent') {
        const result = await geminiService.reviewProofContent(data);
        setLastCallTime(Date.now());
        return result;
      }

      const aiFunction = httpsCallable(functions, functionName);
      const result = await aiFunction(data);
      setLastCallTime(Date.now());
      return result.data;
    } catch (error: any) {
      console.error(`AI Error (${functionName}):`, error.message);
      toast.error('AI service temporarily unavailable');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { callAI, loading };
}
