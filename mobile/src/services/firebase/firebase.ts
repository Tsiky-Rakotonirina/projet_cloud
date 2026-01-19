import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDIWOJvZx9RTmPQ5Cs_HIhDkhsupOHRH1Q",
  authDomain: "tp-firebase-b195d.firebaseapp.com",
  projectId: "tp-firebase-b195d",
  storageBucket: "tp-firebase-b195d.firebasestorage.app",
  messagingSenderId: "79410079282",
  appId: "1:79410079282:web:79ea5bb57d79bbc7ae7e2b",
  measurementId: "G-2CL6MR5X2T"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);

// Configuration de la persistance de session
// LOCAL : session persiste même après fermeture du navigateur
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Erreur configuration persistance :", error);
});
