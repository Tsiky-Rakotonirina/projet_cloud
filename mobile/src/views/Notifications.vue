<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start" v-if="currentUser">
          <ion-button @click="goToProfile">
            <i class="fas fa-user"></i>
          </ion-button>
        </ion-buttons>
        <ion-title>Notifications</ion-title>
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
    
    <ion-content :fullscreen="true" class="ion-padding notifications-content">
      <!-- Not connected state -->
      <div v-if="!currentUser" class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-bell-slash"></i>
        </div>
        <h2 class="empty-title">Notifications</h2>
        <p class="empty-subtitle">Connectez-vous pour voir vos notifications</p>
        <button class="action-btn" @click="goToLogin">
          <i class="fas fa-sign-in-alt"></i>
          Se connecter
        </button>
      </div>

      <!-- Loading -->
      <div v-else-if="loading" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Chargement des notifications...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="notifications.length === 0" class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-bell-slash"></i>
        </div>
        <h2 class="empty-title">Aucune notification</h2>
        <p class="empty-subtitle">Vos notifications apparaîtront ici</p>
      </div>

      <!-- Notifications list -->
      <div v-else class="notifications-list">
        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          :class="['notification-card', { 'unread': !notification.lue }]"
          @click="handleNotificationClick(notification)"
        >
          <div :class="['card-icon-box', notification.lue ? 'card-icon-read' : 'card-icon-unread']">
            <i class="fas fa-bell"></i>
            <span v-if="!notification.lue" class="unread-dot"></span>
          </div>
          <div class="card-content">
            <p class="card-message">{{ notification.message }}</p>
            <p class="card-date">{{ formatDate(notification.createdAt) }}</p>
            <p v-if="notification.readAt" class="card-read-date">
              Lu le {{ formatDate(notification.readAt) }}
            </p>
          </div>
          <div class="card-arrow">
            <i class="fas fa-chevron-right"></i>
          </div>
        </div>
      </div>
    </ion-content>

    <!-- Signalement Details Modal -->
    <ion-modal :is-open="showDetailsModal" @did-dismiss="closeDetailsModal">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button @click="closeDetailsModal">
              <i class="fas fa-arrow-left"></i>
            </ion-button>
          </ion-buttons>
          <ion-title>Détails du Signalement</ion-title>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="ion-padding">
        <div v-if="loadingDetails" class="loading-container">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Chargement des détails...</p>
        </div>
        <SignalementDetailsPopup 
          v-else-if="selectedSignalement" 
          :signalement="selectedSignalement" 
        />
        <div v-else class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <p>Signalement non trouvé</p>
        </div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonModal,
  IonSpinner
} from '@ionic/vue';
import { logout, currentUser } from '@/services/firebase/auth.service';
import { 
  getAllNotifications, 
  markNotificationAsRead 
} from '@/services/firebase/notification.service';
import { getSignalementById } from '@/services/problem.service';
import SignalementDetailsPopup from '@/components/SignalementDetailsPopup.vue';
import type { UserNotification, Signalement } from '@/types/entities';

const router = useRouter();

const loading = ref(false);
const loadingDetails = ref(false);
const notifications = ref<UserNotification[]>([]);
const showDetailsModal = ref(false);
const selectedSignalement = ref<Signalement | null>(null);

// Charger les notifications quand l'utilisateur est connecté
const loadNotifications = async () => {
  if (!currentUser.value) {
    notifications.value = [];
    return;
  }
  
  loading.value = true;
  try {
    notifications.value = await getAllNotifications();
  } catch (error) {
    console.error('Erreur chargement notifications:', error);
  } finally {
    loading.value = false;
  }
};

// Surveiller les changements d'utilisateur
watch(currentUser, async (user) => {
  if (user) {
    await loadNotifications();
  } else {
    notifications.value = [];
  }
});

// Charger au montage
onMounted(async () => {
  await loadNotifications();
});

const handleNotificationClick = async (notification: UserNotification) => {
  // Marquer comme lue si elle ne l'était pas
  if (!notification.lue) {
    await markNotificationAsRead(notification.id);
    notification.lue = true;
    notification.readAt = new Date().toISOString();
  }

  // Charger et afficher les détails du signalement
  loadingDetails.value = true;
  showDetailsModal.value = true;
  
  try {
    selectedSignalement.value = await getSignalementById(notification.signalementId);
  } catch (error) {
    console.error('Erreur chargement signalement:', error);
    selectedSignalement.value = null;
  } finally {
    loadingDetails.value = false;
  }
};

const closeDetailsModal = () => {
  showDetailsModal.value = false;
  selectedSignalement.value = null;
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
    router.push({ name: 'tabs-home' });
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
  }
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Hier';
  } else if (diffDays < 7) {
    return `Il y a ${diffDays} jours`;
  } else {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }
};
</script>

<style scoped>
.notifications-content {
  --background: #FFFFFF;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #6B7280;
}

.loading-container p {
  margin-top: 12px;
  font-size: 14px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  text-align: center;
  padding: 24px;
}

.empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: rgba(156, 163, 175, 0.1);
  border: 2px solid rgba(156, 163, 175, 0.15);
  border-radius: 18px;
  margin-bottom: 16px;
}

.empty-icon i {
  font-size: 28px;
  color: #9CA3AF;
}

.empty-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 4px 0;
}

.empty-subtitle {
  font-size: 14px;
  color: #6B7280;
  margin: 0 0 20px 0;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #274c77;
  color: #FFFFFF;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.action-btn:active {
  background: #1d3a5c;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #FFFFFF;
  border-radius: 16px;
  padding: 16px 20px;
  border: 1px solid #E2E8F0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.2s ease;
}

.notification-card:active {
  transform: scale(0.98);
}

.notification-card.unread {
  background: rgba(39, 76, 119, 0.04);
  border-color: rgba(39, 76, 119, 0.2);
}

.card-icon-box {
  position: relative;
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

.card-icon-read {
  background: rgba(107, 114, 128, 0.12);
}

.card-icon-read i {
  color: #6B7280;
}

.card-icon-unread {
  background: rgba(39, 76, 119, 0.1);
}

.card-icon-unread i {
  color: #274c77;
}

.unread-dot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  background: #EF4444;
  border-radius: 50%;
  border: 2px solid #FFFFFF;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-message {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
  margin: 0 0 4px 0;
  line-height: 1.4;
}

.notification-card.unread .card-message {
  font-weight: 600;
  color: #274c77;
}

.card-date {
  font-size: 13px;
  color: #6B7280;
  margin: 0;
}

.card-read-date {
  font-size: 12px;
  color: #9CA3AF;
  margin: 4px 0 0 0;
}

.card-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba(107, 114, 128, 0.08);
  flex-shrink: 0;
}

.card-arrow i {
  font-size: 12px;
  color: #9CA3AF;
}

.notification-card.unread .card-arrow {
  background: rgba(39, 76, 119, 0.1);
}

.notification-card.unread .card-arrow i {
  color: #274c77;
}
</style>
