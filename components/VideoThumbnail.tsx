import React from 'react';
import type { StoredVideoData } from '../types';
import { CloseIcon } from './IconComponents';

interface VideoThumbnailProps {
  video: StoredVideoData;
  onClick: () => void;
  onDelete: () => void;
}

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({ video, onClick, onDelete }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden cursor-pointer group transition-transform transform hover:scale-105"
      onClick={onClick}
    >
      <video
        src={video.url}
        className="w-full h-full object-cover"
        muted
        loop
        playsInline
        onMouseEnter={e => e.currentTarget.play().catch(console.error)}
        onMouseLeave={e => e.currentTarget.pause()}
      />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <p className="text-white text-sm font-bold">Preview</p>
      </div>
      <button
        onClick={handleDelete}
        className="absolute top-1.5 right-1.5 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-red-600/80 transition-all duration-200"
        aria-label="Delete video"
        title="Delete video"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  );
};
