import { GoogleGenAI, Modality } from "@google/genai";
import type { ImageData } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

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
export const generateLifestyleImage = async (prompt: string): Promise<ImageData> => {
  try {
    const response = await withRetry(() => ai.models.generateImages({
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
 * Combines a product image with a lifestyle image.
 * @param productImage The product image data.
 * @param lifestyleImage The background lifestyle image data.
 * @param userPrompt Custom instructions for the combination process.
 * @param model The AI model to use for the combination.
 * @returns A promise that resolves to the combined image data.
 */
export const combineImages = async (
  productImage: ImageData,
  lifestyleImage: ImageData,
  userPrompt: string,
  model: 'gemini' | 'qwen'
): Promise<ImageData> => {
  if (model === 'qwen') {
    // Placeholder for Qwen API integration.
    // In a real implementation, this would call the Qwen API.
    // For now, we'll throw an error to indicate it's not implemented.
    throw new Error("Qwen model integration is not yet available. Please select Gemini for now.");
  }
  
  // Changed prompt to reflect the new image order (background first, then product).
  const basePrompt = `The first image is the background scene, and the second image is the product. Place the product from the second image seamlessly into the scene from the first image. Match lighting, shadows, perspective, and scale. The output must be only the composed image.`;
  
  const promptText = `${basePrompt}\n\nUser's refinement: ${userPrompt}`;
  
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          // Background first for more stable generation
          {
            inlineData: {
              data: lifestyleImage.base64,
              mimeType: lifestyleImage.mimeType,
            },
          },
          // Then product
          {
            inlineData: {
              data: productImage.base64,
              mimeType: productImage.mimeType,
            },
          },
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
export const removeImageBackground = async (image: ImageData): Promise<ImageData> => {
  // Simplified prompt for better stability.
  const prompt = "Remove the background from the preceding image. Make the background transparent. The output must be a PNG image of only the main subject, with a transparent background.";
  
  try {
    const response = await withRetry(() => ai.models.generateContent({
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
  image: ImageData,
  prompt: string,
  onStatusUpdate: (status: string) => void
): Promise<Blob> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  
  try {
    onStatusUpdate("Sending video generation request to Gemini...");
    let operation = await withRetry(() => ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt: prompt,
      image: {
        imageBytes: image.base64,
        mimeType: image.mimeType,
      },
      config: {
        numberOfVideos: 1
      }
    }), {
        onRetry: (attempt) => onStatusUpdate(`Request failed. Retrying... (Attempt ${attempt})`)
    });

    onStatusUpdate("Request accepted. Video generation is in progress. This may take a few minutes...");
    
    let pollCount = 0;
    while (!operation.done) {
      pollCount++;
      const waitTime = 10000; // 10 seconds
      onStatusUpdate(`Polling for result (attempt ${pollCount})... Checking again in ${waitTime / 1000} seconds.`);
      await new Promise(resolve => setTimeout(resolve, waitTime));

      operation = await withRetry(() => ai.operations.getVideosOperation({ operation: operation }), {
          maxRetries: 5, // Polling can be flaky, allow more retries.
          onRetry: (attempt, error) => onStatusUpdate(`Polling failed. Retrying (Attempt ${attempt}). Error: ${error.message.substring(0, 50)}...`)
      });
    }
    
    onStatusUpdate("Video generated successfully! Downloading video data...");

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("Video generation finished, but no download link was provided.");
    }
    
    const response = await withRetry(() => fetch(`${downloadLink}&key=${process.env.API_KEY}`), {
        onRetry: (attempt) => onStatusUpdate(`Download failed. Retrying... (Attempt ${attempt})`)
    });
    
    if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
    }

    onStatusUpdate("Download complete.");
    const videoBlob = await response.blob();
    return videoBlob;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error("Error generating video:", error);
    onStatusUpdate(`Error during video generation: ${errorMessage}`);
    throw new Error(`Failed to generate video: ${errorMessage}`);
  }
};