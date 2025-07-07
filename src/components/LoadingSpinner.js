import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-green-200 p-8">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mb-4"></div>
        <h3 className="text-lg font-semibold text-green-700 mb-2">
          Analyzing with AI...
        </h3>
        <p className="text-gray-600 text-sm">
          Gemini AI is analyzing your food and calculating nutrition
        </p>
        <div className="mt-4 flex justify-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
