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
  addDoc,
  updateDoc,
  orderBy,
  Unsubscribe 
} from "firebase/firestore";
import { Capacitor } from "@capacitor/core";
import { 
  PushNotifications, 
  PushNotificationSchema,
  ActionPerformed,
  Token
} from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { UserNotification } from "@/types/entities";

// Compteur pour les IDs de notifications locales
let localNotificationId = 1;

// Stockage des listeners actifs
let problemsUnsubscribe: Unsubscribe | null = null;
let signalementsUnsubscribe: Unsubscribe | null = null;
let isListening = false;

// Cache pour suivre les historiques déjà vus (éviter les notifications en double)
const seenHistoriques: Map<string, number> = new Map();
const seenSignalementHistoriques: Map<string, number> = new Map();

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
 * Demander la permission de notification sur le web
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Capacitor.isNativePlatform()) {
    // Sur mobile, les permissions sont gérées par FCM
    return true;
  }

  if (!('Notification' in window)) {
    console.log("⚠️ Les notifications ne sont pas supportées par ce navigateur");
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log("✅ Permission de notification accordée");
    return true;
  }

  if (Notification.permission === 'denied') {
    console.log("⚠️ Les notifications ont été refusées. Pour les réactiver:");
    console.log("   1. Cliquez sur l'icône cadenas 🔒 à gauche de l'URL");
    console.log("   2. Trouvez 'Notifications' et changez en 'Autoriser'");
    console.log("   3. Rechargez la page");
    return false;
  }

  // Permission = 'default', demander la permission
  console.log("📢 Demande de permission de notification...");
  const permission = await Notification.requestPermission();
  console.log("Permission de notification:", permission);
  return permission === 'granted';
};

/**
 * Afficher une notification locale (pour le web ou quand l'app est au premier plan)
 */
const showLocalNotification = async (title: string, body: string): Promise<void> => {
  // Toujours afficher dans la console pour le debug
  console.log(`🔔 [NOTIFICATION] ${title}: ${body}`);
  
  if (Capacitor.isNativePlatform()) {
    // Sur mobile, utiliser LocalNotifications pour afficher une vraie notification
    try {
      // Demander la permission si nécessaire
      const permStatus = await LocalNotifications.checkPermissions();
      if (permStatus.display !== 'granted') {
        const newPerm = await LocalNotifications.requestPermissions();
        if (newPerm.display !== 'granted') {
          console.log('⚠️ Permission de notification locale refusée');
          return;
        }
      }
      
      // Envoyer la notification locale
      await LocalNotifications.schedule({
        notifications: [
          {
            id: localNotificationId++,
            title: title,
            body: body,
            schedule: { at: new Date(Date.now() + 100) }, // Afficher immédiatement
            sound: 'default',
            smallIcon: 'ic_notification',
            iconColor: '#3880ff'
          }
        ]
      });
      console.log('✅ Notification locale envoyée sur mobile');
    } catch (error) {
      console.error('Erreur notification locale:', error);
    }
    return;
  }
  
  // Sur web, demander la permission si nécessaire puis afficher
  const hasPermission = await requestNotificationPermission();
  if (hasPermission) {
    new Notification(title, { body });
  }
};

/**
 * Sauvegarder une notification dans Firestore
 */
const saveNotificationToFirestore = async (
  utilisateurId: string, 
  signalementId: string, 
  message: string
): Promise<string | null> => {
  try {
    const notificationData = {
      utilisateurId,
      signalementId,
      message,
      createdAt: new Date().toISOString(),
      readAt: null,
      lue: false
    };

    const notificationsRef = collection(db, "notifications");
    const docRef = await addDoc(notificationsRef, notificationData);
    console.log("Notification sauvegardée avec l'ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Erreur sauvegarde notification:", error);
    return null;
  }
};

/**
 * Récupérer les notifications non lues de l'utilisateur
 */
export const getUnreadNotifications = async (): Promise<UserNotification[]> => {
  const user = auth.currentUser;
  if (!user) {
    return [];
  }

  try {
    const notificationsRef = collection(db, "notifications");
    // Requête simple avec un seul where pour éviter l'index composite
    const q = query(
      notificationsRef, 
      where("utilisateurId", "==", user.uid)
    );
    const snapshot = await getDocs(q);

    // Filtrer les non lues côté client
    const notifications: UserNotification[] = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<UserNotification, 'id'>
      }))
      .filter(n => n.lue === false);

    // Trier côté client par createdAt desc
    notifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    console.log(`${notifications.length} notifications non lues trouvées`);
    return notifications;
  } catch (error) {
    console.error("Erreur récupération notifications:", error);
    return [];
  }
};

