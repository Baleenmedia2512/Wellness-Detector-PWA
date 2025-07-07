import React, { useState, useRef, useEffect } from 'react';
import ImageUpload from './components/ImageUpload';
import NutritionCard from './components/NutritionCard';
import LoadingSpinner from './components/LoadingSpinner';
import TestImageGuide from './components/TestImageGuide';
import CameraTest from './components/CameraTest';
import { geminiService } from './services/geminiService';
import { cameraService } from './services/cameraService';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiInfo, setApiInfo] = useState(geminiService.getApiInfo());
  const [showTestGuide, setShowTestGuide] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [analysisMode, setAnalysisMode] = useState('image'); // 'image' or 'text'
  const [cameraInfo, setCameraInfo] = useState(null);
  const [cameraStatusMessage, setCameraStatusMessage] = useState('');
  const [showCameraTest, setShowCameraTest] = useState(false);
  const fileInputRef = useRef(null);

  // Check camera capabilities on component mount
  useEffect(() => {
    const checkCamera = async () => {
      try {
        const info = await cameraService.getCameraInfo();
        const message = await cameraService.getCameraStatusMessage();
        setCameraInfo(info);
        setCameraStatusMessage(message);
      } catch (error) {
        console.warn('Failed to check camera:', error);
        setCameraStatusMessage('Camera status unknown. You can still upload photos from gallery.');
      }
    };
    
    checkCamera();
  }, []);

  const handleImageSelect = (file) => {
    setSelectedImage(file);
    setError(null);
    setNutritionData(null);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const analyzeFood = async () => {
    if (analysisMode === 'image' && !selectedImage) {
      setError('Please upload an image to analyze');
      return;
    }
    
    if (analysisMode === 'text' && !foodName.trim()) {
      setError('Please specify what food you want to analyze');
      return;
    }

    if (!apiInfo.hasCredentials) {
      setError('Gemini API key is not configured. Please add REACT_APP_GEMINI_API_KEY to your environment variables. Get a free API key at: https://makersuite.google.com/app/apikey');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`� Analyzing food with Gemini AI (${analysisMode} mode)...`);
      
      let result;
      if (analysisMode === 'image') {
        result = await geminiService.analyzeImageForNutrition(selectedImage);
      } else {
        result = await geminiService.analyzeTextForNutrition(foodName.trim());
      }
      
      setNutritionData(result);
      console.log('✅ Food analysis completed:', result);
      
    } catch (err) {
      setError(err.message || 'Food analysis failed. Please try again.');
      console.error('❌ Gemini analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetApp = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setNutritionData(null);
    setError(null);
    setFoodName('');
    setAnalysisMode('image');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-green-500">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-green-700 text-center">
                🌿 Wellness Detector
              </h1>
              <p className="text-green-600 text-center mt-2 text-sm">
                Get nutrition data for any food
              </p>
            </div>
            <button
              onClick={() => setShowCameraTest(true)}
              className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors ml-2"
              title="Test camera functionality"
            >
              📷 Test
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        
        {/* Analysis Mode Toggle */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-green-200 p-4">
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setAnalysisMode('image')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                analysisMode === 'image'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📸 Image Analysis
            </button>
            <button
              onClick={() => setAnalysisMode('text')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                analysisMode === 'text'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📝 Text Query
            </button>
          </div>
        </div>

        {/* Camera Status Info */}
        {analysisMode === 'image' && cameraInfo && (
          <div className={`rounded-lg p-3 text-sm ${
            cameraInfo.supportsCapture 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : cameraInfo.hasCamera 
                ? 'bg-blue-50 border border-blue-200 text-blue-700'
                : 'bg-gray-50 border border-gray-200 text-gray-700'
          }`}>
            <div className="flex items-center gap-2">
              {cameraInfo.supportsCapture ? '📱' : cameraInfo.hasCamera ? '📷' : '🖼️'}
              <span className="font-medium">
                {cameraInfo.isPWA ? 'PWA Mode' : 'Browser Mode'} • 
                {cameraInfo.isMobile ? ' Mobile Device' : ' Desktop'}
              </span>
            </div>
            <p className="mt-1">{cameraStatusMessage}</p>
          </div>
        )}

        {/* Image Upload Section */}
        {analysisMode === 'image' && (
          <ImageUpload
            onImageSelect={handleImageSelect}
            imagePreview={imagePreview}
            ref={fileInputRef}
          />
        )}

        {/* Food Name Input */}
        {analysisMode === 'text' && (
          <div className="bg-white rounded-xl shadow-lg border-2 border-green-200 p-6">
            <label className="block text-lg font-semibold text-green-700 mb-3">
              🍽️ What food do you want to analyze?
            </label>
            <input
              type="text"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              placeholder="e.g., grilled chicken breast, chocolate cake, apple..."
              className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
            />
            <p className="text-sm text-green-600 mt-2">
              Enter the name of the food you want nutrition information for
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={analyzeFood}
            disabled={loading || !apiInfo.hasCredentials || 
              (analysisMode === 'image' && !selectedImage) || 
              (analysisMode === 'text' && !foodName.trim())}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? 'Analyzing...' : 
             !apiInfo.hasCredentials ? 'API Not Configured' : 
             (analysisMode === 'image' && !selectedImage) ? 'Upload Image' :
             (analysisMode === 'text' && !foodName.trim()) ? 'Enter Food Name' :
             analysisMode === 'image' ? '🤖 Analyze Image' : '🥗 Get Nutrition Data'}
          </button>
          
          <button
            onClick={resetApp}
            className="bg-gray-500 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:bg-gray-600 transition-all duration-200"
          >
            🔄
          </button>
        </div>

        {/* Loading Spinner */}
        {loading && <LoadingSpinner />}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
            <div className="flex items-center">
              <span className="text-lg mr-2">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Nutrition Results */}
        {nutritionData && <NutritionCard data={nutritionData} />}

        {/* API Status */}
        {!apiInfo.hasCredentials && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-xl">
            <div className="flex items-center">
              <span className="text-lg mr-2">⚠️</span>
              <div>
                <strong>Gemini API Required:</strong> Please add your Gemini API key to use AI nutrition analysis.
                <br />
                <span className="text-sm">
                  Get free API key at: <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">makersuite.google.com</a>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Gemini AI Notice */}
        <div className="bg-gradient-to-r from-blue-100 to-green-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-xl">
          <div className="text-sm">
            <strong>� Powered by Google Gemini AI:</strong> This app uses Google's advanced Gemini AI for intelligent food image analysis.
            <br />
            <span className="text-blue-600">
              • Advanced computer vision for food recognition<br />
              • AI-powered nutrition calculation<br />
              • Support for multiple foods in one image<br />
              • {apiInfo.dailyLimit.toLocaleString()} free requests per day
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-xl shadow-lg border border-green-200 p-4">
          <h3 className="font-semibold text-green-700 mb-2">📋 How to use:</h3>
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-green-600 mb-1">📸 Image Analysis:</h4>
              <ol className="text-sm text-gray-600 space-y-1 ml-4">
                <li>1. Take a clear photo of your food</li>
                <li>2. Make sure the food is well-lit and visible</li>
                <li>3. Tap "Analyze Image" to get AI-powered nutrition data</li>
                <li>4. View detailed nutrition breakdown for detected foods</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium text-green-600 mb-1">📝 Text Query:</h4>
              <ol className="text-sm text-gray-600 space-y-1 ml-4">
                <li>1. Enter the name of the food you want to analyze</li>
                <li>2. Be specific for better results</li>
                <li>3. Get comprehensive nutrition information</li>
              </ol>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200">
            <h4 className="font-semibold text-green-700 mb-2">💡 Tips for better results:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Take photos in good lighting conditions</li>
              <li>• Ensure food items are clearly visible</li>
              <li>• Avoid cluttered backgrounds</li>
              <li>• For text queries, be specific about preparation methods</li>
            </ul>
          </div>
        </div>

        {/* Test Image Guide Modal */}
        <TestImageGuide 
          isVisible={showTestGuide} 
          onClose={() => setShowTestGuide(false)} 
        />

        {/* Camera Test Modal */}
        {showCameraTest && (
          <CameraTest onClose={() => setShowCameraTest(false)} />
        )}
      </div>
    </div>
  );
}

export default App;
