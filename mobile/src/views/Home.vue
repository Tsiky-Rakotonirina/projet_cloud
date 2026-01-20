<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start" v-if="currentUser">
          <ion-button @click="goToProfile">
            <i class="fas fa-user"></i>
          </ion-button>
        </ion-buttons>
        <ion-title>Lalan-Tsara</ion-title>
        <ion-buttons slot="end">
          <ion-button v-if="currentUser" @click="handleLogout" color="danger">
            <i class="fas fa-sign-out-alt"></i>
          </ion-button>
          <ion-button v-else @click="goToLogin">
            <i class="fas fa-sign-in-alt"></i>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true" class="ion-padding home-content">
      <!-- Welcome Section -->
      <div class="welcome-section">
        <div class="welcome-icon">
          <i class="fas fa-road"></i>
        </div>
        <h1 class="welcome-title">
          Bienvenue{{ currentUser ? ' !' : ', visiteur !' }}
        </h1>
        <p class="welcome-subtitle">Explorez la carte d'Antananarivo</p>
        <p v-if="!currentUser" class="welcome-hint">
          <i class="fas fa-info-circle"></i>
          Connectez-vous pour signaler des problèmes routiers
        </p>
      </div>

      <!-- Card Mon Profil (visible uniquement si connecté) -->
      <div v-if="currentUser" class="feature-card">
        <div class="card-icon-box card-icon-tertiary">
          <i class="fas fa-user-circle"></i>
        </div>
        <div class="card-content">
          <h3 class="card-title">Mon Profil</h3>
          <p class="card-subtitle">{{ currentUser.email }}</p>
          <p class="card-description">Gérez vos informations et consultez vos signalements.</p>
        </div>
        <button class="card-btn card-btn-tertiary" @click="goToProfile">
          <i class="fas fa-arrow-right"></i>
        </button>
      </div>

      <!-- Card Carte Interactive -->
      <div class="feature-card">
        <div class="card-icon-box card-icon-primary">
          <i class="fas fa-map-marked-alt"></i>
        </div>
        <div class="card-content">
          <h3 class="card-title">Carte Interactive</h3>
          <p class="card-subtitle">Découvrez Antananarivo</p>
          <p class="card-description">Visualisez les points d'intérêt et les problèmes signalés.</p>
        </div>
        <button class="card-btn card-btn-primary" @click="goToMap">
          <i class="fas fa-arrow-right"></i>
        </button>
      </div>

      <!-- Card Tableau Récapitulatif -->
      <div class="feature-card">
        <div class="card-icon-box card-icon-secondary">
          <i class="fas fa-chart-bar"></i>
        </div>
        <div class="card-content">
          <h3 class="card-title">Tableau Récapitulatif</h3>
          <p class="card-subtitle">Statistiques des problèmes</p>
          <p class="card-description">Consultez les données complètes : surfaces, budget et avancement.</p>
        </div>
        <button class="card-btn card-btn-secondary" @click="goToRecap">
          <i class="fas fa-arrow-right"></i>
        </button>
      </div>
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
  IonButton,
  IonButtons,
} from '@ionic/vue';
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
.home-content {
  --background: #243B4A;
}

.welcome-section {
  text-align: center;
  padding: 24px 0 32px;
}

.welcome-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: rgba(135, 188, 222, 0.12);
  border: 2px solid rgba(135, 188, 222, 0.2);
  border-radius: 18px;
  margin-bottom: 16px;
}

.welcome-icon i {
  font-size: 28px;
  color: #87BCDE;
}

.welcome-title {
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin: 0 0 4px 0;
}

.welcome-subtitle {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.welcome-hint {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #87BCDE;
  margin-top: 12px;
  padding: 8px 16px;
  background: rgba(135, 188, 222, 0.1);
  border-radius: 20px;
}

/* Feature Cards */
.feature-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #2D4654;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid rgba(135, 188, 222, 0.12);
}

.card-icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  flex-shrink: 0;
}

.card-icon-box i {
  font-size: 22px;
}

.card-icon-primary {
  background: rgba(135, 188, 222, 0.15);
}

.card-icon-primary i {
  color: #87BCDE;
}

.card-icon-secondary {
  background: rgba(128, 94, 115, 0.15);
}

.card-icon-secondary i {
  color: #805E73;
}

.card-icon-tertiary {
  background: rgba(78, 77, 92, 0.2);
}

.card-icon-tertiary i {
  color: #9090a0;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin: 0 0 2px 0;
}

.card-subtitle {
  font-size: 13px;
  color: #87BCDE;
  margin: 0 0 4px 0;
}

.card-description {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  line-height: 1.4;
}

.card-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
}

.card-btn i {
  font-size: 16px;
}

.card-btn-primary {
  background: #87BCDE;
  color: #243B4A;
}

.card-btn-primary:hover {
  background: #6fa8cc;
}

.card-btn-secondary {
  background: #805E73;
  color: white;
}

.card-btn-secondary:hover {
  background: #6a4d60;
}

.card-btn-tertiary {
  background: #4E4D5C;
  color: white;
}

.card-btn-tertiary:hover {
  background: #5d5c6d;
}

/* Header buttons */
ion-toolbar ion-button i {
  font-size: 18px;
}
</style>
