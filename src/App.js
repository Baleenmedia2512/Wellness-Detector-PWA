import React, { useState, useRef, useEffect } from 'react';
import ImageUpload from './components/ImageUpload';
import NutritionCard from './components/NutritionCard';
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
  const [cameraInfo, setCameraInfo] = useState(null);
  const [cameraStatusMessage, setCameraStatusMessage] = useState('');
  const [showCameraTest, setShowCameraTest] = useState(false);
  const fileInputRef = useRef(null);

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

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const analyzeFood = async () => {
    if (!selectedImage) {
      setError('Please upload an image to analyze');
      return;
    }

    if (!apiInfo.hasCredentials) {
      setError('Gemini API key is not configured. Please add REACT_APP_GEMINI_API_KEY to your environment variables. Get a free API key at: https://makersuite.google.com/app/apikey');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🍽️ Analyzing food with Gemini AI...`);
      const result = await geminiService.analyzeImageForNutrition(selectedImage);
      setNutritionData(result);
      console.log('✅ Food analysis completed:', result);
    } catch (err) {
      setError(err.message || 'Food analysis failed. Please try again.');
      console.error('❌ Gemini analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedImage) {
      analyzeFood();
    }
  }, [selectedImage]);

  const resetApp = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setNutritionData(null);
    setError(null);
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
                🌿 Wellness Buddy
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
        
        {/* Image Upload Section with Loading Overlay */}
        <ImageUpload
          onImageSelect={handleImageSelect}
          imagePreview={imagePreview}
          loading={loading}
          ref={fileInputRef}
        />

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