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
import { 
  signInWithGoogle, 
  signInWithGooglePopup,
  signOutUser, 
  handleRedirectResult, 
  onAuthStateChange,
  isGoogleUser,
  isMobileDevice,
  cleanup
} from './services/firebase';
import Header from './components/Header';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import GalleryMonitor from './services/gallery-monitor';
import { PermissionsAndroid } from '@capacitor/android';
import { PushNotifications } from '@capacitor/push-notifications';


function WellnessBuddyApp() {
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTestGuide, setShowTestGuide] = useState(false);
  const [showCameraTest, setShowCameraTest] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isOtpVerified, setIsOtpVerified] = useState(
    localStorage.getItem('isOtpVerified') === 'true'
  );
  const fileInputRef = useRef(null);

  const requestAllPermissions = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Camera permission
    await PermissionsAndroid.requestPermission({
      permission: 'android.permission.CAMERA',
    });

    // Storage or media access
    await PermissionsAndroid.requestPermission({
      permission: 'android.permission.READ_MEDIA_IMAGES',
    });

    // Notifications permission (only on Android 13+)
    await PushNotifications.requestPermissions();

    console.log('✅ Permissions requested');
  } catch (err) {
    console.warn('❌ Permission request failed:', err);
  }
};


    useEffect(() => {
    const initializeGalleryMonitoring = async () => {
      if (Capacitor.isNativePlatform()) {
        // Start the gallery monitoring service
        await GalleryMonitor.initialize();
        
        // Add listener for app state changes
        App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            // App came to foreground - do an immediate check
            GalleryMonitor.checkGallery();
          }
        });
      }
    };

    initializeGalleryMonitoring();

    return () => {
      // Clean up listeners
      App.removeAllListeners();
    };
  }, []);

  // Handle redirect result on app load
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const resultUser = await handleRedirectResult();
        console.log('result user', resultUser)
        if (resultUser) {
          console.log('✅ Redirect authentication completed');
          setUser(resultUser);
          setAuthLoading(false);
        }
      } catch (error) {
        console.error('❌ Redirect result error:', error);
        setError('Authentication failed. Please try again.');
        setAuthLoading(false);
      }
    };

    checkRedirectResult();
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Camera setup for authenticated users
  // After login: request permissions and check camera
  useEffect(() => {
    if (user) {
      const checkCamera = async () => {
        try {
          const info = await cameraService.getCameraInfo();
          const message = await cameraService.getCameraStatusMessage();
          console.log('📷 Camera info:', info, message);
        } catch (error) {
          console.warn('⚠️ Camera check failed:', error);
        }
      };

      checkCamera();
      requestAllPermissions(); // 🔔 request permissions after login
    }
  }, [user]);


  // Handle OTP user restoration
  useEffect(() => {
    if (isOtpVerified && !user) {
      const otpUser = localStorage.getItem('otpUser');
      if (otpUser) {
        try {
          setUser(JSON.parse(otpUser));
        } catch (error) {
          console.error('❌ Failed to restore OTP user:', error);
          localStorage.removeItem('otpUser');
          setIsOtpVerified(false);
        }
      }
    }
  }, [isOtpVerified, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const handleImageSelect = async (file) => {
    if (!user) {
      setError('Please sign in to analyze food images');
      return;
    }

    setSelectedImage(file);
    setError(null);
    setNutritionData(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      setImagePreview(e.target.result);

      // Analyze food after preview is ready
      try {
        setLoading(true);
        const result = await geminiService.analyzeImageForNutrition(file);
        setNutritionData(result);
      } catch (err) {
        const friendlyMessage = getFriendlyErrorMessage(err);
        setError(friendlyMessage);
        console.error('❌ Gemini analysis error:', err);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const getFriendlyErrorMessage = (error) => {
    const rawMessage = error.message || '';

    if (rawMessage.includes('503') || rawMessage.includes('overloaded')) {
      return '⚡ Server is currently busy. Please try again in a few minutes.';
    } else if (rawMessage.includes('No food items detected')) {
      return '⚠️ No food items were detected in the image. Try with a clearer photo.';
    } else if (rawMessage.includes('Invalid response format')) {
      return '⚙️ Received unexpected data from server. Please try again later.';
    } else if (rawMessage.includes('network') || rawMessage.includes('Failed to fetch')) {
      return '🌐 Network issue. Please check your internet connection.';
    } else if (rawMessage.includes('API key is not configured')) {
      return '⚙️ Server is missing or invalid. Please check your setup.';
    }

    return '❌ Food analysis failed. Please try again later.';
  };

  const resetApp = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setNutritionData(null);
    setError(null);
    setUser(null);
    setIsOtpVerified(false);
    localStorage.removeItem('isOtpVerified');
    localStorage.removeItem('otpUser');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSignIn = async (forceRedirect = false) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔐 Starting Google sign-in process');
      const user = await signInWithGoogle(forceRedirect);

      // For popup authentication, user is returned immediately
      if (user) {
        console.log('✅ User signed in via popup:', user.email);
        await saveUserToBackend(user);
        setUser(user);
      } else {
        // For redirect authentication, user will be set via auth state change
        console.log('🔄 Redirect initiated, waiting for result...');
      }
    } catch (error) {
      console.error('❌ Sign in error:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/popup-blocked') {
        setError('Popup was blocked. Trying redirect method...');
        // Automatically retry with redirect
        setTimeout(() => {
          console.log('🔄 Retrying with redirect due to popup block');
          handleSignIn(true);
        }, 1000);
        return;
      }
      
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed. Please try again.');
        setLoading(false);
        return;
      }
      
      setError(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Handle popup sign-in specifically for web
  const handlePopupSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🪟 Starting popup sign-in');
      const user = await signInWithGooglePopup();
      
      if (user) {
        console.log('✅ Popup sign-in successful:', user.email);
        await saveUserToBackend(user);
        setUser(user);
      }
    } catch (error) {
      console.error('❌ Popup sign-in error:', error);
      setError(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const getAuthErrorMessage = (error) => {
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        return 'Sign in was cancelled. Please try again.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait a moment and try again.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      default:
        return error.message || 'Authentication failed. Please try again.';
    }
  };

  const saveUserToBackend = async (user) => {
    try {
      await fetch(`${apiBaseUrl}/api/save-google-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          displayName: user.displayName || user.email.split("@")[0],
          photoURL: user.photoURL || null,
          uid: user.uid
        })
      });
    } catch (error) {
      console.error('❌ Failed to save user to backend:', error);
      // Don't throw - user is still authenticated
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOutUser();
      resetApp();
    } catch (error) {
      console.error('❌ Sign out error:', error);
      setError('Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerified = () => {
    setIsOtpVerified(true);
    localStorage.setItem('isOtpVerified', 'true');
  };

  // Loading state
  if (authLoading) {
    return <LoadingSpinner context="normal" />;
  }

  // Authentication logic
  // 1. If no Firebase user & OTP not yet verified → Show Login
  if (!user && !isOtpVerified) {
    return (
      <Login
        onSignIn={isMobileDevice() ? handleSignIn : handlePopupSignIn}
        loading={loading}
        error={error}
        onOtpVerified={handleOtpVerified}
      />
    );
  }

  // 2. Safely check for Google User (only if user exists)
  const isGoogleUserCheck = user && isGoogleUser(user);

  // 3. If user is NOT Google & OTP not yet verified → Force OTP Login
  if (!isOtpVerified && !isGoogleUserCheck) {
    return (
      <Login
        onSignIn={isMobileDevice() ? handleSignIn : handlePopupSignIn}
        loading={loading}
        error={error}
        onOtpVerified={handleOtpVerified}
        forceOtpVerification={true}
      />
    );
  }

  // Main app interface
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

export default WellnessBuddyApp;