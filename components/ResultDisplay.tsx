import React from 'react';
import type { ImageData } from '../types';
import { Spinner } from './Spinner';
import { DownloadIcon, ImageIcon } from './IconComponents';

interface ResultDisplayProps {
  image: ImageData | null;
  isLoading: boolean;
  onPreview?: () => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ image, isLoading, onPreview }) => {
  const handleDownload = () => {
    if (!image) return;
    const link = document.createElement('a');
    link.href = `data:${image.mimeType};base64,${image.base64}`;
    link.download = `product-scene-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
    
  return (
    <div 
      className={`relative w-full h-80 bg-gray-800/50 rounded-xl border-2 border-gray-700 flex items-center justify-center p-2 text-center ${onPreview && image ? 'cursor-zoom-in' : ''}`}
      onClick={onPreview}
    >
      {isLoading && (
        <div className="flex flex-col items-center">
          <Spinner />
          <p className="text-gray-400 mt-4">Creating your final scene...</p>
        </div>
      )}
      {!isLoading && image && (
        <>
            <img src={`data:${image.mimeType};base64,${image.base64}`} alt="Generated Scene" className="max-w-full max-h-full object-contain rounded-lg" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="absolute top-3 right-3 bg-gray-900/70 p-2 rounded-full text-gray-300 hover:bg-gray-800 hover:text-indigo-400 shadow-lg transition-all duration-200"
              title="Download Image"
            >
              <DownloadIcon className="h-6 w-6" />
            </button>
        </>
      )}
      {!isLoading && !image && (
        <div className="flex flex-col items-center text-gray-600">
            <ImageIcon className="h-16 w-16 mb-2" />
            <p>Your masterpiece will appear here</p>
        </div>
      )}
    </div>
  );
};