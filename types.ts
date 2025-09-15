export interface UploadableImageData {
  base64: string;
  mimeType: string;
}

export interface StoredImageData {
  id: string; // A unique identifier for the image, e.g., crypto.randomUUID()
  url: string; // Blob URL
  mimeType: string;
}

export interface ProductData {
  id: string; // Local unique ID for the product group
  primaryImage: StoredImageData;
  angleImages: StoredImageData[];
}

export interface StoredVideoData {
  id: string; // Local unique ID
  url: string; // Blob URL
  prompt: string;
}
