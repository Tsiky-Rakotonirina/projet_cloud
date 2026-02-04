import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, increment, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/services/firebase/firebase";
import type { UserProfile } from "@/types/user";
import { LOGIN_ATTEMPTS_CONFIG } from "@/config/auth";

/**
 * Lier un utilisateur Firebase Auth avec son profil Firestore
 * Utilise l'UID de Firebase Auth comme ID du document Firestore
 * Cela assure la cohérence entre Auth et Firestore
 */
export const linkAuthWithFirestore = async (uid: string, email: string, additionalData?: Partial<UserProfile>): Promise<UserProfile> => {
  try {
    const docRef = doc(db, "utilisateurs", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // L'utilisateur existe déjà, mettre à jour l'email si différent
      const existingData = docSnap.data() as UserProfile;
      if (existingData.email !== email) {
        await updateDoc(docRef, { 
          email: email,
          updatedAt: new Date().toISOString()
        });
      }
      return { ...existingData, id: uid, email };
    } else {
      // Chercher si l'utilisateur existe par email (migration depuis ancien système)
      const existingByEmail = await getUserByEmail(email);
      
      const newUserData: Partial<UserProfile> = {
        email: email,
        blocked: existingByEmail?.blocked || false,
        disabled: existingByEmail?.disabled || false,
        loginAttempts: existingByEmail?.loginAttempts || 0,
        profilId: existingByEmail?.profilId || "profil_2",
        role: existingByEmail?.role || "user",
        createdAt: new Date().toISOString(),
        ...additionalData
      };

      await setDoc(docRef, newUserData);
      console.log(`Utilisateur ${email} lié à Firebase Auth (UID: ${uid})`);
      
      return { id: uid, ...newUserData } as UserProfile;
    }
  } catch (error) {
    console.error("Erreur lors du lien Auth/Firestore :", error);
    throw error;
  }
};

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
export const incrementLoginAttempts = async (email: string): Promise<{ blocked: boolean; attempts: number; remainingAttempts: number; shouldDisable: boolean }> => {
  try {
    const usersRef = collection(db, "utilisateurs");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // L'utilisateur n'existe pas dans Firestore, on le crée pour tracker les tentatives
      console.log(`Utilisateur ${email} non trouvé dans Firestore, création d'un document de tracking...`);
      
      // Créer un nouveau document pour cet utilisateur
      const newUserRef = doc(collection(db, "utilisateurs"));
      await setDoc(newUserRef, {
        email: email,
        loginAttempts: 1,
        lastFailedLogin: new Date().toISOString(),
        disabled: false,
        blocked: false,
        createdAt: new Date().toISOString()
      });
      
      const remainingAttempts = LOGIN_ATTEMPTS_CONFIG.MAX_ATTEMPTS - 1; // 3 - 1 = 2
      console.log(`Première tentative échouée pour ${email}. ${remainingAttempts} tentatives restantes.`);
      
      return { 
        blocked: false, 
        attempts: 1, 
        remainingAttempts: remainingAttempts,
        shouldDisable: false 
      };
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data() as UserProfile;
    
    // Si déjà désactivé, retourner immédiatement
    if (userData.disabled) {
      return { 
        blocked: true, 
        attempts: userData.loginAttempts || LOGIN_ATTEMPTS_CONFIG.MAX_ATTEMPTS, 
        remainingAttempts: 0,
        shouldDisable: false 
      };
    }

    const currentAttempts = (userData.loginAttempts || 0) + 1;
    const remainingAttempts = Math.max(0, LOGIN_ATTEMPTS_CONFIG.MAX_ATTEMPTS - currentAttempts);
    const shouldDisable = currentAttempts >= LOGIN_ATTEMPTS_CONFIG.MAX_ATTEMPTS;

    // Mettre à jour les tentatives dans Firestore
    await updateDoc(doc(db, "utilisateurs", userDoc.id), {
      loginAttempts: currentAttempts,
      lastFailedLogin: new Date().toISOString()
    });

    console.log(`Tentative ${currentAttempts}/${LOGIN_ATTEMPTS_CONFIG.MAX_ATTEMPTS} pour ${email} (${remainingAttempts} restantes)`);
    
    return { 
      blocked: shouldDisable,
      attempts: currentAttempts,
      remainingAttempts: remainingAttempts,
      shouldDisable: shouldDisable
    };
  } catch (error) {
    console.error("Erreur lors de l'incrémentation des tentatives :", error);
    return { blocked: false, attempts: 0, remainingAttempts: LOGIN_ATTEMPTS_CONFIG.MAX_ATTEMPTS, shouldDisable: false };
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

// Vérifier et débloquer automatiquement les comptes dont le blocage a expiré
export const checkAndUnblockExpiredAccounts = async (email: string): Promise<boolean> => {
  try {
    const userProfile = await getUserByEmail(email);
    if (!userProfile?.blocked || !userProfile.lastFailedLogin) {
      return false; // Pas bloqué ou pas de date de dernier échec
    }

    const lastFailedLogin = new Date(userProfile.lastFailedLogin);
    const now = new Date();
    const timeSinceLastFailure = now.getTime() - lastFailedLogin.getTime();

    // Si le temps écoulé dépasse la durée de blocage, débloquer le compte
    if (timeSinceLastFailure >= LOGIN_ATTEMPTS_CONFIG.BLOCK_DURATION) {
      await updateDoc(doc(db, "utilisateurs", userProfile.id), {
        blocked: false,
        loginAttempts: 0,
        lastFailedLogin: null
      });
      console.log(`Compte débloqué automatiquement pour ${email}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Erreur lors de la vérification du blocage :", error);
    return false;
  }
};

// Désactiver un compte utilisateur (après 3 tentatives échouées)
export const disableUserAccount = async (email: string): Promise<boolean> => {
  try {
    const usersRef = collection(db, "utilisateurs");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error("Utilisateur non trouvé pour désactivation");
      return false;
    }

    const userDoc = querySnapshot.docs[0];
    await updateDoc(doc(db, "utilisateurs", userDoc.id), {
      disabled: true,
      disabledAt: new Date().toISOString(),
      disabledReason: "3 tentatives de connexion échouées"
    });

    console.log(`Compte désactivé pour ${email}`);
    return true;
  } catch (error) {
    console.error("Erreur lors de la désactivation du compte :", error);
    return false;
  }
};

// Réactiver un compte utilisateur (fonction manager)
export const enableUserAccount = async (email: string, managerId: string): Promise<boolean> => {
  try {
    const usersRef = collection(db, "utilisateurs");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error("Utilisateur non trouvé pour réactivation");
      return false;
    }

    const userDoc = querySnapshot.docs[0];
    await updateDoc(doc(db, "utilisateurs", userDoc.id), {
      disabled: false,
      disabledAt: null,
      disabledReason: null,
      reactivatedAt: new Date().toISOString(),
      reactivatedBy: managerId
    });

    // Réinitialiser aussi les tentatives de connexion
    await updateDoc(doc(db, "utilisateurs", userDoc.id), {
      loginAttempts: 0,
      blocked: false,
      lastFailedLogin: null
    });

    console.log(`Compte réactivé pour ${email} par le manager ${managerId}`);
    return true;
  } catch (error) {
    console.error("Erreur lors de la réactivation du compte :", error);
    return false;
  }
};

// Vérifier si un utilisateur est un manager/admin
export const isUserManager = async (uid: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, "utilisateurs", uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserProfile;
      return userData.role === 'manager' || userData.role === 'admin';
    }
    return false;
  } catch (error) {
    console.error("Erreur lors de la vérification du rôle manager :", error);
    return false;
  }
};
