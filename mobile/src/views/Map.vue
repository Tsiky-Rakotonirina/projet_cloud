<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start" v-if="currentUser">
          <ion-button @click="goToProfile">
            <ion-icon :icon="personOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Carte d'Antananarivo</ion-title>
        <ion-buttons slot="end">
          <ion-button v-if="currentUser" @click="handleLogout">
            <ion-icon :icon="logOutOutline"></ion-icon>
          </ion-button>
          <ion-button v-else @click="goToLogin">
            <ion-icon :icon="logInOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <!-- Barre de filtre pour les utilisateurs connectés -->
      <ion-toolbar v-if="currentUser">
        <ion-segment v-model="filterMode" @ionChange="onFilterChange">
          <ion-segment-button value="all">
            <ion-label>Tous</ion-label>
          </ion-segment-button>
          <ion-segment-button value="mine">
            <ion-label>Mes signalements</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true">
      <div class="map-wrapper">
        <MapView ref="mapViewRef" :filter-mine="filterMode === 'mine'" />
      </div>
      
      <!-- Bouton pour centrer sur Antananarivo -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="centerOnAntananarivo">
          <ion-icon :icon="locateOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- Bouton pour le tableau récapitulatif -->
      <ion-fab vertical="bottom" horizontal="start" slot="fixed">
        <ion-fab-button color="secondary" @click="goToRecap">
          <ion-icon :icon="statsChartOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- Bouton pour signaler un problème (visible uniquement si connecté) -->
      <ion-fab v-if="currentUser" vertical="top" horizontal="end" slot="fixed" style="margin-top: 110px;">
        <ion-fab-button color="danger" @click="openSignalementModal">
          <ion-icon :icon="addCircleOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>

    <!-- Modal de signalement -->
    <ion-modal :is-open="isModalOpen" @did-dismiss="closeSignalementModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>Signaler un problème</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeSignalementModal">Fermer</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <div class="modal-content">
          <p class="instruction">
            📍 Cliquez sur la carte pour sélectionner l'emplacement du problème
          </p>

          <div v-if="selectedPoint" class="selected-location">
            <ion-chip color="success">
              <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
              <ion-label>Position sélectionnée</ion-label>
            </ion-chip>
            <p class="coordinates">
              Lat: {{ selectedPoint.lat.toFixed(6) }}, Lng: {{ selectedPoint.lng.toFixed(6) }}
            </p>
          </div>

          <ion-item>
            <ion-label position="stacked">Description du problème *</ion-label>
            <ion-textarea
              v-model="signalementDescription"
              placeholder="Ex: Nid-de-poule important, route endommagée..."
              :rows="4"
              required
            ></ion-textarea>
          </ion-item>

          <ion-button
            expand="block"
            @click="submitSignalement"
            :disabled="!selectedPoint || !signalementDescription"
            class="ion-margin-top"
          >
            <ion-icon :icon="sendOutline" slot="start"></ion-icon>
            Envoyer le signalement
          </ion-button>
        </div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonButtons,
  IonButton,
  IonModal,
  IonItem,
  IonLabel,
  IonTextarea,
  IonChip,
  IonSegment,
  IonSegmentButton,
  alertController,
  toastController
} from '@ionic/vue';
import { 
  locateOutline, 
  logOutOutline, 
  logInOutline, 
  statsChartOutline,
  addCircleOutline,
  sendOutline,
  checkmarkCircleOutline,
  personOutline
} from 'ionicons/icons';
import { logout, currentUser } from '@/services/firebase/authService';
import { createSignalement } from '@/services/problemService';
import MapView from '@/components/MapView.vue';

const router = useRouter();
const route = useRoute();
const mapViewRef = ref<InstanceType<typeof MapView> | null>(null);
const isModalOpen = ref(false);
const signalementDescription = ref('');
const selectedPoint = ref<{ lat: number; lng: number } | null>(null);
const filterMode = ref<'all' | 'mine'>('all');
let tempMarker: any = null;

