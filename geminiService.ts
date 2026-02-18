
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { ProductData, SceneManifest, AngleResult } from "./types";

// Always create a fresh instance to use the most up-to-date API key
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates an image with Optimal Resolution (2K) and Dynamic Aspect Ratio.
 * Uses gemini-3-pro-image-preview for high-fidelity pixels.
 */
export const generateSceneImage = async (base64References: string | string[], prompt: string, ratio: string = "9:16") => {
  const ai = getAI();
  const refs = Array.isArray(base64References) ? base64References : [base64References];
  
  const parts: any[] = refs.map(ref => ({
    inlineData: {
      mimeType: 'image/png',
      data: ref.includes(',') ? ref.split(',')[1] : ref
    }
  }));

  const systemPrompt = `
    TASK: Generate a high-resolution 2K image for professional UGC.
    STRICT IDENTITY LOCK:
    - Replicate the EXACT face and characteristics from the first reference image.
    - If a second image is provided, use its environment/background.
    - Maintain consistent lighting and atmosphere.
    QUALITY: Extremely sharp textures, cinematic realism, no AI artifacts.
    ASPECT RATIO: ${ratio}.
    [PROHIBITED]: No text, no captions, no watermarks, no overlays.
  `;

  parts.push({ text: `${prompt}\n${systemPrompt}` });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: {
        imageConfig: { 
          aspectRatio: ratio as any,
          imageSize: "2K" 
        }
      }
    });
    
    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return imagePart ? imagePart.inlineData.data : null;
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("API_KEY_NOT_FOUND");
    }
    throw error;
  }
};

/**
 * Generates a Scene Manifest with a high-fidelity VO script.
 */
export const generateSceneManifest = async (base64Reference: string, context: string, product: ProductData): Promise<SceneManifest | null> => {
  const ai = getAI();
  const prompt = `
    Generate a professional TikTok UGC Scene Manifest JSON for "${product.name}" (${product.type}).
    Scene Context: ${context}
    Target Gender: ${product.gender}
    
    REQUIREMENTS:
    - voice_over.script: CLEAN text only, max 20 words.
    - voice_over.vocal_profile: High fidelity natural human.
    - motion_engine.profile: Microtic-Realism (blinking, subtle tilts).
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/png', data: base64Reference.split(',')[1] } },
        { text: prompt }
      ]
    },
    config: { 
      responseMimeType: "application/json"
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch {
    return null;
  }
};

/**
 * Generates Viral Angles for a product.
 */
export const generateViralAngles = async (inputs: { product: string; target: string; benefit: string; gender: string }): Promise<AngleResult[]> => {
  const ai = getAI();
  const prompt = `
    Create 5 high-conversion TikTok viral angles for "${inputs.product}".
    Target Audience: ${inputs.target}
    Key Benefit: ${inputs.benefit}
    Gender: ${inputs.gender}
    
    Output JSON array of objects with fields: angle_number, angle_name, emotion, hook_text, image_prompt, video_json.
    Strictly follow TikTok's psychological hook principles.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [{ text: prompt }] },
    config: { 
      responseMimeType: "application/json"
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch {
    return [];
  }
};

/**
 * Synthesizes voice using Gemini's TTS.
 */
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
