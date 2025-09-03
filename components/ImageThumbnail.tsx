import React from 'react';
import type { ImageData } from '../types';
import { CloseIcon, DownloadIcon } from './IconComponents';

interface ImageThumbnailProps {
  image: ImageData;
  onClick: () => void;
  onDelete: () => void;
  onDownload?: () => void;
  showDownload?: boolean;
}

export const ImageThumbnail: React.FC<ImageThumbnailProps> = ({ image, onClick, onDelete, onDownload, showDownload }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent onClick from firing when deleting
    onDelete();
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent onClick from firing when downloading
    onDownload?.();
  };

  return (
    <div
      className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer group transition-transform transform hover:scale-105"
      onClick={onClick}
    >
      <img
        src={`data:${image.mimeType};base64,${image.base64}`}
        alt="Thumbnail"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <p className="text-white text-sm font-bold">Select</p>
      </div>
       <button
        onClick={handleDelete}
        className="absolute top-1.5 right-1.5 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-red-600/80 transition-all duration-200"
        aria-label="Delete image"
        title="Delete image"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
      {showDownload && onDownload && (
         <button
            onClick={handleDownload}
            className="absolute bottom-1.5 right-1.5 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-indigo-600/80 transition-all duration-200"
            aria-label="Download image"
            title="Download image"
          >
            <DownloadIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};