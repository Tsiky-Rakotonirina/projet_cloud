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
        <!-- Unread count header -->
        <div v-if="unreadCount > 0" class="unread-header">
          <div class="unread-badge">
            <i class="fas fa-envelope"></i>
            <span>{{ unreadCount }} nouvelle{{ unreadCount > 1 ? 's' : '' }}</span>
          </div>
          <button class="mark-all-btn" @click="markAllAsRead">
            <i class="fas fa-check-double"></i>
            Tout marquer comme lu
          </button>
        </div>

        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          :class="['notification-card', { 'unread': !notification.lue }]"
          @click="handleNotificationClick(notification)"
        >
          <div :class="['notification-icon', getNotificationType(notification)]">
            <i :class="getNotificationIcon(notification)"></i>
            <span v-if="!notification.lue" class="unread-indicator"></span>
          </div>
          <div class="notification-body">
            <div class="notification-header">
              <span v-if="!notification.lue" class="new-badge">
                <i class="fas fa-circle"></i> Nouveau
              </span>
              <span class="notification-time">
                <i class="far fa-clock"></i>
                {{ formatDate(notification.createdAt) }}
              </span>
            </div>
            <p class="notification-message">{{ notification.message }}</p>
            <div v-if="notification.lue && notification.readAt" class="notification-read-info">
              <i class="fas fa-eye"></i>
              Lu {{ formatDate(notification.readAt) }}
            </div>
          </div>
          <div class="notification-action">
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
import { ref, onMounted, watch, computed } from 'vue';
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

// Computed pour le nombre de non lues
const unreadCount = computed(() => notifications.value.filter(n => !n.lue).length);

// Marquer toutes comme lues
const markAllAsRead = async () => {
  try {
    for (const notification of notifications.value.filter(n => !n.lue)) {
      await markNotificationAsRead(notification.id);
      notification.lue = true;
      notification.readAt = new Date().toISOString();
    }
  } catch (error) {
    console.error('Erreur marquage notifications:', error);
  }
};

// Déterminer le type de notification pour le style
const getNotificationType = (notification: UserNotification): string => {
  const msg = notification.message?.toLowerCase() || '';
  if (msg.includes('approuvé') || msg.includes('résolu') || msg.includes('terminé')) {
    return 'type-success';
  }
  if (msg.includes('rejeté') || msg.includes('refusé') || msg.includes('erreur')) {
    return 'type-danger';
  }
  if (msg.includes('en cours') || msg.includes('traitement') || msg.includes('attente')) {
    return 'type-warning';
  }
  return 'type-info';
};

// Icône selon le type
const getNotificationIcon = (notification: UserNotification): string => {
  const msg = notification.message?.toLowerCase() || '';
  if (msg.includes('approuvé') || msg.includes('résolu') || msg.includes('terminé')) {
    return 'fas fa-check-circle';
  }
  if (msg.includes('rejeté') || msg.includes('refusé') || msg.includes('erreur')) {
    return 'fas fa-times-circle';
  }
  if (msg.includes('en cours') || msg.includes('traitement') || msg.includes('attente')) {
    return 'fas fa-hourglass-half';
  }
  return 'fas fa-bell';
};

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
  --background: #F8FAFC;
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--ion-color-medium);
}

.loading-container p {
  margin-top: 16px;
  font-size: 14px;
  font-weight: 500;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 350px;
  text-align: center;
  padding: 32px;
}

.empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, rgba(107, 114, 128, 0.08) 0%, rgba(107, 114, 128, 0.15) 100%);
  border: 2px solid rgba(107, 114, 128, 0.12);
  border-radius: 24px;
  margin-bottom: 20px;
}

.empty-icon i {
  font-size: 32px;
  color: var(--ion-color-medium);
}

.empty-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--ion-color-dark);
  margin: 0 0 8px 0;
}

.empty-subtitle {
  font-size: 14px;
  color: var(--ion-color-medium);
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(39, 76, 119, 0.3);
  transition: all 0.2s ease;
}

.action-btn:active {
  transform: scale(0.97);
  box-shadow: 0 2px 8px rgba(39, 76, 119, 0.3);
}

/* Unread Header */
.unread-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(39, 76, 119, 0.06);
  border-radius: 12px;
  margin-bottom: 16px;
  border: 1px solid rgba(39, 76, 119, 0.1);
}

.unread-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ion-color-primary);
}

.unread-badge i {
  font-size: 14px;
}

.mark-all-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--ion-color-primary);
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.mark-all-btn:active {
  background: var(--ion-color-primary-shade);
}

/* Notifications List */
.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Notification Card */
.notification-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background: #FFFFFF;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid var(--color-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.2s ease;
}

.notification-card:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.notification-card.unread {
  background: linear-gradient(135deg, rgba(39, 76, 119, 0.03) 0%, rgba(96, 150, 186, 0.05) 100%);
  border-color: rgba(39, 76, 119, 0.2);
  box-shadow: 0 2px 12px rgba(39, 76, 119, 0.08);
}

/* Notification Icon */
.notification-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  flex-shrink: 0;
}

.notification-icon i {
  font-size: 20px;
}

.notification-icon.type-info {
  background: rgba(59, 130, 246, 0.12);
}
.notification-icon.type-info i {
  color: #3B82F6;
}

.notification-icon.type-success {
  background: rgba(16, 185, 129, 0.12);
}
.notification-icon.type-success i {
  color: var(--ion-color-success);
}

.notification-icon.type-warning {
  background: rgba(245, 158, 11, 0.12);
}
.notification-icon.type-warning i {
  color: var(--ion-color-warning);
}

.notification-icon.type-danger {
  background: rgba(239, 68, 68, 0.12);
}
.notification-icon.type-danger i {
  color: var(--ion-color-danger);
}

.unread-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
  background: var(--ion-color-danger);
  border-radius: 50%;
  border: 2px solid #FFFFFF;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

/* Notification Body */
.notification-body {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.new-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: var(--ion-color-danger);
  color: #FFFFFF;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.new-badge i {
  font-size: 6px;
}

.notification-time {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--ion-color-medium);
}

.notification-time i {
  font-size: 11px;
}

.notification-message {
  font-size: 14px;
  font-weight: 500;
  color: var(--ion-color-dark);
  margin: 0 0 6px 0;
  line-height: 1.45;
}

.notification-card.unread .notification-message {
  font-weight: 600;
  color: var(--ion-color-primary);
}

.notification-read-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--ion-color-medium);
  padding: 4px 8px;
  background: rgba(107, 114, 128, 0.08);
  border-radius: 6px;
  width: fit-content;
}

.notification-read-info i {
  font-size: 10px;
  color: var(--ion-color-success);
}

/* Notification Action Arrow */
.notification-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba(107, 114, 128, 0.08);
  flex-shrink: 0;
  align-self: center;
}

.notification-action i {
  font-size: 12px;
  color: var(--ion-color-medium);
}

.notification-card.unread .notification-action {
  background: rgba(39, 76, 119, 0.1);
}

.notification-card.unread .notification-action i {
  color: var(--ion-color-primary);
}
</style>
