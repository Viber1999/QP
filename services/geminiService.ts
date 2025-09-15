// FIX: Import necessary response types from @google/genai.
import { GoogleGenAI, Modality, GenerateImagesResponse, GenerateContentResponse } from "@google/genai";
import type { UploadableImageData } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * A utility function to retry an async operation with exponential backoff.
 * @param fn The async function to retry.
 * @param options Configuration for retries.
 * @returns The result of the async function.
 */
const withRetry = async <T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; initialDelay?: number; backoffFactor?: number; onRetry?: (attempt: number, error: Error) => void } = {}
): Promise<T> => {
  const { maxRetries = 3, initialDelay = 1000, backoffFactor = 2, onRetry } = options;
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      const err = error as Error;
      attempt++;
      if (attempt > maxRetries) {
        throw new Error(`Operation failed after ${maxRetries} retries. Last error: ${err.message}`);
      }
      onRetry?.(attempt, err);
      // Add jitter to prevent thundering herd problem
      const jitter = Math.random() * 500;
      const delay = initialDelay * (backoffFactor ** (attempt - 1)) + jitter;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};


/**
 * Generates a lifestyle image using a text prompt.
 * @param prompt The text prompt to generate the image from.
 * @returns A promise that resolves to the generated image data.
 */
export const generateLifestyleImage = async (prompt: string): Promise<UploadableImageData> => {
  try {
    // FIX: Provide explicit type for withRetry to ensure `response` is correctly typed.
    const response = await withRetry<GenerateImagesResponse>(() => ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1', // Match the square resolution options
      },
    }));

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
    throw new Error("Failed to generate lifestyle image after multiple attempts.");
  }
};

/**
 * Combines a product image (with multiple angles) with a lifestyle image.
 * @param primaryProductImage The main product image to place in the scene.
 * @param angleImages Additional angles of the product for AI reference.
 * @param lifestyleImage The background lifestyle image.
 * @param userPrompt Custom instructions for the combination process.
 * @returns A promise that resolves to the combined image data.
 */
export const combineImages = async (
  primaryProductImage: UploadableImageData,
  angleImages: UploadableImageData[],
  lifestyleImage: UploadableImageData,
  userPrompt: string
): Promise<UploadableImageData> => {
  const basePrompt = `The first image is the background scene. The second image is the primary product. The subsequent images are additional angles of the same product for reference. Place the primary product from the second image seamlessly into the scene from the first image. Use the additional angles to accurately render lighting, shadows, perspective, and scale. The output must be only the composed image.`;

  const promptText = `${basePrompt}\n\nUser's refinement: ${userPrompt}`;
  
  const imageParts = [
    // 1. Background
    { inlineData: { data: lifestyleImage.base64, mimeType: lifestyleImage.mimeType } },
    // 2. Primary Product
    { inlineData: { data: primaryProductImage.base64, mimeType: primaryProductImage.mimeType } },
    // 3. Angle Images for reference
    ...angleImages.map(img => ({
      inlineData: { data: img.base64, mimeType: img.mimeType },
    })),
  ];

  try {
    // FIX: Provide explicit type for withRetry to ensure `response` is correctly typed.
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          ...imageParts,
          // Instructions last
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    }));

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
    throw new Error("Failed to combine images after multiple attempts.");
  }
};

/**
 * Removes the background from an image.
 * @param image The image to process.
 * @returns A promise that resolves to the image data with a transparent background.
 */
export const removeImageBackground = async (image: UploadableImageData): Promise<UploadableImageData> => {
  // Simplified prompt for better stability.
  const prompt = "Remove the background from the preceding image. Make the background transparent. The output must be a PNG image of only the main subject, with a transparent background.";
  
  try {
    // FIX: Provide explicit type for withRetry to ensure `response` is correctly typed.
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: image.base64,
              mimeType: image.mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    }));

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          // The model should return a PNG, so we can expect transparency
          return {
            base64: part.inlineData.data,
            mimeType: 'image/png', // Force PNG for transparency
          };
        }
      }
    }
    throw new Error("No image was returned from the background removal API.");

  } catch (error) {
    console.error("Error removing image background:", error);
    throw new Error("Failed to remove image background after multiple attempts.");
  }
};


/**
 * Generates a video from a source image and a text prompt.
 * @param image The source image data.
 * @param prompt The text prompt describing the desired animation.
 * @param onStatusUpdate A callback to report progress updates.
 * @returns A promise that resolves to the generated video blob.
 */
export const generateVideo = async (
  image: UploadableImageData,
  prompt: string,
  onStatusUpdate: (status: string) => void
): Promise<Blob> => {
  // FIX: Complete the function to handle video generation and return a Blob.
  try {
    onStatusUpdate('Starting video generation with VEO...');
    let operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt: prompt,
      image: {
        imageBytes: image.base64,
        mimeType: image.mimeType,
      },
      config: {
        numberOfVideos: 1,
      },
    });
    
    onStatusUpdate('Video generation in progress... This can take a few minutes.');
    
    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      onStatusUpdate('Checking video status...');
      operation = await ai.operations.getVideosOperation({ operation });
    }

    onStatusUpdate('Video generated! Downloading file...');

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
      throw new Error('Video generation finished, but no download link was found.');
    }

    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) {
        throw new Error(`Failed to download video file. Status: ${videoResponse.statusText}`);
    }
    
    const videoBlob = await videoResponse.blob();
    onStatusUpdate('Video download complete!');
    return videoBlob;

  } catch (error) {
    console.error("Error generating video:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    onStatusUpdate(`Error: ${errorMessage}`);
    throw new Error(`Failed to generate video: ${errorMessage}`);
  }
};