<template>
  <ion-modal :is-open="isOpen" @did-dismiss="closeModal">
    <ion-header>
      <ion-toolbar>
        <ion-title>Mes Notifications</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="closeModal">
            <i class="fas fa-times"></i>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding notification-content">
      <!-- Loading -->
      <div v-if="loading" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Chargement des notifications...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="notifications.length === 0" class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-bell-slash"></i>
        </div>
        <h3 class="empty-title">Aucune notification</h3>
        <p class="empty-subtitle">Vos notifications apparaîtront ici</p>
      </div>

      <!-- Notifications list -->
      <div v-else class="notifications-list">
        <!-- Unread summary -->
        <div v-if="unreadCount > 0" class="unread-summary">
          <div class="summary-left">
            <i class="fas fa-envelope"></i>
            <span>{{ unreadCount }} non lue{{ unreadCount > 1 ? 's' : '' }}</span>
          </div>
          <button class="mark-read-btn" @click="markAllAsRead">
            <i class="fas fa-check-double"></i>
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
            <span v-if="!notification.lue" class="unread-dot"></span>
          </div>
          <div class="notification-content">
            <div class="notification-meta">
              <span v-if="!notification.lue" class="badge-new">Nouveau</span>
              <span class="notification-date">
                <i class="far fa-clock"></i>
                {{ formatDate(notification.createdAt) }}
              </span>
            </div>
            <p class="notification-message">{{ notification.message }}</p>
            <div v-if="notification.lue && notification.readAt" class="read-status">
              <i class="fas fa-check"></i>
              Lu {{ formatDate(notification.readAt) }}
            </div>
          </div>
          <div class="notification-arrow">
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
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonSpinner
} from '@ionic/vue';
import SignalementDetailsPopup from '@/components/SignalementDetailsPopup.vue';
import { 
  getAllNotifications, 
  markNotificationAsRead 
} from '@/services/firebase/notification.service';
import { getSignalementById } from '@/services/problem.service';
import type { UserNotification, Signalement } from '@/types/entities';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'unread-count-changed', count: number): void;
}>();

const loading = ref(false);
const loadingDetails = ref(false);
const notifications = ref<UserNotification[]>([]);
const showDetailsModal = ref(false);
const selectedSignalement = ref<Signalement | null>(null);

// Computed
const unreadCount = computed(() => notifications.value.filter(n => !n.lue).length);

// Marquer toutes comme lues
const markAllAsRead = async () => {
  try {
    for (const notification of notifications.value.filter(n => !n.lue)) {
      await markNotificationAsRead(notification.id);
      notification.lue = true;
      notification.readAt = new Date().toISOString();
    }
    updateUnreadCount();
  } catch (error) {
    console.error('Erreur marquage notifications:', error);
  }
};

// Type de notification pour le style
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

// Charger les notifications quand le modal s'ouvre
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    await loadNotifications();
  }
});

const loadNotifications = async () => {
  loading.value = true;
  try {
    notifications.value = await getAllNotifications();
    updateUnreadCount();
  } catch (error) {
    console.error('Erreur chargement notifications:', error);
  } finally {
    loading.value = false;
  }
};

const updateUnreadCount = () => {
  const unreadCount = notifications.value.filter(n => !n.lue).length;
  emit('unread-count-changed', unreadCount);
};

const handleNotificationClick = async (notification: UserNotification) => {
  // Marquer comme lue si elle ne l'était pas
  if (!notification.lue) {
    await markNotificationAsRead(notification.id);
    // Mettre à jour localement
    notification.lue = true;
    notification.readAt = new Date().toISOString();
    updateUnreadCount();
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

const closeModal = () => {
  emit('close');
};

const closeDetailsModal = () => {
  showDetailsModal.value = false;
  selectedSignalement.value = null;
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
.notification-content {
  --background: #F8FAFC;
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 250px;
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
  height: 280px;
  text-align: center;
  padding: 32px;
}

.empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, rgba(107, 114, 128, 0.08) 0%, rgba(107, 114, 128, 0.15) 100%);
  border: 2px solid rgba(107, 114, 128, 0.12);
  border-radius: 20px;
  margin-bottom: 20px;
}

.empty-icon i {
  font-size: 28px;
  color: var(--ion-color-medium);
}

.empty-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--ion-color-dark);
  margin: 0 0 8px 0;
}

.empty-subtitle {
  font-size: 13px;
  color: var(--ion-color-medium);
  margin: 0;
}

/* Unread Summary */
.unread-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(39, 76, 119, 0.06);
  border-radius: 10px;
  margin-bottom: 14px;
  border: 1px solid rgba(39, 76, 119, 0.1);
}

.summary-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ion-color-primary);
}

.summary-left i {
  font-size: 13px;
}

.mark-read-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--ion-color-primary);
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.mark-read-btn i {
  font-size: 12px;
}

/* Notifications List */
.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Notification Card */
.notification-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #FFFFFF;
  border-radius: 14px;
  padding: 14px;
  border: 1px solid var(--color-border);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.2s ease;
}

.notification-card:active {
  transform: scale(0.98);
}

.notification-card.unread {
  background: linear-gradient(135deg, rgba(39, 76, 119, 0.03) 0%, rgba(96, 150, 186, 0.05) 100%);
  border-color: rgba(39, 76, 119, 0.2);
  box-shadow: 0 2px 10px rgba(39, 76, 119, 0.08);
}

/* Notification Icon */
.notification-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  flex-shrink: 0;
}

.notification-icon i {
  font-size: 18px;
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

.unread-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  background: var(--ion-color-danger);
  border-radius: 50%;
  border: 2px solid #FFFFFF;
}

/* Notification Content */
.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.badge-new {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background: var(--ion-color-danger);
  color: #FFFFFF;
  border-radius: 5px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.notification-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--ion-color-medium);
}

.notification-date i {
  font-size: 10px;
}

.notification-message {
  font-size: 13px;
  font-weight: 500;
  color: var(--ion-color-dark);
  margin: 0 0 4px 0;
  line-height: 1.4;
}

.notification-card.unread .notification-message {
  font-weight: 600;
  color: var(--ion-color-primary);
}

.read-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: var(--ion-color-medium);
  padding: 3px 6px;
  background: rgba(107, 114, 128, 0.08);
  border-radius: 5px;
}

.read-status i {
  font-size: 9px;
  color: var(--ion-color-success);
}

/* Notification Arrow */
.notification-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(107, 114, 128, 0.08);
  flex-shrink: 0;
  align-self: center;
}

.notification-arrow i {
  font-size: 11px;
  color: var(--ion-color-medium);
}

.notification-card.unread .notification-arrow {
  background: rgba(39, 76, 119, 0.1);
}

.notification-card.unread .notification-arrow i {
  color: var(--ion-color-primary);
}
</style>
