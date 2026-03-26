import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AssessmentResult {
  level: 'RED' | 'YELLOW' | 'GREEN';
  condition: string;
  advice: string;
  urgencyReason: string;
  malnutritionRisk?: 'Low' | 'Moderate' | 'High';
  outbreakConcern?: boolean;
}

export const analyzeSymptoms = async (
  symptoms: string,
  image?: string
): Promise<AssessmentResult> => {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are Kinga, an AI-Enabled diagnostic tool for Community Health Volunteers in 2026.
    Your goal is to simplify diagnostics for acute conditions like malaria, pneumonia, and malnutrition.
    
    Urgency Levels:
    - RED: Immediate emergency (e.g., severe pneumonia, cerebral malaria, severe acute malnutrition with complications).
    - YELLOW: Action needed within 24 hours.
    - GREEN: Home management.
    
    Computer Vision Tasks:
    - If an image is provided, look for signs of malnutrition: muscle wasting, prominent ribs, edema (swelling), or MUAC tape readings if visible.
    - Look for signs of respiratory distress (pneumonia) or malaria-related jaundice/pallor.
    
    Outbreak Detection:
    - If symptoms suggest a cluster of similar cases (e.g., many fevers, coughs, or rashes in the area), set outbreakConcern to true.
    
    Be concise and actionable.
  `;

  const prompt = `Analyze these symptoms: ${symptoms}. ${image ? "Also analyze the attached image for visual signs of illness or malnutrition." : ""}`;

  const response = await ai.models.generateContent({
    model,
    contents: image 
      ? [{ parts: [{ text: prompt }, { inlineData: { data: image.split(',')[1], mimeType: "image/jpeg" } }] }]
      : prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          level: { type: Type.STRING, enum: ['RED', 'YELLOW', 'GREEN'] },
          condition: { type: Type.STRING, description: "Likely condition (Malaria, Pneumonia, Malnutrition, etc.)" },
          advice: { type: Type.STRING, description: "Actionable advice for the volunteer" },
          urgencyReason: { type: Type.STRING, description: "Why this urgency level was chosen" },
          malnutritionRisk: { type: Type.STRING, enum: ['Low', 'Moderate', 'High'] },
          outbreakConcern: { type: Type.BOOLEAN, description: "Whether this case suggests a potential outbreak" }
        },
        required: ['level', 'condition', 'advice', 'urgencyReason', 'malnutritionRisk', 'outbreakConcern']
      }
    }
  });

  return JSON.parse(response.text);
};

export const translateToVernacular = async (
  text: string,
  targetLanguage: string
): Promise<string> => {
  const model = "gemini-3.1-flash-lite-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: `Translate the following medical advice into ${targetLanguage}. 
    RULES:
    - Return ONLY the translated text.
    - DO NOT include any preamble, explanation, or "Here is the translation".
    - DO NOT use markdown formatting (no bold, no lists).
    - Keep it simple, culturally appropriate, and clear for a volunteer.
    
    Text to translate: "${text}"`,
  });

  return response.text?.trim() || text;
};
