import React from 'react';
import type { StoredVideoData } from '../types';

interface VideoResultDisplayProps {
  video: StoredVideoData;
  onPreview: () => void;
}

export const VideoResultDisplay: React.FC<VideoResultDisplayProps> = ({ video, onPreview }) => {
  return (
    <div className="w-full bg-gray-800/50 rounded-xl border-2 border-gray-700 flex flex-col items-center p-2 group">
        <video
          key={video.id}
          src={video.url}
          className="w-full aspect-video object-contain rounded-lg bg-black"
          controls
          autoPlay
          loop
          muted
        />
        <div className="w-full flex justify-between items-center mt-2 px-1">
             <p className="text-xs text-gray-400 text-left truncate flex-grow mr-2" title={video.prompt}>
              <span className="font-semibold">Prompt:</span> {video.prompt}
            </p>
            <button 
              onClick={onPreview} 
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex-shrink-0 whitespace-nowrap"
            >
                Preview Fullscreen
            </button>
        </div>
    </div>
  );
};
