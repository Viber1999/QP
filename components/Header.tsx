import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-900/70 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-center relative">
        <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 tracking-tight">
          Product Scene Creator
        </h1>
      </div>
    </header>
  );
};