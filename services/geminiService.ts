import { GoogleGenAI, Modality } from "@google/genai";
import type { ImageData, Resolution } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a lifestyle image using a text prompt.
 * @param prompt The text prompt to generate the image from.
 * @returns A promise that resolves to the generated image data.
 */
export const generateLifestyleImage = async (prompt: string): Promise<ImageData> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1', // Match the square resolution options
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const imageData = response.generatedImages[0].image;
      return {
        base64: imageData.imageBytes,
        mimeType: imageData.mimeType,
      };
    } else {
      throw new Error("No image was generated.");
    }
  } catch (error) {
    console.error("Error generating lifestyle image:", error);
    throw new Error("Failed to communicate with the image generation API.");
  }
};

/**
 * Combines a product image with a lifestyle image.
 * @param productImage The product image data.
 * @param lifestyleImage The background lifestyle image data.
 * @param userPrompt Custom instructions for the combination process.
 * @param resolution The desired output resolution.
 * @returns A promise that resolves to the combined image data.
 */
export const combineImages = async (
  productImage: ImageData,
  lifestyleImage: ImageData,
  userPrompt: string,
  resolution: Resolution,
): Promise<ImageData> => {
  const basePrompt = `
    Analyze the first image, which contains a product on a plain background.
    Then, analyze the second image, which is a lifestyle scene.
    Your task is to seamlessly and realistically place the product from the first image into the lifestyle scene.
    Pay attention to lighting, shadows, perspective, and scale to make the composition look natural.
    The final output image MUST have a resolution of exactly ${resolution.width}x${resolution.height} pixels.
    Do not add any text or other elements. The output should only be the final composed image.
  `;
  
  const promptText = `${basePrompt}\n\nUser's specific instructions: ${userPrompt}`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: productImage.base64,
              mimeType: productImage.mimeType,
            },
          },
          {
            inlineData: {
              data: lifestyleImage.base64,
              mimeType: lifestyleImage.mimeType,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return {
            base64: part.inlineData.data,
            mimeType: part.inlineData.mimeType,
          };
        }
      }
    }
    throw new Error("No image was returned from the combination API.");

  } catch (error) {
    console.error("Error combining images:", error);
    throw new Error("Failed to communicate with the image editing API.");
  }
};