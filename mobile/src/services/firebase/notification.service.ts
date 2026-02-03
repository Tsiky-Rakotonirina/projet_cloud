import { getToken } from "firebase/messaging";
import { messaging, db, auth } from "@/services/firebase/firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  Unsubscribe 
} from "firebase/firestore";
import { Capacitor } from "@capacitor/core";
import { 
  PushNotifications, 
  PushNotificationSchema,
  ActionPerformed,
  Token
} from "@capacitor/push-notifications";

// Stockage des listeners actifs
let problemsUnsubscribe: Unsubscribe | null = null;
let isListening = false;

// Cache pour suivre les historiques déjà vus (éviter les notifications en double)
const seenHistoriques: Map<string, number> = new Map();

/**
 * Initialiser les notifications push
 * Fonctionne sur mobile (Capacitor) et web (FCM)
 */
export const initNotifications = async (): Promise<string | null> => {
  if (Capacitor.isNativePlatform()) {
    return initMobileNotifications();
  } else {
    return initWebNotifications();
  }
};

/**
 * Notifications web via Firebase Cloud Messaging
 */
const initWebNotifications = async (): Promise<string | null> => {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Notifications refusées");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_CLOUD_MESSAGING_API_KEY,
    });

    console.log("FCM TOKEN GLOBAL :", token);
    
    // Sauvegarder le token dans Firestore
    await saveTokenToFirestore(token);
    
    return token;
  } catch (error) {
    console.error("Erreur initialisation notifications web:", error);
    return null;
  }
};

/**
 * Notifications mobile via Capacitor Push Notifications
 */
const initMobileNotifications = async (): Promise<string | null> => {
  try {
    // Vérifier les permissions
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.log('Push notifications non autorisées');
      return null;
    }

    // Enregistrer le device pour recevoir les notifications
    await PushNotifications.register();

    // Écouter l'obtention du token
    return new Promise((resolve) => {
      PushNotifications.addListener('registration', async (token: Token) => {
        console.log('Push registration success, token: ' + token.value);
        await saveTokenToFirestore(token.value);
        resolve(token.value);
      });

      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Error on registration: ' + JSON.stringify(error));
        resolve(null);
      });

      // Écouter les notifications reçues quand l'app est ouverte
      PushNotifications.addListener(
        'pushNotificationReceived',
        (notification: PushNotificationSchema) => {
          console.log('Push notification reçue:', notification);
          // Afficher une notification locale si nécessaire
          showLocalNotification(notification.title || 'Notification', notification.body || '');
        }
      );

      // Écouter les actions sur les notifications (tap)
      PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notification: ActionPerformed) => {
          console.log('Push notification action:', notification);
          // Naviguer vers la page appropriée si nécessaire
        }
      );
    });
  } catch (error) {
    console.error("Erreur initialisation notifications mobile:", error);
    return null;
  }
};

/**
 * Sauvegarder le token FCM dans Firestore pour l'utilisateur
 */
const saveTokenToFirestore = async (token: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    console.log("Utilisateur non connecté, token non sauvegardé");
    return;
  }

  try {
    const tokenRef = doc(db, "user_fcm_tokens", user.uid);
    await setDoc(tokenRef, {
      token,
      userId: user.uid,
      platform: Capacitor.getPlatform(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log("Token FCM sauvegardé pour l'utilisateur");
  } catch (error) {
    console.error("Erreur sauvegarde token:", error);
  }
};

/**
 * Afficher une notification locale (pour le web ou quand l'app est au premier plan)
 */
const showLocalNotification = (title: string, body: string): void => {
  if (Capacitor.isNativePlatform()) {
    // Sur mobile, les notifications sont gérées par le système
    return;
  }
  
  // Sur web, utiliser l'API Notification
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  }
};

/**
 * Démarrer l'écoute des changements d'historiques sur les problèmes
 * liés aux signalements de l'utilisateur connecté
 */
export const startListeningToMyProblemsHistoriques = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    console.log("Utilisateur non connecté, impossible d'écouter les historiques");
    return;
  }

  if (isListening) {
    console.log("Déjà en écoute des historiques");
    return;
  }

  try {
    // 1. Récupérer les signalements de l'utilisateur
    const signalementRef = collection(db, "signalements");
    const signalementQuery = query(signalementRef, where("utilisateurId", "==", user.uid));
    const signalementDocs = await getDocs(signalementQuery);

    if (signalementDocs.empty) {
      console.log("Aucun signalement trouvé pour l'utilisateur");
      return;
    }

    const mySignalementIds = signalementDocs.docs.map(doc => doc.id);
    console.log(`Écoute des problèmes pour ${mySignalementIds.length} signalements`);

    // 2. Écouter les problèmes liés à ces signalements
    const problemesRef = collection(db, "problemes");
    
    // Firestore ne supporte pas "in" avec onSnapshot pour les arrays > 10 éléments
    // On écoute tous les problèmes et on filtre côté client
    problemsUnsubscribe = onSnapshot(problemesRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const problemData = change.doc.data();
        const problemId = change.doc.id;
        
        // Vérifier si ce problème est lié à un de mes signalements
        if (!mySignalementIds.includes(problemData.signalementId)) {
          return;
        }

        // Vérifier les changements d'historiques
        const historiques = problemData.historiques || [];
        const previousCount = seenHistoriques.get(problemId) || 0;
        
        if (change.type === "added") {
          // Premier chargement, initialiser le cache
          seenHistoriques.set(problemId, historiques.length);
        } else if (change.type === "modified" && historiques.length > previousCount) {
          // Nouvel historique ajouté !
          const newHistoriques = historiques.slice(previousCount);
          seenHistoriques.set(problemId, historiques.length);
          
          // Envoyer une notification pour chaque nouvel historique
          newHistoriques.forEach((historique: any) => {
            const title = "📢 Mise à jour de votre signalement";
            const body = `Nouveau statut: ${historique.statutId || 'Mise à jour'} - ${new Date(historique.date).toLocaleDateString('fr-FR')}`;
            
            console.log("Nouvelle notification:", title, body);
            showLocalNotification(title, body);
          });
        }
      });
    }, (error) => {
      console.error("Erreur écoute problèmes:", error);
    });

    isListening = true;
    console.log("Écoute des historiques démarrée");
  } catch (error) {
    console.error("Erreur démarrage écoute historiques:", error);
  }
};

/**
 * Arrêter l'écoute des changements
 */
export const stopListeningToMyProblemsHistoriques = (): void => {
  if (problemsUnsubscribe) {
    problemsUnsubscribe();
    problemsUnsubscribe = null;
  }
  isListening = false;
  seenHistoriques.clear();
  console.log("Écoute des historiques arrêtée");
};

/**
 * Vérifier si l'écoute est active
 */
export const isListeningToHistoriques = (): boolean => {
  return isListening;
};
