// frontend/src/services/firebase.js
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  signInWithCredential,
  onAuthStateChanged
} from 'firebase/auth';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA2_ukaeoH-Pka7o9JFxDIocb8pm1c5o08",
  authDomain: "wellness-buddy-5de14.firebaseapp.com",
  projectId: "wellness-buddy-5de14",
  storageBucket: "wellness-buddy-5de14.firebasestorage.app",
  messagingSenderId: "610941252952",
  appId: "1:610941252952:web:5a009bc00697f5be57e12d",
  measurementId: "G-7QTHHT5PJC"
};

// Initialize Firebase app & auth
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Google Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Device detection
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Enhanced redirect session management
const REDIRECT_KEY = 'google_auth_redirect_pending';
const REDIRECT_TIMESTAMP_KEY = 'google_auth_redirect_timestamp';
const REDIRECT_TIMEOUT = 5 * 60 * 1000; // 5 minutes

const setRedirectPending = () => {
  sessionStorage.setItem(REDIRECT_KEY, 'true');
  sessionStorage.setItem(REDIRECT_TIMESTAMP_KEY, Date.now().toString());
};

const isRedirectPending = () => {
  const pending = sessionStorage.getItem(REDIRECT_KEY) === 'true';
  const timestamp = sessionStorage.getItem(REDIRECT_TIMESTAMP_KEY);
  
  if (!pending || !timestamp) return false;
  
  // Check if redirect is too old (timeout)
  const now = Date.now();
  const redirectTime = parseInt(timestamp);
  
  if (now - redirectTime > REDIRECT_TIMEOUT) {
    clearRedirectPending();
    return false;
  }
  
  return true;
};

const clearRedirectPending = () => {
  sessionStorage.removeItem(REDIRECT_KEY);
  sessionStorage.removeItem(REDIRECT_TIMESTAMP_KEY);
};

// 🔐 Google sign-in with popup for web, redirect for mobile
export const signInWithGoogle = async (forceRedirect = false) => {
  try {
    const useRedirect = forceRedirect || isMobile();
    
    if (useRedirect) {
      // Use redirect for mobile or when forced
      console.log('🔄 Using redirect authentication for mobile');
      setRedirectPending();
      await signInWithRedirect(auth, googleProvider);
      return null; // Redirect doesn't return user immediately
    } else {
      // Use popup for web/desktop
      console.log('🪟 Using popup authentication for web');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('✅ Popup authentication successful');
      return result.user;
    }
  } catch (error) {
    clearRedirectPending();
    
    // Handle popup blocked - fallback to redirect
    if (error.code === 'auth/popup-blocked') {
      console.log('🚫 Popup blocked, falling back to redirect');
      setRedirectPending();
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    
    // Handle popup closed by user
    if (error.code === 'auth/popup-closed-by-user') {
      console.log('❌ User closed popup');
      throw new Error('Sign-in was cancelled. Please try again.');
    }
    
    throw error;
  }
};

// 🪟 Force popup sign-in (web only)
export const signInWithGooglePopup = async () => {
  try {
    console.log('🪟 Forcing popup authentication');
    const result = await signInWithPopup(auth, googleProvider);
    console.log('✅ Popup authentication successful');
    return result.user;
  } catch (error) {
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked by your browser. Please allow popups and try again.');
    }
    
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled. Please try again.');
    }
    
    throw error;
  }
};

// 🔄 Enhanced redirect result handling
export const handleRedirectResult = async () => {
  try {
    if (!isRedirectPending()) {
      console.log('No redirect pending, skipping.');
      return null;
    }

    const result = await getRedirectResult(auth);

    if (result?.user) {
      clearRedirectPending();
      console.log('✅ Redirect authentication successful');
      return result.user;
    } else {
      // Still pending or no result yet
      console.log('Redirect result pending or empty');
      return null;
    }
  } catch (error) {
    clearRedirectPending();
    
    // Handle common redirect errors gracefully
    const ignorableErrors = [
      'auth/no-current-user',
      'auth/popup-closed-by-user',
      'auth/cancelled-popup-request',
      'auth/user-cancelled'
    ];
    
    if (ignorableErrors.includes(error.code)) {
      console.log('User cancelled authentication or no current user');
      return null;
    }

    console.error('handleRedirectResult error:', error);
    throw error;
  }
};

// 🚪 Enhanced sign out
export const signOutUser = async () => {
  try {
    clearRedirectPending();
    await auth.signOut();
    console.log('✅ User signed out successfully');
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// 👤 Auth state observer with enhanced error handling
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, 
    (user) => {
      if (user) {
        console.log('✅ Auth state: User authenticated', user.email);
      } else {
        console.log('❌ Auth state: User not authenticated');
      }
      callback(user);
    },
    (error) => {
      console.error('Auth state change error:', error);
      callback(null);
    }
  );
};

// 🔍 Check current authentication status
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, 
      (user) => {
        unsubscribe();
        resolve(user);
      },
      reject
    );
  });
};

// 🛠️ Utility functions
export const isUserSignedIn = () => {
  return auth.currentUser !== null;
};

export const getUserInfo = () => {
  const user = auth.currentUser;
  if (!user) return null;
  
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    isAnonymous: user.isAnonymous,
    providerData: user.providerData
  };
};

// 🔐 Provider-specific utilities
export const isGoogleUser = (user = null) => {
  const currentUser = user || auth.currentUser;
  return currentUser?.providerData?.[0]?.providerId === 'google.com';
};

export const getAuthMethod = (user = null) => {
  const currentUser = user || auth.currentUser;
  if (!currentUser) return null;
  
  const providerId = currentUser.providerData?.[0]?.providerId;
  switch (providerId) {
    case 'google.com':
      return 'google';
    case 'phone':
      return 'phone';
    default:
      return 'unknown';
  }
};

// 📱 Mobile-specific utilities
export const isMobileDevice = isMobile;

// 🧹 Cleanup function for component unmount
export const cleanup = () => {
  clearRedirectPending();
};