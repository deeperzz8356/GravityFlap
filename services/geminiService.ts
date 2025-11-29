import { GoogleGenAI, Type } from "@google/genai";
import { SkinConfig } from "../types";

const API_KEY = process.env.API_KEY || '';

// Initialize safely. If no key, we will mock responses in the functions.
const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateGameOverCommentary = async (score: number): Promise<string> => {
  if (!API_KEY) return "AI Offline: Install an API Key to get roasted properly! (Great run though!)";

  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      You are a witty, slightly sarcastic arcade game announcer.
      The player just died in "Gravity Flap Flyer".
      Their score was ${score}.
      If the score is low (< 5), roast them gently for being clumsy.
      If the score is medium (5-20), give them an encouraging but snarky tip about gravity.
      If the score is high (> 20), praise them as a gravity master.
      Keep it under 20 words.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "Gravity is a harsh mistress.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Gravity is a harsh mistress. (AI Unavailable)";
  }
};


