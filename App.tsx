import React, { useState, useCallback, useMemo } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { LifestyleGenerator } from './components/LifestyleGenerator';
import { ResultDisplay } from './components/ResultDisplay';
import { Header } from './components/Header';
import { ArrowIcon, SparklesIcon, VideoIcon } from './components/IconComponents';
import { Sidebar, Tab } from './components/Sidebar';
import { generateLifestyleImage, combineImages, removeImageBackground, generateVideo } from './services/geminiService';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { VideoPreviewModal } from './components/VideoPreviewModal';
import type { ImageData, VideoData } from './types';
import { Spinner } from './components/Spinner';
import { ToggleSwitch } from './components/ToggleSwitch';
import { VideoResultDisplay } from './components/VideoResultDisplay';

const App: React.FC = () => {
  // Workspace state
  const [productImage, setProductImage] = useState<ImageData | null>(null);
  const [lifestyleImage, setLifestyleImage] = useState<ImageData | null>(null);
  const [generatedImage, setGeneratedImage] = useState<ImageData | null>(null);
  
  // History state
  const [productHistory, setProductHistory] = useState<ImageData[]>([]);
  const [lifestyleHistory, setLifestyleHistory] = useState<ImageData[]>([]);
  const [resultHistory, setGeneratedHistory] = useState<ImageData[]>([]);
  const [videoHistory, setVideoHistory] = useState<VideoData[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [combinationModel, setCombinationModel] = useState<'gemini' | 'qwen'>('gemini');
  const [combinationPrompt, setCombinationPrompt] = useState<string>('Place these glasses in scene, replace existing glasses if present.');
  const [videoPrompt, setVideoPrompt] = useState<string>('Make the scene cinematic with a gentle camera pan from left to right.');
  const [isLoadingLifestyle, setIsLoadingLifestyle] = useState<boolean>(false);
  const [isLoadingResult, setIsLoadingResult] = useState<boolean>(false);
  const [isLoadingBackgroundRemoval, setIsLoadingBackgroundRemoval] = useState<boolean>(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState<boolean>(false);
  const [videoGenerationStatus, setVideoGenerationStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<ImageData | null>(null);
  const [previewVideo, setPreviewVideo] = useState<VideoData | null>(null);

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

  const handleRemoveBackground = useCallback(async () => {
    if (!productImage) {
      setError('Please select a product image first.');
      return;
    }
    setIsLoadingBackgroundRemoval(true);
    setError(null);
    const originalImage = productImage; // Keep original for history update

    try {
      const newImage = await removeImageBackground(productImage);
      setProductImage(newImage);
      // Update history as well
      setProductHistory(prev => 
        prev.map(img => img.base64 === originalImage.base64 ? newImage : img)
      );
    } catch (e) {
      console.error(e);
      setError('Failed to remove background. Please try again.');
    } finally {
      setIsLoadingBackgroundRemoval(false);
    }
  }, [productImage]);

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
      const finalImage = await combineImages(productImage, lifestyleImage, combinationPrompt, combinationModel);
      setGeneratedImage(finalImage);
      setGeneratedHistory(prev => [finalImage, ...prev]);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to combine images. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoadingResult(false);
    }
  }, [productImage, lifestyleImage, combinationPrompt, combinationModel]);

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
    let success = false;
    
    try {
        const videoBlob = await generateVideo(generatedImage, videoPrompt, (status) => {
            setVideoGenerationStatus(status);
        });
        const url = URL.createObjectURL(videoBlob);
        const newVideo: VideoData = {
            id: Date.now().toString(),
            url,
            prompt: videoPrompt,
        };
        setVideoHistory(prev => [newVideo, ...prev]);
        setActiveTab('videos'); // Switch to videos tab to show the result
        success = true;
    } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : 'Failed to generate video. Please try again.';
        setError(errorMessage);
        setVideoGenerationStatus(`Error: ${errorMessage}`);
        success = false;
    } finally {
        setIsLoadingVideo(false);
        // Keep status message on error, otherwise clear it after a delay on success
        if (success) {
            setTimeout(() => setVideoGenerationStatus(null), 5000);
        }
    }
  }, [generatedImage, videoPrompt]);

  const handleDeleteVideo = useCallback((videoToDelete: VideoData) => {
      setVideoHistory(prev => prev.filter(v => v.id !== videoToDelete.id));
      URL.revokeObjectURL(videoToDelete.url); // Clean up blob URL
      if (previewVideo?.id === videoToDelete.id) {
          setPreviewVideo(null);
      }
  }, [previewVideo]);

  const handleOpenImagePreview = (image: ImageData) => setPreviewImage(image);
  const handleCloseImagePreview = () => setPreviewImage(null);
  const handleOpenVideoPreview = (video: VideoData) => setPreviewVideo(video);
  const handleCloseVideoPreview = () => setPreviewVideo(null);

  const handleSelectAndPreviewResult = (image: ImageData) => {
    setGeneratedImage(image);
    handleOpenImagePreview(image);
  };
  
  const isReadyToCombine = useMemo(() => productImage && lifestyleImage, [productImage, lifestyleImage]);
  const isBusy = useMemo(() => isLoadingResult || isLoadingLifestyle || isLoadingBackgroundRemoval || isLoadingVideo, [isLoadingResult, isLoadingLifestyle, isLoadingBackgroundRemoval, isLoadingVideo]);

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
          onSelectProduct={setProductImage}
          onSelectLifestyle={setLifestyleImage}
          onSelectResult={handleSelectAndPreviewResult}
          onSelectVideo={handleOpenVideoPreview}
          onProductUpload={handleProductUpload}
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
              <div className="relative">
                <ImageUploader onImageUpload={handleProductUpload} title="Upload Product" currentImage={productImage} onRemove={handleRemoveProductImage} />
                {isLoadingBackgroundRemoval && (
                  <div className="absolute inset-0 bg-gray-900/80 rounded-xl flex flex-col items-center justify-center z-10">
                    <Spinner />
                    <p className="text-gray-400 mt-4 text-center">Removing background...</p>
                  </div>
                )}
              </div>
               {productImage && (
                <button
                  onClick={handleRemoveBackground}
                  disabled={isBusy}
                  className="w-full bg-gray-700 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-gray-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center shadow-md"
                >
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  Remove Background
                </button>
              )}
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
                  <span>Creating Scene...</span>
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
    
              {error && !videoGenerationStatus && (
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