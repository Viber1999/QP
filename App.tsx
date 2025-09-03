import React, { useState, useCallback, useMemo } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { LifestyleGenerator } from './components/LifestyleGenerator';
import { ResultDisplay } from './components/ResultDisplay';
import { Header } from './components/Header';
import { ArrowIcon } from './components/IconComponents';
import { Sidebar, Tab } from './components/Sidebar';
import { generateLifestyleImage, combineImages } from './services/geminiService';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import type { ImageData, Resolution } from './types';

const RESOLUTION_OPTIONS: Resolution[] = [
  { label: '200x200', width: 200, height: 200 },
  { label: '500x500', width: 500, height: 500 },
  { label: '2000x2000', width: 2000, height: 2000 },
];

const App: React.FC = () => {
  // Workspace state
  const [productImage, setProductImage] = useState<ImageData | null>(null);
  const [lifestyleImage, setLifestyleImage] = useState<ImageData | null>(null);
  const [generatedImage, setGeneratedImage] = useState<ImageData | null>(null);
  
  // History state
  const [productHistory, setProductHistory] = useState<ImageData[]>([]);
  const [lifestyleHistory, setLifestyleHistory] = useState<ImageData[]>([]);
  const [resultHistory, setGeneratedHistory] = useState<ImageData[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [combinationPrompt, setCombinationPrompt] = useState<string>('Place these glasses in scene, replace existing glasses if present.');
  const [selectedResolution, setSelectedResolution] = useState<Resolution>(RESOLUTION_OPTIONS[1]);
  const [isLoadingLifestyle, setIsLoadingLifestyle] = useState<boolean>(false);
  const [isLoadingResult, setIsLoadingResult] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<ImageData | null>(null);

  const handleProductUpload = useCallback((image: ImageData) => {
    setProductImage(image);
    setProductHistory(prev => [image, ...prev.filter(img => img.base64 !== image.base64)]);
  }, []);

  const handleRemoveProductImage = useCallback(() => {
    setProductImage(null);
  }, []);

  const handleLifestyleUpload = useCallback((image: ImageData) => {
    setLifestyleImage(image);
    setLifestyleHistory(prev => [image, ...prev.filter(img => img.base64 !== image.base64)]);
  }, []);

  const handleGenerateLifestyle = useCallback(async (prompt: string) => {
    if (!prompt) {
      setError('Please enter a prompt to generate an image.');
      return;
    }
    setIsLoadingLifestyle(true);
    setLifestyleImage(null);
    setError(null);
    try {
      const imageData = await generateLifestyleImage(prompt);
      setLifestyleImage(imageData);
      setLifestyleHistory(prev => [imageData, ...prev]);
    } catch (e) {
      console.error(e);
      setError('Failed to generate lifestyle image. Please try again.');
    } finally {
      setIsLoadingLifestyle(false);
    }
  }, []);

  const handleRemoveLifestyle = useCallback(() => {
    setLifestyleImage(null);
  }, []);
  
  const handleDeleteProduct = useCallback((imageToDelete: ImageData) => {
    setProductHistory(prev => prev.filter(p => p.base64 !== imageToDelete.base64));
    if (productImage?.base64 === imageToDelete.base64) {
      setProductImage(null);
    }
  }, [productImage]);

  const handleDeleteLifestyle = useCallback((imageToDelete: ImageData) => {
    setLifestyleHistory(prev => prev.filter(l => l.base64 !== imageToDelete.base64));
    if (lifestyleImage?.base64 === imageToDelete.base64) {
      setLifestyleImage(null);
    }
  }, [lifestyleImage]);

  const handleDeleteResult = useCallback((imageToDelete: ImageData) => {
    setGeneratedHistory(prev => prev.filter(r => r.base64 !== imageToDelete.base64));
    if (generatedImage?.base64 === imageToDelete.base64) {
      setGeneratedImage(null);
    }
    if (previewImage?.base64 === imageToDelete.base64) {
      setPreviewImage(null);
    }
  }, [generatedImage, previewImage]);


  const handleCombine = useCallback(async () => {
    if (!productImage || !lifestyleImage) {
      setError('Please select a product and a lifestyle image from the workspace.');
      return;
    }
    setIsLoadingResult(true);
    setGeneratedImage(null);
    setError(null);
    try {
      const finalImage = await combineImages(productImage, lifestyleImage, combinationPrompt, selectedResolution);
      setGeneratedImage(finalImage);
      setGeneratedHistory(prev => [finalImage, ...prev]);
    } catch (e) {
      console.error(e);
      setError('Failed to combine images. Please try again.');
    } finally {
      setIsLoadingResult(false);
    }
  }, [productImage, lifestyleImage, combinationPrompt, selectedResolution]);
  
  const handleOpenPreview = (image: ImageData) => setPreviewImage(image);
  const handleClosePreview = () => setPreviewImage(null);

  const handleSelectAndPreviewResult = (image: ImageData) => {
    setGeneratedImage(image);
    handleOpenPreview(image);
  };
  
  const isReadyToCombine = useMemo(() => productImage && lifestyleImage, [productImage, lifestyleImage]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col">
      <Header />
      <div className="flex-grow flex">
        <Sidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          productHistory={productHistory}
          lifestyleHistory={lifestyleHistory}
          resultHistory={resultHistory}
          onSelectProduct={setProductImage}
          onSelectLifestyle={setLifestyleImage}
          onSelectResult={handleSelectAndPreviewResult}
          onProductUpload={handleProductUpload}
          onLifestyleUpload={handleLifestyleUpload}
          onDeleteProduct={handleDeleteProduct}
          onDeleteLifestyle={handleDeleteLifestyle}
          onDeleteResult={handleDeleteResult}
        />
        <main className="flex-grow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="flex flex-col space-y-4">
              <h2 className="text-2xl font-bold text-gray-300 text-center">1. Product Image</h2>
              <ImageUploader onImageUpload={handleProductUpload} title="Upload Product" currentImage={productImage} onRemove={handleRemoveProductImage} />
            </div>
            <div className="flex flex-col space-y-4">
              <h2 className="text-2xl font-bold text-gray-300 text-center">2. Lifestyle Scene</h2>
              <LifestyleGenerator
                onUpload={handleLifestyleUpload}
                onGenerate={handleGenerateLifestyle}
                onRemove={handleRemoveLifestyle}
                isLoading={isLoadingLifestyle}
                currentImage={lifestyleImage}
              />
            </div>
            <div className="flex flex-col space-y-4">
              <h2 className="text-2xl font-bold text-gray-300 text-center">3. Final Result</h2>
              <ResultDisplay
                image={generatedImage}
                isLoading={isLoadingResult}
                onPreview={generatedImage ? () => handleOpenPreview(generatedImage) : undefined}
              />
            </div>
          </div>

          <div className="mt-6 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
             <div>
                <label htmlFor="combination-prompt" className="block text-lg font-semibold text-gray-300 text-center mb-2">
                  Refine the Scene (Optional)
                </label>
                <textarea
                  id="combination-prompt"
                  value={combinationPrompt}
                  onChange={(e) => setCombinationPrompt(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200 resize-y"
                  rows={2}
                  placeholder="e.g., Place the product on the table..."
                />
             </div>
             <div>
                <label className="block text-lg font-semibold text-gray-300 text-center mb-2">
                  Output Resolution
                </label>
                <div className="flex justify-center space-x-2 bg-gray-800 p-1.5 rounded-lg border border-gray-700">
                  {RESOLUTION_OPTIONS.map(res => (
                    <button
                      key={res.label}
                      onClick={() => setSelectedResolution(res)}
                      className={`w-full px-4 py-2 text-sm font-bold rounded-md transition-colors duration-200 ${selectedResolution.label === res.label ? 'bg-indigo-600 text-white' : 'bg-transparent text-gray-400 hover:bg-gray-700'}`}
                    >
                      {res.label}
                    </button>
                  ))}
                </div>
             </div>
          </div>
          
          {error && (
            <div className="mt-6 text-center bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <div className="mt-6 text-center">
              <button
                onClick={handleCombine}
                disabled={!isReadyToCombine || isLoadingResult || isLoadingLifestyle}
                className="bg-indigo-600 text-white font-bold text-lg py-4 px-10 rounded-full shadow-lg hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-105 disabled:scale-100 flex items-center justify-center mx-auto"
              >
                {isLoadingResult ? (
                  <span>Creating Scene...</span>
                ) : (
                  <>
                    <span>Create Magic Scene</span>
                    <ArrowIcon className="ml-3 h-6 w-6" />
                  </>
                )}
              </button>
          </div>
        </main>
      </div>
      <ImagePreviewModal image={previewImage} onClose={handleClosePreview} />
    </div>
  );
};

export default App;