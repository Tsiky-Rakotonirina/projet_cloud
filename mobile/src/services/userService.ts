import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, increment, query, where, getDocs } from "firebase/firestore";
import { auth } from "@/firebase";

const firebaseConfig = {
  apiKey: "AIzaSyDIWOJvZx9RTmPQ5Cs_HIhDkhsupOHRH1Q",
  authDomain: "tp-firebase-b195d.firebaseapp.com",
  projectId: "tp-firebase-b195d",
  storageBucket: "tp-firebase-b195d.firebasestorage.app",
  messagingSenderId: "79410079282",
  appId: "1:79410079282:web:79ea5bb57d79bbc7ae7e2b",
  measurementId: "G-2CL6MR5X2T"
};

import { initializeApp } from "firebase/app";
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Configuration du nombre maximum de tentatives (paramétrable)
let MAX_LOGIN_ATTEMPTS = 3;

export const setMaxLoginAttempts = (max: number) => {
  MAX_LOGIN_ATTEMPTS = max;
  console.log(`Nombre max de tentatives défini à ${max}`);
};

export const getMaxLoginAttempts = () => MAX_LOGIN_ATTEMPTS;

export interface UserProfile {
  id: string;
  email: string;
  github?: string;
  dateNaissance?: string;
  profilId: string;
  blocked?: boolean;
  loginAttempts?: number;
  lastFailedLogin?: string;
  displayName?: string;
  telephone?: string;
}

// Récupérer le profil utilisateur par email
export const getUserByEmail = async (email: string): Promise<UserProfile | null> => {
  try {
    const usersRef = collection(db, "utilisateurs");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data() as Omit<UserProfile, 'id'>
    };
  } catch (error) {
    console.error("Erreur lors de la récupération du profil :", error);
    return null;
  }
};

// Récupérer le profil utilisateur par UID Firebase
export const getUserByUid = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, "utilisateurs", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data() as Omit<UserProfile, 'id'>
      };
    }
    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération du profil :", error);
    return null;
  }
};

// Créer ou mettre à jour le profil utilisateur
export const createOrUpdateUserProfile = async (
  uid: string, 
  data: Partial<UserProfile>
): Promise<void> => {
  try {
    const docRef = doc(db, "utilisateurs", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      await updateDoc(docRef, data);
    } else {
      await setDoc(docRef, {
        ...data,
        blocked: false,
        loginAttempts: 0,
        profilId: "profilId" // Profil par défaut
      });
    }
    console.log("Profil utilisateur mis à jour");
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil :", error);
    throw error;
  }
};

// Vérifier si le compte est bloqué
export const isAccountBlocked = async (email: string): Promise<boolean> => {
  try {
    const user = await getUserByEmail(email);
    return user?.blocked === true;
  } catch (error) {
    console.error("Erreur lors de la vérification du blocage :", error);
    return false;
  }
};

// Incrémenter les tentatives de connexion échouées
export const incrementLoginAttempts = async (email: string): Promise<{ blocked: boolean; attempts: number }> => {
  try {
    const usersRef = collection(db, "utilisateurs");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // L'utilisateur n'existe pas dans Firestore, on ne peut pas tracker
      return { blocked: false, attempts: 0 };
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data() as UserProfile;
    const currentAttempts = (userData.loginAttempts || 0) + 1;
    const shouldBlock = currentAttempts >= MAX_LOGIN_ATTEMPTS;

    await updateDoc(doc(db, "utilisateurs", userDoc.id), {
      loginAttempts: currentAttempts,
      lastFailedLogin: new Date().toISOString(),
      blocked: shouldBlock
    });

    console.log(`Tentative ${currentAttempts}/${MAX_LOGIN_ATTEMPTS} pour ${email}`);
    
    return { 
      blocked: shouldBlock, 
      attempts: currentAttempts 
    };
  } catch (error) {
    console.error("Erreur lors de l'incrémentation des tentatives :", error);
    return { blocked: false, attempts: 0 };
  }
};

// Réinitialiser les tentatives de connexion (après connexion réussie)
export const resetLoginAttempts = async (email: string): Promise<void> => {
  try {
    const usersRef = collection(db, "utilisateurs");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, "utilisateurs", userDoc.id), {
        loginAttempts: 0,
        lastFailedLogin: null
      });
      console.log("Tentatives de connexion réinitialisées");
    }
  } catch (error) {
    console.error("Erreur lors de la réinitialisation des tentatives :", error);
  }
};

// Débloquer un compte (pour les managers)
export const unblockAccount = async (email: string): Promise<void> => {
  try {
    const usersRef = collection(db, "utilisateurs");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, "utilisateurs", userDoc.id), {
        blocked: false,
        loginAttempts: 0,
        lastFailedLogin: null
      });
      console.log(`Compte ${email} débloqué`);
    }
  } catch (error) {
    console.error("Erreur lors du déblocage du compte :", error);
    throw error;
  }
};

// Mettre à jour le profil utilisateur connecté
export const updateMyProfile = async (data: Partial<UserProfile>): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    await createOrUpdateUserProfile(user.uid, data);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil :", error);
    throw error;
  }
};

// Récupérer le profil de l'utilisateur connecté
export const getMyProfile = async (): Promise<UserProfile | null> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return null;
    }

    let profile = await getUserByUid(user.uid);
    
    // Si le profil n'existe pas par UID, essayer par email
    if (!profile && user.email) {
      profile = await getUserByEmail(user.email);
    }

    return profile;
  } catch (error) {
    console.error("Erreur lors de la récupération du profil :", error);
    return null;
  }
};

// Vérifier si l'utilisateur est un manager
export const isManager = async (): Promise<boolean> => {
  try {
    const profile = await getMyProfile();
    if (!profile) return false;
    
    // Vérifier le profil (Admin ou Manager)
    const profilRef = doc(db, "profils", profile.profilId);
    const profilSnap = await getDoc(profilRef);
    
    if (profilSnap.exists()) {
      const profilData = profilSnap.data();
      return profilData.libelle === "Admin" || profilData.libelle === "Manager";
    }
    
    return false;
  } catch (error) {
    console.error("Erreur lors de la vérification du rôle :", error);
    return false;
  }
};
