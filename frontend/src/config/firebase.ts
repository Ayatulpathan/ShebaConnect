import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDcvOWmVDpn1VX2FWnmPU1NyqhrhGTviZQ',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'khadok-meal.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'khadok-meal',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'khadok-meal.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '984656453342',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:984656453342:web:e8582819dc5b8622346c4f',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGooglePopup = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  return { user: result.user, idToken };
};
