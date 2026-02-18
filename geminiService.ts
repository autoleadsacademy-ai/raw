
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ProductData, SceneManifest, AngleResult } from "./types";

// Always use the API key directly from process.env.API_KEY as a named parameter
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates an image using one or more reference images.
 * Hard-forced to 9:16 for TikTok/Shorts compatibility.
 */
export const generateSceneImage = async (base64References: string | string[], prompt: string) => {
  const ai = getAI();
  const refs = Array.isArray(base64References) ? base64References : [base64References];
  
  const parts: any[] = refs.map((ref, index) => ({
    inlineData: {
      mimeType: 'image/png',
      data: ref.includes(',') ? ref.split(',')[1] : ref
    }
  }));

  // Strengthened consistency prompt with explicit vertical orientation
  const consistencyInstruction = `
    INSTRUCTIONS FOR IDENTITY LOCK & COMPOSITION:
    1. Replicate the EXACT facial features and identity of the person in the reference.
    2. Replicate the EXACT product design and branding from the reference.
    3. COMPOSITION: Use a professional vertical 9:16 portrait composition suitable for TikTok.
    4. NO TEXT: Do not add any generated text or gibberish.
    5. QUALITY: High-fidelity, cinematic UGC style.
  `;

  parts.push({ text: prompt + consistencyInstruction });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: parts
    },
    config: {
      // Hard-force 9:16 Aspect Ratio
      imageConfig: {
        aspectRatio: "9:16"
      }
    }
  });
  
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return part.inlineData.data;
  }
  return null;
};

export const generateSceneManifest = async (base64Reference: string, context: string, product: ProductData): Promise<SceneManifest | null> => {
  const ai = getAI();
  const prompt = `
    Generate professional video scene manifest JSON for a TikTok UGC video.
    SCENE CONTEXT: ${context}
    PRODUCT: ${product.name} (${product.type})
    GENDER: ${product.gender}

    STRICT JSON SCHEMA:
    {
      "scene_id": number,
      "role_in_video": string,
      "visual_locking": { "character": "Locked", "background": "Locked", "identity_mapping": "Reference Image" },
      "voice_over": { "script": "Clean script max 22 words", "gender": "${product.gender}", "vocal_profile": "Natural", "word_count_check": "OK" },
      "motion_engine": { "profile": "Microtic", "parameters": ["blinking", "head_tilt"] },
      "timing": "8 seconds"
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/png', data: base64Reference.split(',')[1] } },
        { text: prompt }
      ]
    },
    config: { responseMimeType: "application/json" }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch {
    return null;
  }
};

export const generateViralAngles = async (inputs: { product: string; target: string; benefit: string; gender: string }, imageBase64?: string): Promise<AngleResult[]> => {
  const ai = getAI();
  const prompt = `
    Role: Viral TikTok Affiliate Strategist.
    Task: Create 5-7 high-conversion content angles for ${inputs.product}.
    Target: ${inputs.target}. Benefit: ${inputs.benefit}.
    Output: JSON array of Angle objects.
  `;

  const parts: any[] = [{ text: prompt }];
  if (imageBase64) {
    parts.push({ inlineData: { mimeType: 'image/png', data: imageBase64.split(',')[1] } });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: { responseMimeType: "application/json" }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch {
    return [];
  }
};

export const generateVoice = async (text: string, voiceName: string): Promise<string | null> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName }
        }
      }
    }
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
};
