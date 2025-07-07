import React from 'react';

const LoadingSpinner = ({ context = 'login' }) => {
  const loadingMessages = {
    login: {
      title: "Signing you in...",
      subtitle: "We're securely connecting to your Google account",
      color: "blue" // Using blue for auth-related loading
    },
    analysis: {
      title: "Analyzing with AI...",
      subtitle: "Gemini AI is analyzing your food and calculating nutrition",
      color: "green" // Using green for analysis-related loading
    }
  };

  const { title, subtitle, color } = loadingMessages[context] || loadingMessages.analysis;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg border-2 border-${color}-200 p-8 max-w-md w-full">
        <div className="text-center">
          {/* Animated Google-themed spinner for login, food-themed for analysis */}
          {context === 'login' ? (
            <div className="flex justify-center mb-4">
              <div className="relative h-12 w-12">
                <div className="absolute inset-0 rounded-full border-4 border-${color}-200"></div>
                <div 
                  className="absolute inset-0 rounded-full border-4 border-transparent"
                  style={{
                    borderTopColor: '#4285F4',
                    borderRightColor: '#34A853',
                    borderBottomColor: '#FBBC05',
                    borderLeftColor: '#EA4335',
                    animation: 'spin 1s linear infinite'
                  }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-${color}-200 border-t-${color}-600 mb-4"></div>
          )}

          <h3 className="text-lg font-semibold text-${color}-700 mb-2">
            {title}
          </h3>
          <p className="text-gray-600 text-sm">
            {subtitle}
          </p>
          
          {/* Thematic loading dots */}
          <div className="mt-4 flex justify-center space-x-2">
            {context === 'login' ? (
              // Google-colored dots
              <>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
              </>
            ) : (
              // Green-themed dots for analysis
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;