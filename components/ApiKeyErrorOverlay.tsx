import React from 'react';

export const ApiKeyErrorOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4 text-center" role="alertdialog" aria-modal="true" aria-labelledby="error-title">
      <div className="max-w-md bg-gray-800 border border-red-500/50 rounded-2xl shadow-2xl p-8">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 id="error-title" className="mt-4 text-3xl font-extrabold text-white">Configuration Error</h2>
        <p className="mt-4 text-lg text-gray-300">
          The Gemini API key is missing.
        </p>
        <p className="mt-2 text-md text-gray-400">
          This application cannot function without a valid API key. Please ensure the <code>API_KEY</code> environment variable is set up correctly in your project's configuration.
        </p>
        <div className="mt-6 bg-gray-900/50 p-3 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm">This is a demo application and requires developer setup to run.</p>
        </div>
      </div>
    </div>
  );
};
