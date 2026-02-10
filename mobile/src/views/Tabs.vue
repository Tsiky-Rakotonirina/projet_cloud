<template>
    <ion-page>
        <ion-tabs>
            <ion-router-outlet></ion-router-outlet>
            <ion-tab-bar slot="bottom">
                <ion-tab-button tab="recap" href="/tabs/recap">
                    <i class="fas fa-chart-bar"></i>
                    <ion-label>Récapitulatif</ion-label>
                </ion-tab-button>

                <ion-tab-button tab="home" href="/tabs/home">
                    <i class="fas fa-home"></i>
                    <ion-label>Accueil</ion-label>
                </ion-tab-button>

                <ion-tab-button tab="map" href="/tabs/map">
                    <i class="fas fa-map-marked-alt"></i>
                    <ion-label>Carte</ion-label>
                </ion-tab-button>

                <ion-tab-button tab="notifications" href="/tabs/notifications" v-if="currentUser">
                    <div class="notification-tab-icon">
                        <i class="fas fa-bell"></i>
                        <span v-if="unreadCount > 0" class="tab-badge">{{ unreadCount > 99 ? '99+' : unreadCount
                            }}</span>
                    </div>
                    <ion-label>Notifications</ion-label>
                </ion-tab-button>
            </ion-tab-bar>
        </ion-tabs>
    </ion-page>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import {
    IonPage,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonLabel,
    IonRouterOutlet
} from '@ionic/vue';
import { currentUser } from '@/services/firebase/auth.service';
import { getUnreadNotificationsCount } from '@/services/firebase/notification.service';

const unreadCount = ref(0);

const loadUnreadCount = async () => {
    if (currentUser.value) {
        unreadCount.value = await getUnreadNotificationsCount();
    } else {
        unreadCount.value = 0;
    }
};

watch(currentUser, async (user) => {
    if (user) {
        await loadUnreadCount();
    } else {
        unreadCount.value = 0;
    }
});

onMounted(async () => {
    await loadUnreadCount();

    // Rafraîchir le compteur toutes les 30 secondes
    setInterval(loadUnreadCount, 30000);
});
</script>

<style scoped>
ion-tab-bar {
    --background: #FFFFFF;
    --border: 1px solid #E2E8F0;
    padding-bottom: env(safe-area-inset-bottom);
}

ion-tab-button {
    --color: #6B7280;
    --color-selected: #274c77;
}

ion-tab-button i {
    font-size: 20px;
    margin-bottom: 4px;
}

ion-label {
    font-size: 11px;
    font-weight: 500;
}

.notification-tab-icon {
    position: relative;
    display: inline-block;
}

.tab-badge {
    position: absolute;
    top: -6px;
    right: -10px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    background: #EF4444;
    color: #FFFFFF;
    font-size: 9px;
    font-weight: 700;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
}
</style>
