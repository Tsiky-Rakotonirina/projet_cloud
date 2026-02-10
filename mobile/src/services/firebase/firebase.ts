import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, Messaging } from "firebase/messaging";
import { Capacitor } from "@capacitor/core";

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
if (typeof window !== 'undefined' && hasWebConfig && !Capacitor.isNativePlatform()) {
  try {
    analytics = getAnalytics(app);
  } catch (err) {
    console.warn('Analytics not initialized:', err);
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);

// Firebase Messaging seulement sur web (pas sur Android/iOS natif)
// Sur mobile natif, on utilise @capacitor/push-notifications
let messaging: Messaging | null = null;
if (!Capacitor.isNativePlatform()) {
  try {
    messaging = getMessaging(app);
  } catch (err) {
    console.warn('Firebase Messaging not initialized:', err);
  }
}
export { messaging };

// Configuration de la persistance de session
// LOCAL : session persiste même après fermeture du navigateur
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Erreur configuration persistance :", error);
});