/**
 * Marquer une notification comme lue
 */
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, {
      lue: true,
      readAt: new Date().toISOString()
    });
    console.log("Notification marquée comme lue:", notificationId);
    return true;
  } catch (error) {
    console.error("Erreur marquage notification:", error);
    return false;
  }
};

/**
 * Marquer toutes les notifications de l'utilisateur comme lues
 */
export const markAllNotificationsAsRead = async (): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) {
    return false;
  }

  try {
    const unreadNotifications = await getUnreadNotifications();
    const readAt = new Date().toISOString();

    for (const notification of unreadNotifications) {
      const notificationRef = doc(db, "notifications", notification.id);
      await updateDoc(notificationRef, {
        lue: true,
        readAt
      });
    }

    console.log(`${unreadNotifications.length} notifications marquées comme lues`);
    return true;
  } catch (error) {
    console.error("Erreur marquage toutes notifications:", error);
    return false;
  }
};

/**
 * Afficher les notifications non lues lors de la connexion
 * Les notifications affichées sont automatiquement marquées comme lues
 */
export const pushUnreadNotificationsOnConnect = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    console.log("⚠️ pushUnreadNotificationsOnConnect: Utilisateur non connecté");
    return;
  }

  console.log("📬 pushUnreadNotificationsOnConnect: Recherche des notifications non lues...");

  try {
    const unreadNotifications = await getUnreadNotifications();
    
    if (unreadNotifications.length === 0) {
      console.log("✅ Aucune notification non lue");
      return;
    }

    console.log(`📬 ${unreadNotifications.length} notifications non lues à afficher:`);
    unreadNotifications.forEach((notif, i) => {
      console.log(`   ${i + 1}. [${notif.id}] ${notif.message}`);
    });

    // Afficher les notifications (max 5 pour ne pas spam)
    const notificationsToShow = unreadNotifications.slice(0, 5);
    notificationsToShow.forEach((notification, index) => {
      // Délai progressif pour éviter de spam l'utilisateur
      setTimeout(async () => {
        showLocalNotification("📢 Notification", notification.message);
        // Marquer comme lue après affichage
        await markNotificationAsRead(notification.id);
      }, index * 2000); // 2 secondes entre chaque notification
    });

    // Si plus de 5 notifications, les marquer toutes comme lues
    if (unreadNotifications.length > 5) {
      setTimeout(async () => {
        showLocalNotification(
          "📬 Notifications", 
          `Vous avez ${unreadNotifications.length - 5} autres notifications non lues`
        );
        // Marquer les notifications restantes comme lues
        for (const notification of unreadNotifications.slice(5)) {
          await markNotificationAsRead(notification.id);
        }
      }, 5 * 2000);
    }
  } catch (error) {
    console.error("❌ Erreur affichage notifications non lues:", error);
  }
};

/**
 * Synchroniser les notifications manquantes au démarrage de l'application
 * Vérifie les historiques de signalements et crée les notifications manquantes
 */
