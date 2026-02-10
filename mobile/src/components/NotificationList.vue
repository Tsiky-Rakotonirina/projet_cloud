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
        <p>Aucune notification</p>
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
.notification-content {
  --background: #FFFFFF;
}

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

.empty-state p {
  font-size: 16px;
  margin: 0;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Card style matching Home.vue feature-card */
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
