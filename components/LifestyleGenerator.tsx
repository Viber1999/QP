import React, { useState } from 'react';
import type { ImageData } from '../types';
import { ImageUploader } from './ImageUploader';
import { CloseIcon, SparklesIcon } from './IconComponents';
import { Spinner } from './Spinner';

interface LifestyleGeneratorProps {
  onUpload: (imageData: ImageData) => void;
  onGenerate: (prompt: string) => void;
  onRemove: () => void;
  isLoading: boolean;
  currentImage: ImageData | null;
}

type Mode = 'upload' | 'generate';

export const LifestyleGenerator: React.FC<LifestyleGeneratorProps> = ({ onUpload, onGenerate, onRemove, isLoading, currentImage }) => {
  const [mode, setMode] = useState<Mode>('generate');
  const [prompt, setPrompt] = useState<string>('A modern, sunlit kitchen counter with plants in the background');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(prompt);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="w-full h-80 bg-gray-800/50 rounded-b-xl rounded-tr-xl border-2 border-gray-700 flex flex-col items-center justify-center p-4">
          <Spinner />
          <p className="text-gray-400 mt-4 text-center">Generating your lifestyle scene...<br/>This may take a moment.</p>
        </div>
      );
    }
    if (currentImage && !isLoading) {
        return (
            <div className="relative w-full h-80 bg-gray-800/50 rounded-xl border-2 border-gray-700 flex items-center justify-center p-2">
                <img src={`data:${currentImage.mimeType};base64,${currentImage.base64}`} alt="Lifestyle scene" className="max-w-full max-h-full object-contain rounded-lg" />
                 <button
                    onClick={onRemove}
                    className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-white hover:bg-black/80 transition-colors duration-200"
                    aria-label="Remove lifestyle image"
                    title="Remove image"
                >
                    <CloseIcon className="h-5 w-5" />
                </button>
            </div>
        )
    }

    const TABS_CONTENT = {
      upload: <ImageUploader onImageUpload={onUpload} title="Upload Lifestyle Scene" currentImage={currentImage} />,
      generate: (
         <div className="w-full h-80 bg-gray-800/50 rounded-b-xl rounded-tr-xl border-2 border-l-0 border-gray-700 flex flex-col items-center justify-center p-6">
          <form onSubmit={handleSubmit} className="w-full flex flex-col h-full">
            <label htmlFor="prompt" className="font-semibold text-gray-300 mb-2 text-center">Describe the scene you want to create:</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full flex-grow p-2 bg-gray-900/50 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200 resize-none text-gray-200"
              placeholder="e.g., A rustic wooden table outdoors"
            />
            <button type="submit" className="mt-4 w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center">
              <SparklesIcon className="h-5 w-5 mr-2" />
              Generate Image
            </button>
          </form>
        </div>
      )
    };

    return TABS_CONTENT[mode];
  };

  return (
    <div className="w-full">
      {!currentImage && !isLoading && (
        <div className="flex justify-center border-b border-gray-700 mb-[-2px] z-10 relative">
          <button onClick={() => setMode('generate')} className={`px-6 py-2 font-semibold rounded-t-lg text-sm ${mode === 'generate' ? 'bg-gray-800 border-t border-l border-r border-gray-700 text-indigo-400' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'}`}>Generate</button>
          <button onClick={() => setMode('upload')} className={`px-6 py-2 font-semibold rounded-t-lg text-sm ${mode === 'upload' ? 'bg-gray-800 border-t border-l border-r border-gray-700 text-indigo-400' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'}`}>Upload</button>
        </div>
      )}
      {renderContent()}
    </div>
  );
};
