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
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@southdevs/capacitor-google-auth';

//  Firebase config
const firebaseConfig = {
  apiKey: 'AIzaSyArJQHNTFraEOp3ENdd67T6aV49hCCxoUo',
  authDomain: 'wellness-buddy-5de14.firebaseapp.com',
  projectId: 'wellness-buddy-5de14',
  storageBucket: 'wellness-buddy-5de14.appspot.com',
  messagingSenderId: '610941252952',
  appId: '1:610941252952:android:a04c921f5a95815857e12d',
};

// 🔥 Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// 🔐 Google Provider for web
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({ prompt: 'select_account' });

// 🧠 Enhanced device detection
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const isCapacitorNative = () => {
  return Capacitor.isNativePlatform();
};

// 🔁 Enhanced redirect tracking
const REDIRECT_KEY = 'google_auth_redirect_pending';
const REDIRECT_TIMESTAMP_KEY = 'google_auth_redirect_timestamp';
const REDIRECT_TIMEOUT = 5 * 60 * 1000;

const setRedirectPending = () => {
  sessionStorage.setItem(REDIRECT_KEY, 'true');
  sessionStorage.setItem(REDIRECT_TIMESTAMP_KEY, Date.now().toString());
};

const isRedirectPending = () => {
  const pending = sessionStorage.getItem(REDIRECT_KEY) === 'true';
  const timestamp = sessionStorage.getItem(REDIRECT_TIMESTAMP_KEY);
  if (!pending || !timestamp) return false;

  if (Date.now() - parseInt(timestamp) > REDIRECT_TIMEOUT) {
    clearRedirectPending();
    return false;
  }
  return true;
};

const clearRedirectPending = () => {
  sessionStorage.removeItem(REDIRECT_KEY);
  sessionStorage.removeItem(REDIRECT_TIMESTAMP_KEY);
};

// 🚀 Enhanced Google Sign-In for Web and Android
export const signInWithGoogle = async (forceRedirect = false) => {
  try {
    // Check if running in Capacitor (Android app)
    if (Capacitor.isNativePlatform()) {
      console.log('🤖 Using native Android Google Sign-In');
      
      // Initialize Google Auth for Capacitor
      await GoogleAuth.initialize({
        scopes: ['profile', 'email'],
        serverClientId: '610941252952-u9h8srgfr879aucl4sbc8h3f6i68cq7n.apps.googleusercontent.com',
        forceCodeForRefreshToken: true
      });

      // Sign in with native Google Auth
      const result = await GoogleAuth.signIn();
      console.log('✅ Native Google Sign-In result:', result);

      // Create Firebase credential from Google result
      const credential = GoogleAuthProvider.credential(result.authentication.idToken);
      const userCredential = await signInWithCredential(auth, credential);
      
      console.log('✅ Firebase authentication successful');
      return userCredential.user;
    } else {
      // Web-based authentication
      const useRedirect = forceRedirect || isMobile();
      if (useRedirect) {
        console.log('🔄 Using redirect authentication for mobile web');
        setRedirectPending();
        await signInWithRedirect(auth, googleProvider);
        return null;
      } else {
        console.log('🪟 Using popup authentication for web');
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
      }
    }
  } catch (error) {
    clearRedirectPending();

    // Handle specific error cases
    if (error.code === 'auth/popup-blocked') {
      console.log('🚫 Popup blocked, falling back to redirect');
      setRedirectPending();
      await signInWithRedirect(auth, googleProvider);
      return null;
    }

    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled. Please try again.');
    }

    // Handle native Google Auth errors
    if (error.message?.includes('User cancelled the flow')) {
      throw new Error('Sign-in was cancelled. Please try again.');
    }

    console.error('❌ Google Sign-in error:', error);
    throw error;
  }
};

// 🪟 Web-only popup login
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

// 🔄 Get redirect result
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
      console.log('Redirect result pending or empty');
      return null;
    }
  } catch (error) {
    clearRedirectPending();

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

// 🚪 Enhanced Sign out for Web and Android
export const signOutUser = async () => {
  try {
    clearRedirectPending();
    
    // Sign out from Firebase
    await auth.signOut();
    
    // If running on native platform, also sign out from native Google Auth
    if (Capacitor.isNativePlatform()) {
      try {
        await GoogleAuth.signOut();
        console.log('✅ Native Google Sign-Out successful');
      } catch (error) {
        console.warn('⚠️ Native Google Sign-Out warning:', error);
        // Don't throw - Firebase sign-out was successful
      }
    }
    
    console.log('✅ User signed out successfully');
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// 👀 Auth state observer
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(
    auth,
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

// 🔍 Check user
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};

export const isUserSignedIn = () => auth.currentUser !== null;

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

export const isGoogleUser = (user = null) => {
  const currentUser = user || auth.currentUser;
  return currentUser?.providerData?.[0]?.providerId === 'google.com';
};

export const getAuthMethod = (user = null) => {
  const currentUser = user || auth.currentUser;
  if (!currentUser) return null;
  const providerId = currentUser.providerData?.[0]?.providerId;
  switch (providerId) {
    case 'google.com': return 'google';
    case 'phone': return 'phone';
    default: return 'unknown';
  }
};

export const isMobileDevice = isMobile;
export const isNativePlatform = isCapacitorNative;

export const cleanup = () => clearRedirectPending();
