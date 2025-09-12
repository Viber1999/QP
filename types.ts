export interface ImageData {
  base64: string;
  mimeType: string;
}

export interface VideoData {
  id: string;
  url: string; // Object URL from blob
  prompt: string;
}
