import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider as FirebaseGoogleProvider,
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from 'capacitor-google-auth';

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

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google provider
export const googleProvider = new FirebaseGoogleProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Utility for mobile check
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Track pending redirect
const setRedirectPending = () => sessionStorage.setItem('redirectPending', 'true');
const isRedirectPending = () => sessionStorage.getItem('redirectPending') === 'true';
const clearRedirectPending = () => sessionStorage.removeItem('redirectPending');

// 🌐 Web fallback Google sign-in
const signInWithWebRedirect = async () => {
  setRedirectPending();
  await signInWithRedirect(auth, googleProvider);
  return null; // Result handled separately
};

// 🔒 Native sign-in using capacitor plugin
const signInWithNativeGoogle = async () => {
  try {
    await GoogleAuth.init();
    const googleUser = await GoogleAuth.signIn();

    const idToken = googleUser.authentication.idToken;

    const credential = FirebaseGoogleProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    return result.user;
  } catch (error) {
    console.error('Native Google sign-in failed:', error);
    throw error;
  }
};

// 🔁 Main sign-in handler
export const signInWithGoogle = async () => {
  try {
    if (Capacitor.getPlatform() === 'android') {
      return await signInWithNativeGoogle();
    } else if (isMobile()) {
      return await signInWithWebRedirect();
    } else {
      return await signInWithWebRedirect(); // default fallback
    }
  } catch (error) {
    clearRedirectPending();
    throw error;
  }
};

// 🔄 Handle web redirect result
export const handleRedirectResult = async () => {
  try {
    if (!isRedirectPending()) {
      console.log('No redirect pending, skipping.');
      return null;
    }

    const result = await getRedirectResult(auth);

    if (result) {
      clearRedirectPending();
      return result.user;
    } else {
      return null;
    }
  } catch (error) {
    clearRedirectPending();
    if (
      error.code === 'auth/no-current-user' ||
      error.code === 'auth/popup-closed-by-user' ||
      error.code === 'auth/cancelled-popup-request'
    ) {
      return null;
    }
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    clearRedirectPending();
    await auth.signOut();
  } catch (error) {
    throw error;
  }
};
