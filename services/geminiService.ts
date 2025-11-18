import { GoogleGenAI, Type } from "@google/genai";
import { GameBoardData, Category } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to generate an image based on a text description
const generateClueImage = async (description: string): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `A realistic, high-quality veterinary medical image: ${description}. Plain background, clear clinical presentation.`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '4:3', // Standard slide format
      },
    });
    
    const base64 = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64) {
      return `data:image/jpeg;base64,${base64}`;
    }
    return undefined;
  } catch (error) {
    console.warn("Failed to generate image for clue:", description, error);
    return undefined;
  }
};

// Accepts optional existing categories (from CSV) to fill in
export const generateGameContent = async (existingCategories: Partial<Category>[] = []): Promise<any> => {
  const model = "gemini-2.5-flash";

  // FIX: Removed deprecated `Schema` type. The schema object is now correctly inferred.
  const schema = {
    type: Type.OBJECT,
    properties: {
      categories: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Category name" },
            clues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  value: { type: Type.INTEGER },
                  question: { type: Type.STRING, description: "The clue text. If using an image, keep this brief e.g. 'Identify this condition'." },
                  answer: { type: Type.STRING },
                  imageUrl: { type: Type.STRING, description: "The URL of the image if provided in the input data. Do not generate a new URL, just preserve the input." },
                  imagePrompt: { type: Type.STRING, description: "Optional: A detailed visual description of a medical image (X-ray, cytology, skin lesion) to accompany this clue. Only use for the 'Visual Diagnosis' category or if specifically needed." }
                },
                required: ["value", "question", "answer"],
              },
            },
          },
          required: ["title", "clues"],
        },
      },
    },
    required: ["categories"],
  };

  let prompt = `
    Create a rigorous Veterinary Medicine Jeopardy game board.
    Generate 6 distinct categories. 
    
    Standard Rules:
    For EACH category, generate exactly 5 clues with values: 200, 400, 600, 800, 1000.
    Ensure the facts are medically accurate and suitable for veterinary students or professionals.
  `;

  if (existingCategories.length > 0) {
    prompt += `
    
    IMPORTANT - HYBRID MODE:
    The user has provided some existing game board data (categories and clues).
    You MUST include the provided categories and clues EXACTLY as they appear in the provided JSON. Do not alter their text, values, or image URLs.
    
    YOUR TASKS:
    1. Analyze the PROVIDED DATA below.
    2. If a provided category has fewer than 5 clues, generate the missing clues to complete the set (ensure values 200, 400, 600, 800, 1000 are all present).
    3. If there are fewer than 6 categories total in the provided data, generate completely NEW distinct veterinary categories to reach a total of 6.
    4. For any NEW categories you generate, ensure one is 'Visual Diagnosis' if it doesn't already exist, and include 'imagePrompt' for its clues.
    
    PROVIDED DATA: ${JSON.stringify(existingCategories)}
    `;
  } else {
    prompt += `
    One category MUST be named 'Visual Diagnosis'. 
    For 'Visual Diagnosis', every clue MUST include an 'imagePrompt' describing a specific medical image (e.g., 'Lateral thoracic radiograph showing an enlarged heart pattern'). 
    The other 5 categories can be standard text-based topics.
    `;
  }

  try {
    // 1. Generate Text Structure
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No content generated");
    
    const data = JSON.parse(text);
    
    // 2. Post-process: Generate Images for clues that have prompts
    const imagePromises: Promise<void>[] = [];

    const processCategory = async (category: any) => {
      for (const clue of category.clues) {
        // If we have a prompt but NO existing image URL, generate one
        if (clue.imagePrompt && !clue.imageUrl) {
          imagePromises.push((async () => {
            const imageUrl = await generateClueImage(clue.imagePrompt);
            if (imageUrl) {
              clue.imageUrl = imageUrl;
            }
            delete clue.imagePrompt; 
          })());
        }
      }
    };

    for (const category of data.categories) {
      await processCategory(category);
    }

    await Promise.all(imagePromises);
    
    return data;

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};