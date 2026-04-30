import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

export function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

export const geminiService = {
  /**
   * Generates earning predictions based on user stats
   */
  generateAIPredictions: async (stats: {
    pendingTasksCount: number;
    avgEarning: number;
    completionRate: number;
  }) => {
    try {
      const response = await getAIClient().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Worker stats:
- Pending Tasks: ${stats.pendingTasksCount}
- Average Task Earning: Rs.${stats.avgEarning}
- Completion Rate: ${stats.completionRate}%

Predict today's potential extra earning if they complete these tasks. 
Be motivational and realistic.`,
        config: {
          systemInstruction: "You are a professional financial advisor for micro-task workers in India. Your goal is to motivate them by showing potential daily earnings based on their current workload. Keep messages short (max 15 words) and encouraging.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              predictedEarning: { type: Type.NUMBER, description: "The predicted amount in INR" },
              motivationalMessage: { type: Type.STRING, description: "A short motivational message" }
            },
            required: ["predictedEarning", "motivationalMessage"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from Gemini");
      return JSON.parse(text);
    } catch (error) {
      console.error("Gemini generateAIPredictions Error:", error instanceof Error ? error.message : String(error));
      throw error;
    }
  },

  /**
   * Reviews proof content for authenticity and relevance
   */
  reviewProofContent: async (data: {
    proofText: string;
    proofType: string;
    venture: string;
  }) => {
    try {
      const response = await getAIClient().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Review this ${data.proofType} proof for ${data.venture} marketing task:
"${data.proofText}"

Rate it on Authenticity (1-10) and Relevance (1-10).
If overall score is < 5, reject it.`,
        config: {
          systemInstruction: "You are an expert quality control auditor for a digital marketing firm. You need to verify if user-submitted proofs (links or text descriptions) are genuine and related to the specific venture. Return JSON: { \"status\": \"rejected\" | \"pending_admin\", \"score\": number, \"reason\": \"string\" }",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING, enum: ["rejected", "pending_admin"] },
              score: { type: Type.NUMBER },
              reason: { type: Type.STRING }
            },
            required: ["status", "score", "reason"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from Gemini");
      return JSON.parse(text);
    } catch (error) {
      console.error("Gemini reviewProofContent Error:", error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
};
