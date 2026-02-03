<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
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

// Initialiser les notifications et l'écoute des historiques
onMounted(async () => {
  // Initialiser les notifications push
  await initNotifications();
  
  // Écouter les changements d'état d'authentification
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Utilisateur connecté: démarrer l'écoute des historiques de problèmes
      console.log('Utilisateur connecté, démarrage écoute notifications...');
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
