import React, { useRef } from 'react';
import type { UploadableImageData, StoredImageData, StoredVideoData, ProductData } from '../types';
import { ImageThumbnail } from './ImageThumbnail';
import { VideoThumbnail } from './VideoThumbnail';
import { ProductIcon, LandscapeIcon, CollectionIcon, PlusIcon, VideoIcon } from './IconComponents';

export type Tab = 'products' | 'lifestyles' | 'results' | 'videos';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  productHistory: ProductData[];
  lifestyleHistory: StoredImageData[];
  resultHistory: StoredImageData[];
  videoHistory: StoredVideoData[];
  onSelectProduct: (product: ProductData) => void;
  onSelectLifestyle: (image: StoredImageData) => void;
  onSelectResult: (image: StoredImageData) => void;
  onSelectVideo: (video: StoredVideoData) => void;
  onProductUpload: (image: UploadableImageData) => void;
  onLifestyleUpload: (image: UploadableImageData) => void;
  onDeleteProduct: (product: ProductData) => void;
  onDeleteLifestyle: (image: StoredImageData) => void;
  onDeleteResult: (image: StoredImageData) => void;
  onDeleteVideo: (video: StoredVideoData) => void;
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

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleDownloadImage = (image: StoredImageData) => {
    if (!image) return;
    const link = document.createElement('a');
    link.href = image.url;
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
  
  const renderContent = () => {
      switch (activeTab) {
        case 'products':
          return productHistory.map((product) => (
              <ImageThumbnail
                key={product.id}
                image={product.primaryImage}
                onClick={() => onSelectProduct(product)}
                onDelete={() => onDeleteProduct(product)}
                angleCount={product.angleImages.length}
              />
          ));
        case 'lifestyles':
            return lifestyleHistory.map((image) => (
                <ImageThumbnail key={image.id} image={image} onClick={() => onSelectLifestyle(image)} onDelete={() => onDeleteLifestyle(image)} />
            ));
        case 'results':
            return resultHistory.map((image) => (
                <ImageThumbnail
                    key={image.id}
                    image={image}
                    onClick={() => onSelectResult(image)}
                    onDelete={() => onDeleteResult(image)}
                    onDownload={() => handleDownloadImage(image)}
                    showDownload={true}
                />
            ));
        case 'videos':
            return videoHistory.map((video) => (
                <VideoThumbnail key={video.id} video={video} onClick={() => onSelectVideo(video)} onDelete={() => onDeleteVideo(video)} />
            ));
        default:
            return null;
      }
  }
  
  const currentHistory = {
      products: productHistory,
      lifestyles: lifestyleHistory,
      results: resultHistory,
      videos: videoHistory,
  }[activeTab];

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
              <span className="text-sm font-semibold">{activeTab === 'products' ? 'Add Product' : 'Add Image'}</span>
            </button>
          )}
          
          {renderContent()}

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
