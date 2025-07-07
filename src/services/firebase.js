import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

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
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};