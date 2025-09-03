import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { ImageData } from '../types';
import { UploadIcon, CloseIcon } from './IconComponents';

interface ImageUploaderProps {
  onImageUpload: (imageData: ImageData) => void;
  title: string;
  currentImage: ImageData | null;
  onRemove?: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, title, currentImage, onRemove }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentImage) {
      setPreviewUrl(`data:${currentImage.mimeType};base64,${currentImage.base64}`);
    } else {
      setPreviewUrl(null);
    }
  }, [currentImage]);

  const handleFileChange = useCallback((file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const [header, base64] = result.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
        onImageUpload({ base64, mimeType });
      };
      reader.readAsDataURL(file);
    }
  }, [onImageUpload]);

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };
  
  const handleRemoveClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove?.();
  }

  return (
    <div 
      className={`relative w-full h-80 bg-gray-800/50 rounded-xl border-2 border-dashed ${isDragging ? 'border-indigo-500 bg-indigo-900/20' : 'border-gray-700'} transition-all duration-300 flex items-center justify-center text-center p-4 ${!previewUrl && 'cursor-pointer hover:border-indigo-600'}`}
      onClick={() => !previewUrl && fileInputRef.current?.click()}
      onDragEnter={onDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
      />
      {previewUrl ? (
        <>
            <img src={previewUrl} alt={title} className="max-w-full max-h-full object-contain rounded-lg" />
            {onRemove && (
                 <button
                    onClick={handleRemoveClick}
                    className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-white hover:bg-red-600/80 transition-colors duration-200"
                    aria-label="Remove image"
                    title="Remove image"
                >
                    <CloseIcon className="h-5 w-5" />
                </button>
            )}
        </>
      ) : (
        <div className="flex flex-col items-center text-gray-500">
          <UploadIcon className="h-12 w-12 mb-2" />
          <span className="font-semibold">{title}</span>
          <p className="text-sm">Drag & drop or click to upload</p>
        </div>
      )}
    </div>
  );
};