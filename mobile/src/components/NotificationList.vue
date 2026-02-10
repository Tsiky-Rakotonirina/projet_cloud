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
    
    <ion-content class="ion-padding">
      <!-- Loading -->
      <div v-if="loading" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Chargement des notifications...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="notifications.length === 0" class="empty-state">
        <i class="fas fa-bell-slash"></i>
        <p>Aucune notification</p>
      </div>

      <!-- Notifications list -->
      <div v-else class="notifications-list">
        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          :class="['notification-item', { 'unread': !notification.lue }]"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-icon">
            <i :class="notification.lue ? 'fas fa-bell' : 'fas fa-bell'"></i>
            <span v-if="!notification.lue" class="unread-dot"></span>
          </div>
          <div class="notification-content">
            <p class="notification-message">{{ notification.message }}</p>
            <span class="notification-date">{{ formatDate(notification.createdAt) }}</span>
            <span v-if="notification.readAt" class="notification-read">
              Lu le {{ formatDate(notification.readAt) }}
            </span>
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
          <i class="fas fa-exclamation-triangle"></i>
          <p>Signalement non trouvé</p>
        </div>
      </ion-content>
    </ion-modal>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
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
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
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
  height: 200px;
  color: #9CA3AF;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-state p {
  font-size: 16px;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notification-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: #FFFFFF;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
  cursor: pointer;
  transition: all 0.2s ease;
}

.notification-item:hover {
  background: #F9FAFB;
  transform: translateX(2px);
}

.notification-item.unread {
  background: #EEF2FF;
  border-color: #C7D2FE;
}

.notification-item.unread:hover {
  background: #E0E7FF;
}

.notification-icon {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #E0E7FF;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-item.unread .notification-icon {
  background: #274c77;
}

.notification-icon i {
  font-size: 16px;
  color: #274c77;
}

.notification-item.unread .notification-icon i {
  color: #FFFFFF;
}

.unread-dot {
  position: absolute;
  top: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background: #EF4444;
  border-radius: 50%;
  border: 2px solid #FFFFFF;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-message {
  font-size: 14px;
  color: #1F2937;
  margin: 0 0 4px 0;
  line-height: 1.4;
}

.notification-item.unread .notification-message {
  font-weight: 600;
}

.notification-date {
  font-size: 12px;
  color: #6B7280;
}

.notification-read {
  display: block;
  font-size: 11px;
  color: #9CA3AF;
  margin-top: 2px;
}

.notification-arrow {
  color: #9CA3AF;
  font-size: 12px;
}

.notification-item.unread .notification-arrow {
  color: #274c77;
}
</style>
