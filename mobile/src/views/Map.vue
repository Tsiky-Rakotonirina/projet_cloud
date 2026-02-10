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
      <div v-if="currentUser" class="filter-bar">
        <div class="segment-container">
          <button 
            class="segment-btn" 
            :class="{ active: filterMode === 'all' }" 
            @click="filterMode = 'all'"
          >
            Tous
          </button>
          <button 
            class="segment-btn" 
            :class="{ active: filterMode === 'mine' }" 
            @click="filterMode = 'mine'"
          >
            Mes signalements
          </button>
        </div>
      </div>
    </ion-header>
    
    <ion-content :fullscreen="true">
      <div class="map-wrapper">
        <MapView ref="mapViewRef" :filter-mine="filterMode === 'mine'" @mapClicked="onMapClicked" @loadingChange="onMapLoading" />
        
        <!-- Indicateur de chargement de la carte -->
        <div v-if="mapLoading" class="map-loading-indicator">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <span>Chargement...</span>
        </div>
        
        <!-- Indicateur mode signalement actif -->
        <div v-if="signalementMode" class="signal-mode-indicator">
          <i class="fas fa-hand-pointer"></i>
          <span>Cliquez sur la carte pour signaler</span>
        </div>
        
        <!-- Bouton pour signaler depuis un clic sur la carte -->
        <div 
          v-if="clickedPoint && currentUser" 
          class="signal-popup"
          :style="clickedPixelPos ? {
            left: clickedPixelPos.x + 'px',
            top: (clickedPixelPos.y + 10) + 'px'
          } : {}"
        >
          <div class="signal-arrow-top"></div>
          <button class="signal-btn" @click="openSignalementFromMapClick">
            <i class="fas fa-plus-circle"></i>
            <span>Signaler ici</span>
          </button>
        </div>
      </div>
      
      <!-- Bouton toggle mode signalement -->
      <ion-fab v-if="currentUser" vertical="top" horizontal="end" slot="fixed" class="fab-signal-toggle">
        <ion-fab-button 
          @click="toggleSignalementMode" 
          :class="{ 'fab-active': signalementMode }"
          class="fab-signal"
        >
          <i class="fas" :class="signalementMode ? 'fa-times' : 'fa-plus'"></i>
        </ion-fab-button>
      </ion-fab>

      <!-- Bouton pour centrer sur Antananarivo -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="centerOnAntananarivo" class="fab-locate">
          <i class="fas fa-crosshairs"></i>
        </ion-fab-button>
      </ion-fab>

      <!-- Bouton pour le tableau récapitulatif -->
      <ion-fab vertical="top" horizontal="end" slot="fixed" class="fab-recap">
        <ion-fab-button color="secondary" @click="goToRecap" class="fab-stats">
          <i class="fas fa-chart-bar"></i>
        </ion-fab-button>
      </ion-fab>
    </ion-content>

    <!-- Modal de signalement -->
    <ion-modal :is-open="isModalOpen" @did-dismiss="closeSignalementModal" class="signalement-modal">
      <ion-header class="modal-header">
        <ion-toolbar class="modal-toolbar">
          <ion-title class="modal-title">Signaler un problème</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeSignalementModal" class="btn-close-modal">
              <i class="fas fa-times"></i>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding modal-content-wrapper">
        <div class="modal-content">
          <div class="instruction-box">
            <i class="fas fa-map-marker-alt"></i>
            <button class="btn-select-location" @click="activateMapSelection" v-if="!selectedPoint && !isSelectingLocation">
              Sélectionner l'emplacement sur la carte
            </button>
            <span v-if="isSelectingLocation">Cliquez sur la carte pour choisir l'emplacement</span>
            <span v-if="selectedPoint">Emplacement sélectionné ✔️</span>
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
              :disabled="!selectedPoint"
            ></textarea>
          </div>

          <!-- Ajout de photos -->
          <div class="form-group photos-section" v-if="selectedPoint">
            <ImagePicker 
              v-model="selectedImages" 
              :max-images="3"
              :disabled="!selectedPoint"
            />
          </div>

          <button
            class="btn-submit"
            @click="submitSignalement"
            :disabled="!selectedPoint || !signalementDescription || isSubmitting"
          >
            <i v-if="!isSubmitting" class="fas fa-paper-plane"></i>
            <ion-spinner v-else name="crescent" class="submit-spinner"></ion-spinner>
            <span>{{ isSubmitting ? 'Envoi en cours...' : 'Envoyer le signalement' }}</span>
          </button>
        </div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
