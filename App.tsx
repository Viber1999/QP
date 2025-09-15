import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { LifestyleGenerator } from './components/LifestyleGenerator';
import { ResultDisplay } from './components/ResultDisplay';
import { Header } from './components/Header';
import { ArrowIcon, SparklesIcon, VideoIcon } from './components/IconComponents';
import { Sidebar, Tab } from './components/Sidebar';
import { ProductWorkspace } from './components/ProductWorkspace';
import { generateLifestyleImage, combineImages, generateVideo } from './services/geminiService';
import { urlToUploadableImageData, base64ToBlob } from './utils/dataUtils';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { VideoPreviewModal } from './components/VideoPreviewModal';
import type { UploadableImageData, StoredImageData, StoredVideoData, ProductData } from './types';
import { Spinner } from './components/Spinner';
import { ToggleSwitch } from './components/ToggleSwitch';
import { VideoResultDisplay } from './components/VideoResultDisplay';

const App: React.FC = () => {
  // Workspace state
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
  const [lifestyleImage, setLifestyleImage] = useState<StoredImageData | null>(null);
  const [generatedImage, setGeneratedImage] = useState<StoredImageData | null>(null);
  
  // History state
  const [productHistory, setProductHistory] = useState<ProductData[]>([]);
  const [lifestyleHistory, setLifestyleHistory] = useState<StoredImageData[]>([]);
  const [resultHistory, setGeneratedHistory] = useState<StoredImageData[]>([]);
  const [videoHistory, setVideoHistory] = useState<StoredVideoData[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [combinationModel, setCombinationModel] = useState<'gemini' | 'qwen'>('gemini');
  const [combinationPrompt, setCombinationPrompt] = useState<string>('Place these glasses in scene, replace existing glasses if present.');
  const [videoPrompt, setVideoPrompt] = useState<string>('Make the scene cinematic with a gentle camera pan from left to right.');
  const [isLoadingLifestyle, setIsLoadingLifestyle] = useState<boolean>(false);
  const [isLoadingResult, setIsLoadingResult] = useState<boolean>(false);
  const [resultStatus, setResultStatus] = useState<string | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState<boolean>(false);
  const [videoGenerationStatus, setVideoGenerationStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<StoredImageData | null>(null);
  const [previewVideo, setPreviewVideo] = useState<StoredVideoData | null>(null);
  
  const uploadableToStoredImage = (image: UploadableImageData): StoredImageData => {
    const imageBlob = base64ToBlob(image.base64, image.mimeType);
    const url = URL.createObjectURL(imageBlob);
    return { id: crypto.randomUUID(), url, mimeType: image.mimeType };
  };

  const handleCreateProduct = useCallback(async (image: UploadableImageData) => {
    const newStoredImage = uploadableToStoredImage(image);
    const newProduct: ProductData = {
      id: crypto.randomUUID(),
      primaryImage: newStoredImage,
      angleImages: [],
    };
    setSelectedProduct(newProduct);
    setProductHistory(prev => [newProduct, ...prev]);
  }, []);

  const handleAddAngle = useCallback(async (image: UploadableImageData) => {
    if (!selectedProduct) {
      setError('No product selected to add an angle to.');
      return;
    }
    const newAngle = uploadableToStoredImage(image);
    const updatedProduct = {
      ...selectedProduct,
      angleImages: [...selectedProduct.angleImages, newAngle],
    };
    setSelectedProduct(updatedProduct);
    setProductHistory(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  }, [selectedProduct]);
  
  const handleUpdateProduct = useCallback((updatedProduct: ProductData) => {
    setSelectedProduct(updatedProduct);
    setProductHistory(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  }, []);
  
  const handleDeleteAngle = useCallback((angleToDelete: StoredImageData) => {
    if (!selectedProduct) return;
    URL.revokeObjectURL(angleToDelete.url);
    const updatedProduct = {
        ...selectedProduct,
        angleImages: selectedProduct.angleImages.filter(img => img.id !== angleToDelete.id),
    };
    handleUpdateProduct(updatedProduct);
  }, [selectedProduct, handleUpdateProduct]);

  const handleDeselectProduct = useCallback(() => {
    setSelectedProduct(null);
  }, []);

  const handleLifestyleUpload = useCallback(async (image: UploadableImageData) => {
    const storedImage = uploadableToStoredImage(image);
    setLifestyleImage(storedImage);
    setLifestyleHistory(prev => [storedImage, ...prev.filter(img => img.id !== storedImage.id)]);
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
      const storedImage = uploadableToStoredImage(imageData);
      setLifestyleImage(storedImage);
      setLifestyleHistory(prev => [storedImage, ...prev]);
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
  
  const handleDeleteProduct = useCallback(async (productToDelete: ProductData) => {
    setProductHistory(prev => prev.filter(p => p.id !== productToDelete.id));
    if (selectedProduct?.id === productToDelete.id) {
      setSelectedProduct(null);
    }
    // Revoke blob URLs to prevent memory leaks
    URL.revokeObjectURL(productToDelete.primaryImage.url);
    productToDelete.angleImages.forEach(img => URL.revokeObjectURL(img.url));
  }, [selectedProduct]);

  const handleDeleteLifestyle = useCallback(async (imageToDelete: StoredImageData) => {
    setLifestyleHistory(prev => prev.filter(l => l.id !== imageToDelete.id));
    if (lifestyleImage?.id === imageToDelete.id) {
      setLifestyleImage(null);
    }
    URL.revokeObjectURL(imageToDelete.url);
  }, [lifestyleImage]);

  const handleDeleteResult = useCallback(async(imageToDelete: StoredImageData) => {
    setGeneratedHistory(prev => prev.filter(r => r.id !== imageToDelete.id));
    if (generatedImage?.id === imageToDelete.id) {
      setGeneratedImage(null);
    }
    if (previewImage?.id === imageToDelete.id) {
      setPreviewImage(null);
    }
    URL.revokeObjectURL(imageToDelete.url);
  }, [generatedImage, previewImage]);

  const handleCombine = useCallback(async () => {
    if (!selectedProduct || !lifestyleImage) {
      setError('Please select a product and a lifestyle image from the workspace.');
      return;
    }
    setIsLoadingResult(true);
    setGeneratedImage(null);
    setError(null);
    try {
      setResultStatus("Preparing images...");
      const [primaryProductForApi, lifestyleForApi, ...angleImagesForApi] = await Promise.all([
          urlToUploadableImageData(selectedProduct.primaryImage.url),
          urlToUploadableImageData(lifestyleImage.url),
          ...selectedProduct.angleImages.map(img => urlToUploadableImageData(img.url)),
      ]);

      setResultStatus("Combining images with Gemini...");
      const finalImage = await combineImages(primaryProductForApi, angleImagesForApi, lifestyleForApi, combinationPrompt, combinationModel);
      
      setResultStatus("Saving final image...");
      const storedImage = uploadableToStoredImage(finalImage);

      setGeneratedImage(storedImage);
      setGeneratedHistory(prev => [storedImage, ...prev]);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to combine images. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoadingResult(false);
      setResultStatus(null);
    }
  }, [selectedProduct, lifestyleImage, combinationPrompt, combinationModel]);

  const handleGenerateVideo = useCallback(async () => {
    if (!generatedImage) {
        setError('Please create a final scene image first before generating a video.');
        return;
    }
    if (!videoPrompt) {
        setError('Please enter a prompt to describe the video.');
        return;
    }

    setIsLoadingVideo(true);
    setVideoGenerationStatus('Initializing video generation...');
    setError(null);
    
    try {
        const imageForApi = await urlToUploadableImageData(generatedImage.url);
        const videoBlob = await generateVideo(imageForApi, videoPrompt, setVideoGenerationStatus);
        
        const url = URL.createObjectURL(videoBlob);
        const newVideo: StoredVideoData = { id: crypto.randomUUID(), url, prompt: videoPrompt };

        setVideoHistory(prev => [newVideo, ...prev]);
        setActiveTab('videos'); 
        setTimeout(() => setVideoGenerationStatus(null), 5000);
    } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : 'Failed to generate video. Please try again.';
        setError(errorMessage);
        setVideoGenerationStatus(`Error: ${errorMessage}`);
    } finally {
        setIsLoadingVideo(false);
    }
  }, [generatedImage, videoPrompt]);

  const handleDeleteVideo = useCallback(async (videoToDelete: StoredVideoData) => {
      setVideoHistory(prev => prev.filter(v => v.id !== videoToDelete.id));
      if (previewVideo?.id === videoToDelete.id) {
          setPreviewVideo(null);
      }
      URL.revokeObjectURL(videoToDelete.url);
  }, [previewVideo]);

  const handleOpenImagePreview = (image: StoredImageData) => setPreviewImage(image);
  const handleCloseImagePreview = () => setPreviewImage(null);
  const handleOpenVideoPreview = (video: StoredVideoData) => setPreviewVideo(video);
  const handleCloseVideoPreview = () => setPreviewVideo(null);

  const handleSelectAndPreviewResult = (image: StoredImageData) => {
    setGeneratedImage(image);
    handleOpenImagePreview(image);
  };
  
  const isReadyToCombine = useMemo(() => selectedProduct && lifestyleImage, [selectedProduct, lifestyleImage]);
  const isBusy = useMemo(() => isLoadingResult || isLoadingLifestyle || isLoadingVideo, [isLoadingResult, isLoadingLifestyle, isLoadingVideo]);

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
          videoHistory={videoHistory}
          onSelectProduct={setSelectedProduct}
          onSelectLifestyle={setLifestyleImage}
          onSelectResult={handleSelectAndPreviewResult}
          onSelectVideo={handleOpenVideoPreview}
          onProductUpload={handleCreateProduct}
          onLifestyleUpload={handleLifestyleUpload}
          onDeleteProduct={handleDeleteProduct}
          onDeleteLifestyle={handleDeleteLifestyle}
          onDeleteResult={handleDeleteResult}
          onDeleteVideo={handleDeleteVideo}
        />
        <main className="flex-grow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            
            <div className="flex flex-col space-y-4">
              <h2 className="text-2xl font-bold text-gray-300 text-center">1. Product Image</h2>
              <ProductWorkspace
                product={selectedProduct}
                onCreateProduct={handleCreateProduct}
                onUpdateProduct={handleUpdateProduct}
                onAddAngle={handleAddAngle}
                onDeleteAngle={handleDeleteAngle}
                onDeselect={handleDeselectProduct}
                isBusy={isBusy}
              />
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
                loadingText={resultStatus}
                onPreview={generatedImage ? () => handleOpenImagePreview(generatedImage) : undefined}
              />
            </div>
          </div>

          <div className="mt-6 max-w-2xl mx-auto">
             <div className="mb-4">
                <label className="block text-lg font-semibold text-gray-300 text-center mb-3">
                  Image Combination Model
                </label>
                <ToggleSwitch
                  option1="Gemini"
                  option2="Qwen"
                  value={combinationModel}
                  onChange={setCombinationModel as (val: 'gemini' | 'qwen') => void}
                  disabled={isBusy}
                />
             </div>
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
                  disabled={isBusy}
                />
             </div>
          </div>
          
          <div className="mt-6 text-center">
              <button
                onClick={handleCombine}
                disabled={!isReadyToCombine || isBusy}
                className="bg-indigo-600 text-white font-bold text-lg py-4 px-10 rounded-full shadow-lg hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-105 disabled:scale-100 flex items-center justify-center mx-auto"
              >
                {isLoadingResult ? (
                  <span>{resultStatus || 'Creating Scene...'}</span>
                ) : (
                  <>
                    <span>Create Magic Scene</span>
                    <ArrowIcon className="ml-3 h-6 w-6" />
                  </>
                )}
              </button>
          </div>

          {generatedImage && (
            <div className="mt-8 pt-8 border-t border-gray-700/50 max-w-2xl mx-auto">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-300 flex items-center justify-center gap-3">
                  <VideoIcon className="h-6 w-6 text-green-400" />
                  4. Animate Your Scene
                </h3>
              </div>
              <div>
                <label htmlFor="video-prompt" className="block text-lg font-semibold text-gray-300 text-center mb-2">
                  Describe the motion
                </label>
                <textarea
                  id="video-prompt"
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200 resize-y"
                  rows={2}
                  placeholder="e.g., A slow zoom-in on the product..."
                  disabled={isLoadingVideo}
                />
              </div>
              <div className="mt-4 text-center">
                <button
                  onClick={handleGenerateVideo}
                  disabled={isBusy}
                  className="bg-green-600 text-white font-bold text-lg py-3 px-8 rounded-full shadow-lg hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-105 disabled:scale-100 flex items-center justify-center mx-auto"
                >
                  {isLoadingVideo ? (
                    <Spinner />
                  ) : (
                    <>
                      <span>Generate Video</span>
                      <VideoIcon className="ml-3 h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
              
              {videoGenerationStatus && (
                <div className="mt-6 text-center bg-gray-800 border border-gray-700 text-gray-300 px-4 py-3 rounded-lg" role="status">
                  <div className="flex items-center justify-center">
                    {isLoadingVideo && <Spinner />}
                    <span className="ml-3 font-semibold">{videoGenerationStatus}</span>
                  </div>
                </div>
              )}
    
              {error && (
                <div className="mt-6 text-center bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">
                  <strong className="font-bold">Error: </strong>
                  <span className="block sm:inline">{error}</span>
                </div>
              )}

              {videoHistory.length > 0 && !isLoadingVideo && (
                <div className="mt-6">
                    <h4 className="text-lg font-bold text-gray-300 text-center mb-2">Latest Video</h4>
                    <VideoResultDisplay
                        video={videoHistory[0]}
                        onPreview={() => handleOpenVideoPreview(videoHistory[0])}
                    />
                </div>
              )}
            </div>
          )}

        </main>
      </div>
      <ImagePreviewModal image={previewImage} onClose={handleCloseImagePreview} />
      <VideoPreviewModal video={previewVideo} onClose={handleCloseVideoPreview} />
    </div>
  );
};

export default App;
