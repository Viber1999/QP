import React, { useRef } from 'react';
import type { ImageData, VideoData } from '../types';
import { ImageThumbnail } from './ImageThumbnail';
import { VideoThumbnail } from './VideoThumbnail';
import { ProductIcon, LandscapeIcon, CollectionIcon, PlusIcon, VideoIcon } from './IconComponents';

export type Tab = 'products' | 'lifestyles' | 'results' | 'videos';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  productHistory: ImageData[];
  lifestyleHistory: ImageData[];
  resultHistory: ImageData[];
  videoHistory: VideoData[];
  onSelectProduct: (image: ImageData) => void;
  onSelectLifestyle: (image: ImageData) => void;
  onSelectResult: (image: ImageData) => void;
  onSelectVideo: (video: VideoData) => void;
  onProductUpload: (image: ImageData) => void;
  onLifestyleUpload: (image: ImageData) => void;
  onDeleteProduct: (image: ImageData) => void;
  onDeleteLifestyle: (image: ImageData) => void;
  onDeleteResult: (image: ImageData) => void;
  onDeleteVideo: (video: VideoData) => void;
}

const TABS: { id: Tab; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { id: 'products', label: 'Products', icon: ProductIcon },
    { id: 'lifestyles', label: 'Lifestyles', icon: LandscapeIcon },
    { id: 'results', label: 'Results', icon: CollectionIcon },
    { id: 'videos', label: 'Videos', icon: VideoIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  productHistory,
  lifestyleHistory,
  resultHistory,
  videoHistory,
  onSelectProduct,
  onSelectLifestyle,
  onSelectResult,
  onSelectVideo,
  onProductUpload,
  onLifestyleUpload,
  onDeleteProduct,
  onDeleteLifestyle,
  onDeleteResult,
  onDeleteVideo,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageHistories = {
    products: productHistory,
    lifestyles: lifestyleHistory,
    results: resultHistory,
  };

  const imageSelectors = {
    products: onSelectProduct,
    lifestyles: onSelectLifestyle,
    results: onSelectResult,
  };
  
  const imageDeleteHandlers = {
    products: onDeleteProduct,
    lifestyles: onDeleteLifestyle,
    results: onDeleteResult,
  };

  const currentHistory = activeTab === 'videos' ? videoHistory : imageHistories[activeTab];

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleDownloadImage = (image: ImageData) => {
    if (!image) return;
    const link = document.createElement('a');
    link.href = `data:${image.mimeType};base64,${image.base64}`;
    link.download = `product-scene-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const [header, base64] = result.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
        const newImage = { base64, mimeType };

        if (activeTab === 'products') {
          onProductUpload(newImage);
        } else if (activeTab === 'lifestyles') {
          onLifestyleUpload(newImage);
        }
      };
      reader.readAsDataURL(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  return (
    <aside className="w-80 bg-gray-900/60 border-r border-gray-700/50 flex flex-col">
      <div className="flex justify-around border-b border-gray-700/50 p-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center justify-center p-2 rounded-lg w-full transition-colors duration-200 ${
              activeTab === id ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'
            }`}
            aria-label={`Open ${label} tab`}
          >
            <Icon className="h-6 w-6 mb-1" />
            <span className="text-xs font-bold">{label}</span>
          </button>
        ))}
      </div>
      <div className="flex-grow p-4 overflow-y-auto">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        <div className="grid grid-cols-2 gap-4">
          {(activeTab === 'products' || activeTab === 'lifestyles') && (
            <button
              onClick={handleUploadClick}
              className="aspect-square bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-700 flex flex-col items-center justify-center text-gray-500 hover:border-indigo-600 hover:text-indigo-500 transition-colors duration-200"
            >
              <PlusIcon className="h-8 w-8 mb-1" />
              <span className="text-sm font-semibold">Add Image</span>
            </button>
          )}
          
          {(activeTab === 'products' || activeTab === 'lifestyles' || activeTab === 'results') &&
            imageHistories[activeTab].map((image) => (
              <ImageThumbnail
                key={image.base64}
                image={image}
                onClick={() => imageSelectors[activeTab](image)}
                onDelete={() => imageDeleteHandlers[activeTab](image)}
                onDownload={() => handleDownloadImage(image)}
                showDownload={activeTab === 'results'}
              />
          ))}

          {activeTab === 'videos' &&
            videoHistory.map((video) => (
              <VideoThumbnail
                key={video.id}
                video={video}
                onClick={() => onSelectVideo(video)}
                onDelete={() => onDeleteVideo(video)}
              />
          ))}
        </div>
        {currentHistory.length === 0 && (activeTab === 'results' || activeTab === 'videos') && (
          <div className="flex items-center justify-center h-full text-center text-gray-600">
            <p>Your {activeTab} will appear here.</p>
          </div>
        )}
      </div>
    </aside>
  );
};
