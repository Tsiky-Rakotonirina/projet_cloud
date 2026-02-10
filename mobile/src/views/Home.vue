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
          <!-- Notification icon (only for connected users) -->
          <ion-button v-if="currentUser" @click="openNotifications" class="notification-btn">
            <i class="fas fa-bell"></i>
            <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
          </ion-button>
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

    <!-- Notifications Modal -->
    <NotificationList 
      :is-open="showNotifications" 
      @close="closeNotifications"
      @unread-count-changed="handleUnreadCountChanged"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ref, onMounted, watch } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
} from '@ionic/vue';
import { logout, currentUser } from '@/services/firebase/auth.service';
import { getUnreadNotificationsCount } from '@/services/firebase/notification.service';
import NotificationList from '@/components/NotificationList.vue';

const router = useRouter();

// Notifications state
const showNotifications = ref(false);
const unreadCount = ref(0);

// Charger le nombre de notifications non lues
const loadUnreadCount = async () => {
  if (currentUser.value) {
    unreadCount.value = await getUnreadNotificationsCount();
  } else {
    unreadCount.value = 0;
  }
};

// Surveiller les changements d'utilisateur
watch(currentUser, async (user) => {
  if (user) {
    await loadUnreadCount();
  } else {
    unreadCount.value = 0;
  }
});

// Charger au montage si l'utilisateur est déjà connecté
onMounted(async () => {
  await loadUnreadCount();
});

const openNotifications = () => {
  showNotifications.value = true;
};

const closeNotifications = () => {
  showNotifications.value = false;
};

const handleUnreadCountChanged = (count: number) => {
  unreadCount.value = count;
};

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
  --background: #FFFFFF;
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
  background: rgba(39, 76, 119, 0.1);
  border: 2px solid rgba(39, 76, 119, 0.15);
  border-radius: 18px;
  margin-bottom: 16px;
}

.welcome-icon i {
  font-size: 28px;
  color: #274c77;
}

.welcome-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 4px 0;
}

.welcome-subtitle {
  font-size: 15px;
  color: #6B7280;
  margin: 0;
}

.welcome-hint {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #274c77;
  margin-top: 12px;
  padding: 8px 16px;
  background: rgba(39, 76, 119, 0.08);
  border-radius: 20px;
}

/* Feature Cards */
.feature-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid #E2E8F0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
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
  background: rgba(39, 76, 119, 0.1);
}

.card-icon-primary i {
  color: #274c77;
}

.card-icon-secondary {
  background: rgba(96, 150, 186, 0.15);
}

.card-icon-secondary i {
  color: #6096ba;
}

.card-icon-tertiary {
  background: rgba(107, 114, 128, 0.12);
}

.card-icon-tertiary i {
  color: #6B7280;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 2px 0;
}

.card-subtitle {
  font-size: 13px;
  color: #274c77;
  margin: 0 0 4px 0;
}

.card-description {
  font-size: 13px;
  color: #6B7280;
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
  background: #274c77;
  color: #FFFFFF;
}

.card-btn-primary:hover {
  background: #1d3a5c;
}

.card-btn-secondary {
  background: #6096ba;
  color: white;
}

.card-btn-secondary:hover {
  background: #4d7d9e;
}

.card-btn-tertiary {
  background: #6B7280;
  color: white;
}

.card-btn-tertiary:hover {
  background: #5a6070;
}

/* Header toolbar button icon size */
ion-toolbar ion-button i {
  font-size: 18px;
}

/* Notification button styles */
.notification-btn {
  position: relative;
}

.notification-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #EF4444;
  color: #FFFFFF;
  font-size: 10px;
  font-weight: 700;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
</style>