const isSelectingLocation = ref(false);
const activateMapSelection = () => {
  const map = mapViewRef.value?.getMap();
  if (!map) {
    toastController.create({
      message: "La carte n'est pas encore prête. Réessayez dans quelques secondes.",
      duration: 2500,
      color: 'danger',
      position: 'top'
    }).then(toast => toast.present());
    return;
  }
  isSelectingLocation.value = true;
  enableMapClickSelection();
  console.log('Mode sélection sur la carte activé');
};
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
  IonSpinner,
  alertController,
  toastController
} from '@ionic/vue';
import { logout, currentUser } from '@/services/firebase/auth.service';
import { createSignalement } from '@/services/problem.service';
import MapView from '@/components/MapView.vue';
import ImagePicker from '@/components/ImagePicker.vue';

const router = useRouter();
const route = useRoute();
const mapViewRef = ref<InstanceType<typeof MapView> | null>(null);
const isModalOpen = ref(false);
const signalementDescription = ref('');
const selectedPoint = ref<{ lat: number; lng: number } | null>(null);
const clickedPoint = ref<{ lat: number; lng: number } | null>(null);
const clickedPixelPos = ref<{ x: number; y: number } | null>(null);
const signalementMode = ref(false);
const filterMode = ref<'all' | 'mine'>('all');
const selectedImages = ref<File[]>([]);
const isSubmitting = ref(false);
const mapLoading = ref(true);
let tempMarker: any = null;

const onMapLoading = (loading: boolean) => {
  mapLoading.value = loading;
};

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

const onMapClicked = (point: { lat: number; lng: number }) => {
  if (isModalOpen.value) return;
  
  // Ne montrer le popup que si le mode signalement est actif
  if (!signalementMode.value) return;
  
  clickedPoint.value = point;
  const map = mapViewRef.value?.getMap();
  if (map) {
    const containerPoint = (map as any).latLngToContainerPoint([point.lat, point.lng]);
    clickedPixelPos.value = { x: containerPoint.x, y: containerPoint.y };
  }
};

const openSignalementFromMapClick = () => {
  if (clickedPoint.value && currentUser.value) {
    selectedPoint.value = clickedPoint.value;
    signalementDescription.value = '';
    selectedImages.value = [];
    isSelectingLocation.value = false;
    isModalOpen.value = true;
    clickedPoint.value = null;
    clickedPixelPos.value = null;
    signalementMode.value = false; // Désactiver le mode après ouverture
  } else if (!currentUser.value) {
    toastController.create({
      message: 'Vous devez être connecté pour signaler un problème.',
      duration: 2500,
      color: 'warning',
      position: 'top'
    }).then(toast => toast.present());
  }
};

const toggleSignalementMode = () => {
  signalementMode.value = !signalementMode.value;
  if (!signalementMode.value) {
    clickedPoint.value = null;
    clickedPixelPos.value = null;
  }
};

