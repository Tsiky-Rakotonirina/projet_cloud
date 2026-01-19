<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { initActivityDetection, setSessionTimeout } from './authService';

// Définir la durée de session (optionnel, défaut 30 min)
setSessionTimeout(60); // 1 heure

// Activer la détection d'activité
initActivityDetection();
</script>
