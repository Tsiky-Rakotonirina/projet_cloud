<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start" v-if="currentUser">
          <ion-button @click="goToProfile">
            <ion-icon :icon="personOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Accueil</ion-title>
        <ion-buttons slot="end">
          <ion-button v-if="currentUser" @click="handleLogout">
            <ion-icon :icon="logOutOutline" slot="start"></ion-icon>
          </ion-button>
          <ion-button v-else @click="goToLogin">
            <ion-icon :icon="logInOutline" slot="start"></ion-icon>
            Connexion
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true" class="ion-padding">
      <div class="welcome-section">
        <h1>Bienvenue {{ currentUser ? '!' : 'visiteur !' }}</h1>
        <p>Explorez la carte d'Antananarivo</p>
        <p v-if="!currentUser" class="hint">Connectez-vous pour signaler des problèmes routiers</p>
      </div>

      <!-- Carte Mon Profil (visible uniquement si connecté) -->
      <ion-card v-if="currentUser">
        <ion-card-header>
          <ion-card-title>Mon Profil</ion-card-title>
          <ion-card-subtitle>{{ currentUser.email }}</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <p>Gérez vos informations personnelles et consultez vos signalements.</p>
          <ion-button expand="block" @click="goToProfile" class="ion-margin-top" color="tertiary">
            <ion-icon :icon="personOutline" slot="start"></ion-icon>
            Voir mon profil
          </ion-button>
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-card-header>
          <ion-card-title>Carte Interactive</ion-card-title>
          <ion-card-subtitle>Découvrez Antananarivo</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <p>Visualisez et explorez les différents points d'intérêt de la ville d'Antananarivo.</p>
          <ion-button expand="block" @click="goToMap" class="ion-margin-top">
            <ion-icon :icon="mapOutline" slot="start"></ion-icon>
            Ouvrir la carte
          </ion-button>
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-card-header>
          <ion-card-title>Tableau Récapitulatif</ion-card-title>
          <ion-card-subtitle>Statistiques des problèmes routiers</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <p>Consultez le récapitulatif complet : nombre de points, surfaces, budget et avancement.</p>
          <ion-button expand="block" @click="goToRecap" class="ion-margin-top" color="secondary">
            <ion-icon :icon="statsChartOutline" slot="start"></ion-icon>
            Voir le tableau récapitulatif
          </ion-button>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonButtons,
  IonList,
  IonItem,
  IonLabel,
} from '@ionic/vue';
import { mapOutline, logOutOutline, logInOutline, locationOutline, statsChartOutline, personOutline } from 'ionicons/icons';
import { logout, currentUser } from '@/services/firebase/authService';

const router = useRouter();

const goToMap = () => {
  router.push({ name: 'map' });
};

const goToRecap = () => {
  router.push({ name: 'recap' });
};

const goToProfile = () => {
  router.push({ name: 'profile' });
};

const goToLogin = () => {
  router.push({ name: 'login' });
};

const handleLogout = async () => {
  try {
    await logout();
    router.push({ name: 'home' });
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
  }
};
</script>

<style scoped>
.welcome-section {
  text-align: center;
  margin: 2rem 0;
}

.welcome-section h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.welcome-section p {
  color: var(--ion-color-medium);
}

.welcome-section .hint {
  font-size: 0.85rem;
  color: var(--ion-color-primary);
  margin-top: 0.5rem;
  font-style: italic;
}
</style>
