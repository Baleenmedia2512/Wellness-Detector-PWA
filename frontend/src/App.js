// src/App.js
import React, { useState, useRef, useEffect } from 'react';
import ImageUpload from './components/ImageUpload';
import NutritionCard from './components/NutritionCard';
import TestImageGuide from './components/TestImageGuide';
import CameraTest from './components/CameraTest';
import LoadingSpinner from './components/LoadingSpinner';
import Login from './components/Login';
import { geminiService } from './services/geminiService';
import { cameraService } from './services/cameraService';
import { auth, signInWithGoogle, signOutUser } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Header from './components/Header';

function App() {
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // const [apiInfo, _setApiInfo] = useState(geminiService.getApiInfo());
  const [showTestGuide, setShowTestGuide] = useState(false);
  // const [_cameraInfo, setCameraInfo] = useState(null);
  // const [_cameraStatusMessage, setCameraStatusMessage] = useState('');
  const [showCameraTest, setShowCameraTest] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isOtpVerified, setIsOtpVerified] = useState(
    localStorage.getItem('isOtpVerified') === 'true'
  );
  const fileInputRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const checkCamera = async () => {
        try {
          const info = await cameraService.getCameraInfo();
          const message = await cameraService.getCameraStatusMessage();
          console.log(info, message)
          // setCameraInfo(info);
          // setCameraStatusMessage(message);
        } catch (error) {
          console.warn('Failed to check camera:', error);
          // setCameraStatusMessage('Camera status unknown. You can still upload photos from gallery.');
        }
      };
      checkCamera();
    }
  }, [user]);

  useEffect(() => {
  if (isOtpVerified && !user) {
    const otpUser = localStorage.getItem('otpUser');
    if (otpUser) {
      setUser(JSON.parse(otpUser));
    }
  }
}, [isOtpVerified, user]);


  const handleImageSelect = (file) => {
    if (!user) {
      setError('Please sign in to analyze food images');
      return;
    }

    setSelectedImage(file);
    setError(null);
    setNutritionData(null);
    console.log(selectedImage)

    const reader = new FileReader();
    reader.onload = async (e) => {
      setImagePreview(e.target.result);

      // ✅ Analyze food after preview is ready
      try {
        setLoading(true);
        const result = await geminiService.analyzeImageForNutrition(file);
        setNutritionData(result);
      } catch (err) {
        let friendlyMessage = '❌ Food analysis failed. Please try again later.';
        const rawMessage = err.message || '';

        if (rawMessage.includes('503') || rawMessage.includes('overloaded')) {
          friendlyMessage = '⚡ Gemini AI is currently busy. Please try again in a few minutes.';
        } else if (rawMessage.includes('No food items detected')) {
          friendlyMessage = '⚠️ No food items were detected in the image. Try with a clearer photo.';
        } else if (rawMessage.includes('Invalid response format')) {
          friendlyMessage = '⚙️ Received unexpected data from Gemini API. Please try again later.';
        } else if (rawMessage.includes('network') || rawMessage.includes('Failed to fetch')) {
          friendlyMessage = '🌐 Network issue. Please check your internet connection.';
        } else if (rawMessage.includes('API key is not configured')) {
          friendlyMessage = '⚙️ Gemini API key is missing or invalid. Please check your setup.';
        }

        setError(friendlyMessage);
        console.error('❌ Gemini analysis error:', err);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  // const analyzeFood = async () => {
  //   if (!user) {
  //     setError('🚫 Please sign in to analyze food images.');
  //     return;
  //   }

  //   if (!selectedImage) {
  //     setError('📸 Please upload an image to analyze.');
  //     return;
  //   }

  //   // if (!apiInfo.hasCredentials) {
  //   //   setError(
  //   //     '⚙️ Gemini API key is missing. Please add your API key to the environment variables. Visit: https://makersuite.google.com/app/apikey'
  //   //   );
  //   //   return;
  //   // }

  //   setLoading(true);
  //   setError(null);

  //   try {
  //     const result = await geminiService.analyzeImageForNutrition(selectedImage);
  //     setNutritionData(result);
  //   } catch (err) {
  //     let friendlyMessage = '❌ Food analysis failed. Please try again later.';
  //     const rawMessage = err.message || '';

  //     if (rawMessage.includes('503') || rawMessage.includes('overloaded')) {
  //       friendlyMessage = '⚡ Gemini AI is currently busy. Please try again in a few minutes.';
  //     } else if (rawMessage.includes('No food items detected')) {
  //       friendlyMessage = '⚠️ No food items were detected in the image. Try with a clearer photo.';
  //     } else if (rawMessage.includes('Invalid response format')) {
  //       friendlyMessage = '⚙️ Received unexpected data from Gemini API. Please try again later.';
  //     } else if (rawMessage.includes('network') || rawMessage.includes('Failed to fetch')) {
  //       friendlyMessage = '🌐 Network issue. Please check your internet connection.';
  //     } else if (rawMessage.includes('API key is not configured')) {
  //       friendlyMessage = '⚙️ Gemini API key is missing or invalid. Please check your setup.';
  //     }

  //     setError(friendlyMessage);
  //     console.error('❌ Gemini analysis error:', err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   if (selectedImage && user) {
  //     analyzeFood();
  //   }
  // }, [selectedImage, user]);

  const resetApp = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setNutritionData(null);
    setError(null);
    setUser(null);
    setIsOtpVerified(false);
    localStorage.removeItem('isOtpVerified');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSignIn = async () => {
  try {
    setLoading(true);
    const user = await signInWithGoogle();

    // Save user in DB
    await fetch(`${apiBaseUrl}/api/save-google-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0]
      })
    });
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};


  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOutUser();
      resetApp();
      setIsOtpVerified(false);
      localStorage.removeItem('isOtpVerified');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <LoadingSpinner context="normal" />;
  }

// 1. If no Firebase user & OTP not yet verified → Show Login
if (!user && !isOtpVerified) {
  return (
    <Login
      onSignIn={handleSignIn}
      loading={loading}
      onOtpVerified={() => {
        setIsOtpVerified(true);
        localStorage.setItem('isOtpVerified', 'true');
      }}
    />
  );
}

// 2. Safely check for Google User (only if user exists)
const isGoogleUser = user?.providerData?.[0]?.providerId === 'google.com';

// 3. If user is NOT Google & OTP not yet verified → Force OTP Login
if (!isOtpVerified && !isGoogleUser) {
  return (
    <Login
      onSignIn={handleSignIn}
      loading={loading}
      onOtpVerified={() => {
        setIsOtpVerified(true);
        localStorage.setItem('isOtpVerified', 'true');
      }}
      forceOtpVerification={true}
    />
  );
}


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <Header
        user={user}
        onTestCamera={() => setShowCameraTest(true)}
        onSignOut={handleSignOut}
      />
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        <ImageUpload
          onImageSelect={handleImageSelect}
          imagePreview={imagePreview}
          loading={loading}
          ref={fileInputRef}
        />

        {error && (
          <div className="bg-white border border-red-200 text-red-600 px-4 py-3 rounded-xl shadow-sm flex items-start space-x-3">
            <div className="text-xl">⚠️</div>
            <div className="flex-1">
              <p className="font-semibold">Error</p>
              <p className="text-sm leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {nutritionData && <NutritionCard data={nutritionData} />}

        <div className="bg-white rounded-xl shadow-lg border border-green-200 p-4">
          <h3 className="font-semibold text-green-700 mb-2">📋 How to use:</h3>
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-green-600 mb-1">📸 Image Analysis:</h4>
              <ol className="text-sm text-gray-600 space-y-1 ml-4">
                <li>1. Take a clear photo of your food</li>
                <li>2. Make sure the food is well-lit and visible</li>
                <li>3. View detailed nutrition breakdown for detected foods</li>
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

        <TestImageGuide
          isVisible={showTestGuide}
          onClose={() => setShowTestGuide(false)}
        />

        {showCameraTest && (
          <CameraTest onClose={() => setShowCameraTest(false)} />
        )}
      </div>
    </div>
  );
}

export default App;
