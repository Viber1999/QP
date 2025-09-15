import React from 'react';
import type { StoredImageData } from '../types';
import { CloseIcon, DownloadIcon } from './IconComponents';

interface ImagePreviewModalProps {
  image: StoredImageData | null;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ image, onClose }) => {
  if (!image) {
    return null;
  }

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `product-scene-preview-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-preview-title"
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-gray-900/80 border border-gray-700 rounded-xl shadow-2xl p-4 flex flex-col"
        onClick={stopPropagation}
      >
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 id="image-preview-title" className="text-lg font-semibold text-gray-300">Image Preview</h2>
          <div className="flex items-center space-x-2">
             <button
              onClick={handleDownload}
              className="bg-gray-800/70 p-2 rounded-full text-gray-300 hover:bg-indigo-600 hover:text-white shadow-lg transition-all duration-200"
              title="Download Image"
            >
              <DownloadIcon className="h-6 w-6" />
            </button>
            <button
              onClick={onClose}
              className="bg-gray-800/70 p-2 rounded-full text-gray-300 hover:bg-red-600/80 hover:text-white transition-colors duration-200"
              aria-label="Close preview"
            >
              <CloseIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
        <div className="flex-grow flex items-center justify-center overflow-hidden min-h-0">
            <img
            src={image.url}
            alt="Generated Scene Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
            />
        </div>
      </div>
    </div>
  );
};
