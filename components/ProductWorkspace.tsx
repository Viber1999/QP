import React, { useRef } from 'react';
import type { ProductData, StoredImageData, UploadableImageData } from '../types';
import { ImageUploader } from './ImageUploader';
import { CloseIcon, PlusIcon } from './IconComponents';

interface ProductWorkspaceProps {
  product: ProductData | null;
  onCreateProduct: (image: UploadableImageData) => void;
  onUpdateProduct: (product: ProductData) => void;
  onAddAngle: (image: UploadableImageData) => void;
  onDeleteAngle: (image: StoredImageData) => void;
  onDeselect: () => void;
  isBusy: boolean;
}

export const ProductWorkspace: React.FC<ProductWorkspaceProps> = ({ product, onCreateProduct, onUpdateProduct, onAddAngle, onDeleteAngle, onDeselect, isBusy }) => {
  const angleFileInputRef = useRef<HTMLInputElement>(null);

  const handleAngleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            const [header, base64] = result.split(',');
            const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
            onAddAngle({ base64, mimeType });
        };
        reader.readAsDataURL(file);
    }
    if (e.target) {
        e.target.value = '';
    }
  };

  const handleSetPrimary = (newPrimary: StoredImageData) => {
    if (!product || newPrimary.id === product.primaryImage.id) return;
    
    const oldPrimary = product.primaryImage;
    const newAngles = product.angleImages
      .filter(img => img.id !== newPrimary.id)
      .concat(oldPrimary);

    const updatedProduct = {
        ...product,
        primaryImage: newPrimary,
        angleImages: newAngles,
    };
    onUpdateProduct(updatedProduct);
  };

  if (!product) {
    return (
      <ImageUploader
        onImageUpload={onCreateProduct}
        title="Upload Product"
        currentImage={null}
      />
    );
  }

  return (
    <div className="w-full flex flex-col space-y-3">
        {/* Primary Image Display */}
        <div className="relative w-full h-64 bg-gray-800/50 rounded-xl border-2 border-gray-700 flex items-center justify-center p-2 group">
            <img src={product.primaryImage.url} alt="Primary product" className="max-w-full max-h-full object-contain rounded-lg" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-sm font-bold bg-black/50 px-2 py-1 rounded-md">Primary Image</span>
            </div>
            <button
                onClick={onDeselect}
                className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-white hover:bg-red-600/80 transition-colors duration-200"
                aria-label="Deselect product"
                title="Deselect product"
                disabled={isBusy}
            >
                <CloseIcon className="h-5 w-5" />
            </button>
        </div>

        {/* Angle Images Management */}
        <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-2 text-center">Additional Angles (for AI reference)</h3>
            <div className="grid grid-cols-4 gap-2">
                {product.angleImages.map(angle => (
                    <div 
                        key={angle.id}
                        className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer group transition-transform transform hover:scale-105"
                        onClick={() => handleSetPrimary(angle)}
                        title="Set as Primary"
                    >
                        <img src={angle.url} alt="Angle" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-center p-1">
                            <span className="text-white text-xs font-bold">Set Primary</span>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteAngle(angle);
                            }}
                            className="absolute top-1 right-1 bg-black/50 p-0.5 rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-red-600/80 transition-all duration-200"
                            aria-label="Delete angle"
                            title="Delete angle"
                        >
                            <CloseIcon className="h-3 w-3" />
                        </button>
                    </div>
                ))}
                <div className="aspect-square">
                    <button
                      onClick={() => !isBusy && angleFileInputRef.current?.click()}
                      className="w-full h-full bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-700 flex flex-col items-center justify-center text-gray-500 hover:border-indigo-600 hover:text-indigo-500 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-700 disabled:hover:text-gray-500"
                      disabled={isBusy}
                      aria-label="Add angle image"
                    >
                        <PlusIcon className="h-6 w-6" />
                        <span className="text-xs font-semibold mt-1">Add Angle</span>
                    </button>
                    <input
                      type="file"
                      ref={angleFileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleAngleFileChange}
                      disabled={isBusy}
                    />
                </div>
            </div>
        </div>
    </div>
  );
};