export const syncMissingNotifications = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    console.log("Utilisateur non connecté, impossible de synchroniser les notifications");
    return;
  }

  try {
    console.log("Synchronisation des notifications manquantes...");

    // 1. Récupérer les libellés des statuts de signalement
    const statutsRef = collection(db, "signalement_statuts");
    const statutsDocs = await getDocs(statutsRef);
    const statutsMap = new Map<string, string>();
    statutsDocs.docs.forEach(docItem => {
      const data = docItem.data();
      statutsMap.set(docItem.id, data.libelle || docItem.id);
    });

    // 2. Récupérer tous les signalements de l'utilisateur
    const signalementRef = collection(db, "signalements");
    const signalementQuery = query(signalementRef, where("utilisateurId", "==", user.uid));
    const signalementDocs = await getDocs(signalementQuery);

    if (signalementDocs.empty) {
      console.log("Aucun signalement trouvé pour l'utilisateur");
      return;
    }

    // 3. Récupérer toutes les notifications existantes de l'utilisateur
    const notificationsRef = collection(db, "notifications");
    const notificationsQuery = query(notificationsRef, where("utilisateurId", "==", user.uid));
    const notificationsDocs = await getDocs(notificationsQuery);
    
    // Créer un Set des messages existants pour éviter les doublons
    const existingMessages = new Set<string>();
    notificationsDocs.docs.forEach(docItem => {
      const data = docItem.data();
      existingMessages.add(data.message);
    });

    let notificationsCreated = 0;

    // 4. Pour chaque signalement, vérifier les historiques
    for (const sigDoc of signalementDocs.docs) {
      const sigData = sigDoc.data();
      const sigId = sigDoc.id;
      const historiques = sigData.historiques || [];

      // Ignorer le premier historique (création du signalement)
      // Vérifier les historiques suivants (mises à jour de statut)
      for (let i = 1; i < historiques.length; i++) {
        const historique = historiques[i];
        const statutLibelle = statutsMap.get(historique.statutId) || historique.statutId;
        const message = `Votre signalement (${sigId}) a été mis à jour en "${statutLibelle}"`;

        // Vérifier si cette notification existe déjà
        if (!existingMessages.has(message)) {
          await saveNotificationToFirestore(user.uid, sigId, message);
          existingMessages.add(message); // Éviter les doublons dans cette session
          notificationsCreated++;
        }
      }
    }

    if (notificationsCreated > 0) {
      console.log(`${notificationsCreated} notifications manquantes créées`);
    } else {
      console.log("Aucune notification manquante à créer");
    }
  } catch (error) {
    console.error("Erreur synchronisation notifications:", error);
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
 * Démarrer l'écoute des changements d'historiques sur les signalements
 * de l'utilisateur connecté
 */
export const startListeningToMySignalementsHistoriques = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    console.log("Utilisateur non connecté, impossible d'écouter les historiques de signalements");
    return;
  }

  if (signalementsUnsubscribe) {
    console.log("Déjà en écoute des historiques de signalements");
    return;
  }

  try {
    // Récupérer les libellés des statuts de signalement
    const statutsRef = collection(db, "signalement_statuts");
    const statutsDocs = await getDocs(statutsRef);
    const statutsMap = new Map<string, string>();
    statutsDocs.docs.forEach(doc => {
      const data = doc.data();
      statutsMap.set(doc.id, data.libelle || doc.id);
    });

    // Écouter les signalements de l'utilisateur
    const signalementRef = collection(db, "signalements");
    const signalementQuery = query(signalementRef, where("utilisateurId", "==", user.uid));

    signalementsUnsubscribe = onSnapshot(signalementQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const sigData = change.doc.data();
        const sigId = change.doc.id;
        
        const historiques = sigData.historiques || [];
        const previousCount = seenSignalementHistoriques.get(sigId) || 0;
        
        if (change.type === "added") {
          // Premier chargement, initialiser le cache
          seenSignalementHistoriques.set(sigId, historiques.length);
        } else if (change.type === "modified" && historiques.length > previousCount) {
          // Nouvel historique ajouté !
          const newHistoriques = historiques.slice(previousCount);
          seenSignalementHistoriques.set(sigId, historiques.length);
          
          // Envoyer une notification pour chaque nouvel historique et sauvegarder dans Firestore
          newHistoriques.forEach(async (historique: any) => {
            const statutLibelle = statutsMap.get(historique.statutId) || historique.statutId;
            const message = `Votre signalement (${sigId}) a été mis à jour en "${statutLibelle}"`;
            const title = "📢 Mise à jour de votre signalement";
            
            // Sauvegarder la notification dans Firestore
            const notifId = await saveNotificationToFirestore(user.uid, sigId, message);
            
            console.log("Notification signalement:", title, message);
            showLocalNotification(title, message);
            
            // Marquer comme lue après affichage
            if (notifId) {
              await markNotificationAsRead(notifId);
            }
          });
        }
      });
    }, (error) => {
      console.error("Erreur écoute signalements:", error);
    });

    console.log("Écoute des historiques de signalements démarrée");
  } catch (error) {
    console.error("Erreur démarrage écoute historiques signalements:", error);
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
  if (signalementsUnsubscribe) {
    signalementsUnsubscribe();
    signalementsUnsubscribe = null;
  }
  isListening = false;
  seenHistoriques.clear();
  seenSignalementHistoriques.clear();
  console.log("Écoute des historiques arrêtée");
};

/**
 * Vérifier si l'écoute est active
 */
export const isListeningToHistoriques = (): boolean => {
  return isListening;
};
