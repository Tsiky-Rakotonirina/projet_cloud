<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start" v-if="currentUser">
          <ion-button @click="goToProfile">
            <i class="fas fa-user"></i>
          </ion-button>
        </ion-buttons>
        <ion-title>Carte</ion-title>
        <ion-buttons slot="end">
          <ion-button v-if="currentUser" @click="handleLogout" color="danger">
            <i class="fas fa-sign-out-alt"></i>
          </ion-button>
          <ion-button v-else @click="goToLogin">
            <i class="fas fa-sign-in-alt"></i>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <!-- Barre de filtre pour les utilisateurs connectés -->
      <ion-toolbar v-if="currentUser" class="filter-toolbar">
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
        <ion-fab-button @click="centerOnAntananarivo" class="fab-locate">
          <i class="fas fa-crosshairs"></i>
        </ion-fab-button>
      </ion-fab>

      <!-- Bouton pour le tableau récapitulatif -->
      <ion-fab vertical="bottom" horizontal="start" slot="fixed">
        <ion-fab-button color="secondary" @click="goToRecap" class="fab-stats">
          <i class="fas fa-chart-bar"></i>
        </ion-fab-button>
      </ion-fab>

      <!-- Bouton pour signaler un problème (visible uniquement si connecté) -->
      <ion-fab v-if="currentUser" vertical="top" horizontal="end" slot="fixed" style="margin-top: 110px;">
        <ion-fab-button color="danger" @click="openSignalementModal" class="fab-add">
          <i class="fas fa-plus"></i>
        </ion-fab-button>
      </ion-fab>
    </ion-content>

    <!-- Modal de signalement -->
    <ion-modal :is-open="isModalOpen" @did-dismiss="closeSignalementModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>Signaler un problème</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeSignalementModal">
              <i class="fas fa-times"></i>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding modal-content-wrapper">
        <div class="modal-content">
          <div class="instruction-box">
            <i class="fas fa-map-marker-alt"></i>
            <span>Cliquez sur la carte pour sélectionner l'emplacement du problème</span>
          </div>

          <div v-if="selectedPoint" class="selected-location">
            <div class="location-badge">
              <i class="fas fa-check-circle"></i>
              <span>Position sélectionnée</span>
            </div>
            <p class="coordinates">
              Lat: {{ selectedPoint.lat.toFixed(6) }}, Lng: {{ selectedPoint.lng.toFixed(6) }}
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">Description du problème</label>
            <textarea
              v-model="signalementDescription"
              class="form-textarea"
              placeholder="Ex: Nid-de-poule important, route endommagée..."
              rows="4"
            ></textarea>
          </div>

          <button
            class="btn-submit"
            @click="submitSignalement"
            :disabled="!selectedPoint || !signalementDescription"
          >
            <i class="fas fa-paper-plane"></i>
            <span>Envoyer le signalement</span>
          </button>
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
  IonButtons,
  IonButton,
  IonModal,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  alertController,
  toastController
} from '@ionic/vue';
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
                message: 'Signalement envoyé avec succès !',
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
                message: 'Erreur lors de l\'envoi du signalement',
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

.filter-toolbar {
  --background: #2D4654;
}

/* FAB Buttons */
ion-fab-button {
  --box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

ion-fab-button i {
  font-size: 20px;
}

/* Modal */
.modal-content-wrapper {
  --background: #243B4A;
}

.modal-content {
  max-width: 500px;
  margin: 0 auto;
  padding: 8px 0;
}

.instruction-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(135, 188, 222, 0.1);
  border: 1px solid rgba(135, 188, 222, 0.2);
  padding: 16px;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 20px;
}

.instruction-box i {
  font-size: 20px;
  color: #87BCDE;
}

.instruction-box span {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.selected-location {
  text-align: center;
  margin-bottom: 20px;
}

.location-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(16, 185, 129, 0.15);
  border-radius: 20px;
  margin-bottom: 8px;
}

.location-badge i {
  color: #10B981;
}

.location-badge span {
  font-size: 14px;
  font-weight: 500;
  color: #10B981;
}

.coordinates {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.form-textarea {
  width: 100%;
  padding: 14px 16px;
  font-size: 15px;
  font-family: inherit;
  color: white;
  background: #2D4654;
  border: 2px solid rgba(135, 188, 222, 0.2);
  border-radius: 12px;
  outline: none;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.2s;
}

.form-textarea:focus {
  border-color: #87BCDE;
}

.form-textarea::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.btn-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  color: #243B4A;
  background: #87BCDE;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-submit:hover:not(:disabled) {
  background: #6fa8cc;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Header buttons */
ion-toolbar ion-button i {
  font-size: 18px;
}
</style>