onMounted(() => {
  // Vérifier si on vient avec un filtre dans l'URL
  if (route.query.filter === 'mine' && currentUser.value) {
    filterMode.value = 'mine';
  }
});

const onFilterChange = () => {
  // Le MapView réagit automatiquement via watch
};

const centerOnAntananarivo = () => {
  if (mapViewRef.value) {
    mapViewRef.value.flyTo(-18.8792, 47.5079, 13);
  }
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
    filterMode.value = 'all';
    router.push({ name: 'home' });
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
  }
};

const openSignalementModal = () => {
  isModalOpen.value = true;
  selectedPoint.value = null;
  signalementDescription.value = '';
  
  // Activer le mode sélection sur la carte
  setTimeout(() => {
    enableMapClickSelection();
  }, 300);
};

const closeSignalementModal = () => {
  isModalOpen.value = false;
  if (tempMarker && mapViewRef.value) {
    const map = mapViewRef.value.getMap();
    if (map) {
      map.removeLayer(tempMarker);
      tempMarker = null;
    }
  }
  disableMapClickSelection();
};

const enableMapClickSelection = () => {
  if (mapViewRef.value) {
    const map = mapViewRef.value.getMap();
    if (map) {
      map.on('click', handleMapClick);
      map.getContainer().style.cursor = 'crosshair';
    }
  }
};

const disableMapClickSelection = () => {
  if (mapViewRef.value) {
    const map = mapViewRef.value.getMap();
    if (map) {
      map.off('click', handleMapClick);
      map.getContainer().style.cursor = '';
    }
  }
};

const handleMapClick = (e: any) => {
  const { lat, lng } = e.latlng;
  selectedPoint.value = { lat, lng };
  
  // Supprimer le marqueur temporaire précédent
  if (tempMarker && mapViewRef.value) {
    const map = mapViewRef.value.getMap();
    if (map) {
      map.removeLayer(tempMarker);
    }
  }
  
  // Ajouter un nouveau marqueur temporaire
  if (mapViewRef.value) {
    const L = (window as any).L;
    const map = mapViewRef.value.getMap();
    if (map && L) {
      tempMarker = L.marker([lat, lng], {
        icon: L.icon({
          iconUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23FF0000"%3E%3Cpath d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/%3E%3C/svg%3E',
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        })
      }).addTo(map);
      tempMarker.bindPopup('📍 Position sélectionnée').openPopup();
    }
  }
};

const submitSignalement = async () => {
  if (!selectedPoint.value || !signalementDescription.value) {
    return;
  }

  try {
    const alert = await alertController.create({
      header: 'Confirmer le signalement',
      message: `Voulez-vous signaler ce problème ?<br/><br/><b>${signalementDescription.value}</b>`,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Confirmer',
          handler: async () => {
            try {
              await createSignalement(
                signalementDescription.value,
                selectedPoint.value!.lat,
                selectedPoint.value!.lng,
                'villeId'
              );

              const toast = await toastController.create({
                message: '✅ Signalement envoyé avec succès !',
                duration: 3000,
                color: 'success',
                position: 'top'
              });
              await toast.present();

              closeSignalementModal();
              
              // Recharger les problèmes sur la carte
              if (mapViewRef.value) {
                mapViewRef.value.reloadProblems(filterMode.value === 'mine');
              }
            } catch (error) {
              console.error('Erreur lors de la création du signalement:', error);
              const toast = await toastController.create({
                message: '❌ Erreur lors de l\'envoi du signalement',
                duration: 3000,
                color: 'danger',
                position: 'top'
              });
              await toast.present();
            }
          }
        }
      ]
    });

    await alert.present();
  } catch (error) {
    console.error('Erreur:', error);
  }
};
</script>

<style scoped>
.map-wrapper {
  width: 100%;
  height: 100%;
}

.modal-content {
  max-width: 600px;
  margin: 0 auto;
}

.instruction {
  background: var(--ion-color-light);
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
  margin-bottom: 1rem;
}

.selected-location {
  text-align: center;
  margin-bottom: 1rem;
}

.coordinates {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  margin-top: 0.5rem;
}
</style>
