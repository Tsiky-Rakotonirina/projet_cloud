const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

// Initialiser Firebase Admin
initializeApp();

const db = getFirestore();
const messaging = getMessaging();

/**
 * Cloud Function déclenchée quand une nouvelle notification est créée
 * Envoie une notification push FCM à l'utilisateur
 */
exports.sendPushOnNewNotification = onDocumentCreated(
  "notifications/{notificationId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log("Pas de données dans le snapshot");
      return null;
    }

    const notification = snapshot.data();
    const notificationId = event.params.notificationId;

    // Vérifier que c'est une notification non lue
    if (notification.lue === true || notification.readAt !== null) {
      console.log("Notification déjà lue, pas d'envoi push");
      return null;
    }

    const userId = notification.utilisateurId;
    if (!userId) {
      console.log("Pas d'utilisateurId dans la notification");
      return null;
    }

    try {
      // Récupérer le token FCM de l'utilisateur
      const tokenDoc = await db.collection("user_fcm_tokens").doc(userId).get();

      if (!tokenDoc.exists) {
        console.log(`Pas de token FCM pour l'utilisateur ${userId}`);
        return null;
      }

      const tokenData = tokenDoc.data();
      const fcmToken = tokenData.token;

      if (!fcmToken) {
        console.log(`Token FCM vide pour l'utilisateur ${userId}`);
        return null;
      }

      // Construire le message push
      const message = {
        token: fcmToken,
        notification: {
          title: "📢 Mise à jour de votre signalement",
          body: notification.message || "Votre signalement a été mis à jour"
        },
        data: {
          notificationId: notificationId,
          signalementId: notification.signalementId || "",
          type: "signalement_update"
        },
        // Options Android
        android: {
          priority: "high",
          notification: {
            channelId: "signalement_updates",
            icon: "ic_notification",
            color: "#3880ff"
          }
        },
        // Options iOS (APNs)
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: "default"
            }
          }
        }
      };

      // Envoyer la notification push
      const response = await messaging.send(message);
      console.log(`Notification push envoyée avec succès: ${response}`);
      console.log(`  -> Utilisateur: ${userId}`);
      console.log(`  -> Signalement: ${notification.signalementId}`);
      console.log(`  -> Message: ${notification.message}`);

      return response;
    } catch (error) {
      console.error("Erreur envoi notification push:", error);

      // Si le token est invalide, le supprimer
      if (
        error.code === "messaging/invalid-registration-token" ||
        error.code === "messaging/registration-token-not-registered"
      ) {
        console.log(`Token invalide, suppression pour l'utilisateur ${userId}`);
        await db.collection("user_fcm_tokens").doc(userId).delete();
      }

      return null;
    }
  }
);
