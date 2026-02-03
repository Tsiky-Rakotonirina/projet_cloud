<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet, toastController } from '@ionic/vue';
import { onMounted, onUnmounted } from 'vue';
import { initActivityDetection, setSessionTimeout } from './services/firebase/auth.service';
import { 
  initNotifications, 
  startListeningToMyProblemsHistoriques,
  stopListeningToMyProblemsHistoriques 
} from './services/firebase/notification.service';
import { auth } from './services/firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Définir la durée de session (optionnel, défaut 30 min)
setSessionTimeout(60); // 1 heure

// Activer la détection d'activité
initActivityDetection();

// Afficher une notification toast de bienvenue
const showWelcomeNotification = async (displayName: string | null, email: string | null) => {
  const toast = await toastController.create({
    message: `Bienvenue ${displayName || email || 'utilisateur'} !`,
    duration: 3000,
    position: 'top',
    color: 'success',
    icon: 'notifications-outline',
    buttons: [
      {
        text: 'OK',
        role: 'cancel'
      }
    ]
  });
  await toast.present();
};

// Initialiser les notifications et l'écoute des historiques
onMounted(async () => {
  // Initialiser les notifications push
  await initNotifications();
  
  // Écouter les changements d'état d'authentification
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Utilisateur connecté: démarrer l'écoute des historiques de problèmes
      console.log('Utilisateur connecté, démarrage écoute notifications...');
      
      // Afficher notification de bienvenue
      await showWelcomeNotification(user.displayName, user.email);
      
      // Démarrer l'écoute des historiques
      await startListeningToMyProblemsHistoriques();
    } else {
      // Utilisateur déconnecté: arrêter l'écoute
      console.log('Utilisateur déconnecté, arrêt écoute notifications');
      stopListeningToMyProblemsHistoriques();
    }
  });
});

// Nettoyage à la destruction du composant
onUnmounted(() => {
  stopListeningToMyProblemsHistoriques();
});
</script>
