import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCheXluwKdWjpLqXPkVF-I0S_lhtN-7Mb0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mystery-9918e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mystery-9918e",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mystery-9918e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "649384039257",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:649384039257:web:6d813590ff67edf17a7248",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-2B6PS5BYE9",
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL ||
    "https://mystery-9918e-default-rtdb.firebaseio.com",
};

const requiredFields = ["apiKey", "authDomain", "projectId", "appId", "databaseURL"];

export const firebaseConfigured = requiredFields.every(
  (field) => Boolean(firebaseConfig[field])
);

const app = firebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const realtimeDb = app ? getDatabase(app) : null;
export const firebaseAuth = app ? getAuth(app) : null;
export const googleProvider = app ? new GoogleAuthProvider() : null;

if (googleProvider) {
  googleProvider.setCustomParameters({ prompt: "select_account" });
}
