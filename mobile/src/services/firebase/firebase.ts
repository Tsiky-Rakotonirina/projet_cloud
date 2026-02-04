import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "tp-firebase-b195d.firebaseapp.com",
  projectId: "tp-firebase-b195d",
  storageBucket: "tp-firebase-b195d.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
// Analytics only in browser and only when required config exists
let analytics;
const hasWebConfig = Boolean(firebaseConfig.apiKey) && (Boolean(firebaseConfig.appId) || Boolean(firebaseConfig.measurementId));
if (typeof window !== 'undefined' && hasWebConfig) {
  try {
    analytics = getAnalytics(app);
  } catch (err) {
    // If analytics fails to initialize, log and continue without throwing
    // This prevents runtime crashes when env vars are missing during dev
    // or when analytics is not supported in the environment.
    // eslint-disable-next-line no-console
    console.warn('Analytics not initialized:', err);
  }
}
export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app);

// Configuration de la persistance de session
// LOCAL : session persiste même après fermeture du navigateur
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Erreur configuration persistance :", error);
});