const openSignalementModal = () => {
  isModalOpen.value = true;
  selectedPoint.value = null;
  signalementDescription.value = '';
  selectedImages.value = [];
  isSelectingLocation.value = false;
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
      map.getContainer().style.cursor = 'pointer';
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
  if (!isSelectingLocation.value) return;
  const { lat, lng } = e.latlng;
  selectedPoint.value = { lat, lng };
  isSelectingLocation.value = false;
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
    const toast = await toastController.create({
      message: "Veuillez sélectionner un emplacement et décrire le problème.",
      duration: 2500,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
    return;
  }

  try {
    const alert = await alertController.create({
      header: 'Confirmer le signalement',
      cssClass: 'confirm-alert',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
          cssClass: 'alert-btn-cancel'
        },
        {
          text: 'Confirmer',
          cssClass: 'alert-btn-confirm',
          handler: async () => {
            try {
              isSubmitting.value = true;
              
              // Utiliser l'ID de la ville d'Antananarivo si disponible
              const villeId = 'villeId';
              const id = await createSignalement(
                signalementDescription.value,
                selectedPoint.value!.lat,
                selectedPoint.value!.lng,
                villeId,
                selectedImages.value.length > 0 ? selectedImages.value : undefined
              );
              
              isSubmitting.value = false;
              
              if (!id) {
                const toast = await toastController.create({
                  message: "Erreur lors de la création du signalement.",
                  duration: 3000,
                  color: 'danger',
                  position: 'top'
                });
                await toast.present();
                return;
              }

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
              isSubmitting.value = false;
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
  position: relative;
}

/* Indicateur de chargement subtil */
.map-loading-indicator {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.95);
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  backdrop-filter: blur(8px);
}

.map-loading-indicator ion-spinner {
  width: 18px;
  height: 18px;
}

/* Custom Filter Bar */
.filter-bar {
  background: #FFFFFF;
  padding: 12px 16px;
  border-bottom: 1px solid #E2E8F0;
}

.segment-container {
  display: flex;
  background: #F1F5F9;
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
}

.segment-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  color: #4B5563;
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1.3;
}

.segment-btn.active {
  background: #274c77;
  color: #FFFFFF;
  box-shadow: 0 2px 8px rgba(39, 76, 119, 0.25);
}

.segment-btn .hint-text {
  font-size: 10px;
  font-weight: 400;
  opacity: 0.7;
  margin-top: 2px;
}

/* FAB Buttons */
ion-fab-button {
  --box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

ion-fab-button i {
  font-size: 20px;
}

/* Signal Popup Button on map click */
.signal-popup {
  position: absolute;
  z-index: 1000;
  transform: translateX(-50%);
  animation: popIn 0.2s ease-out;
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: translateX(-50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }
}

.signal-arrow-top {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 10px solid #274c77;
}

.signal-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  background: #274c77;
  color: #FFFFFF;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(39, 76, 119, 0.35);
  white-space: nowrap;
  transition: all 0.15s ease;
}

.signal-btn:active {
  transform: scale(0.96);
  background: #1d3a5c;
}

.signal-btn i {
  font-size: 18px;
}

/* Locate & Stats FABs */
.fab-locate {
  --background: #274c77;
}

.fab-stats {
  --background: #6096ba;
}

/* FAB Toggle Signalement */
.fab-signal-toggle {
  margin-top: 8px;
}

/* FAB Recap sous le toggle */
.fab-recap {
  margin-top: 70px;
}

.fab-signal {
  --background: #10B981;
  --background-activated: #059669;
  transition: all 0.3s ease;
}

.fab-signal.fab-active {
  --background: #EF4444;
  --background-activated: #DC2626;
}

.fab-signal i {
  transition: transform 0.3s ease;
}

.fab-signal.fab-active i {
  transform: rotate(45deg);
}

/* Signal Mode Indicator */
.signal-mode-indicator {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(16, 185, 129, 0.95);
  color: white;
  padding: 10px 20px;
  border-radius: 25px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
  z-index: 1000;
  animation: slideDown 0.3s ease;
}

.signal-mode-indicator i {
  font-size: 16px;
  animation: pulse 1.5s infinite;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Modal */
.signalement-modal {
  --border-radius: 20px 20px 0 0;
}

.modal-header {
  background: #274c77;
}

.modal-toolbar {
  --background: #274c77;
  --border-width: 0;
  --padding-top: 16px;
  --padding-bottom: 16px;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: white;
  padding-left: 16px;
}

.btn-close-modal {
  --color: rgba(255, 255, 255, 0.85);
  font-size: 20px;
}

.btn-close-modal:hover {
  --color: white;
}

.modal-content-wrapper {
  --background: #FFFFFF;
  --padding-top: 20px;
  --padding-bottom: 30px;
}

.modal-content {
  max-width: 500px;
  margin: 0 auto;
  padding: 0 4px;
}

.instruction-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(39, 76, 119, 0.06);
  border: 1px solid #E2E8F0;
  padding: 16px;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 20px;
}

.instruction-box i {
  font-size: 20px;
  color: #274c77;
}

.instruction-box span {
  font-size: 14px;
  color: #6B7280;
}

.btn-select-location {
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  color: #FFFFFF;
  background: #274c77;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-select-location:hover {
  background: #1d3a5c;
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
  background: rgba(16, 185, 129, 0.12);
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
  color: #6B7280;
  margin: 0;
}

.form-group {
  margin-bottom: 24px;
}

.photos-section {
  margin-bottom: 28px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.form-textarea {
  width: 100%;
  padding: 14px 16px;
  font-size: 15px;
  font-family: inherit;
  color: #1a1a2e;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  outline: none;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.2s;
}

.form-textarea:focus {
  border-color: #274c77;
}

.form-textarea::placeholder {
  color: #9CA3AF;
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
  color: #FFFFFF;
  background: #274c77;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-submit:hover:not(:disabled) {
  background: #1d3a5c;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-spinner {
  width: 20px;
  height: 20px;
  --color: #FFFFFF;
}

/* Header buttons */
ion-toolbar ion-button i {
  font-size: 18px;
}
</style>
