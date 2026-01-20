<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Mon Profil</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleLogout">
            <ion-icon :icon="logOutOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true" class="ion-padding">
      <div v-if="loading" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Chargement du profil...</p>
      </div>

      <div v-else class="profile-container">
        <!-- Avatar et Email -->
        <div class="profile-header">
          <div class="avatar">
            <ion-icon :icon="personCircleOutline"></ion-icon>
          </div>
          <h2>{{ currentUser?.email }}</h2>
        </div>

        <!-- Formulaire de profil -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Informations personnelles</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item>
                <ion-label position="stacked">Nom d'affichage</ion-label>
                <ion-input
                  v-model="profile.displayName"
                  placeholder="Votre nom"
                  :disabled="!isEditing"
                ></ion-input>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">Email</ion-label>
                <ion-input
                  :value="currentUser?.email"
                  disabled
                ></ion-input>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">Téléphone</ion-label>
                <ion-input
                  v-model="profile.telephone"
                  type="tel"
                  placeholder="+261 XX XXX XX"
                  :disabled="!isEditing"
                ></ion-input>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">GitHub</ion-label>
                <ion-input
                  v-model="profile.github"
                  placeholder="votre-username"
                  :disabled="!isEditing"
                ></ion-input>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">Date de naissance</ion-label>
                <ion-input
                  v-model="profile.dateNaissance"
                  type="date"
                  :disabled="!isEditing"
                ></ion-input>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Boutons d'action -->
        <div class="action-buttons">
          <ion-button 
            v-if="!isEditing" 
            expand="block" 
            @click="startEditing"
          >
            <ion-icon :icon="createOutline" slot="start"></ion-icon>
            Modifier le profil
          </ion-button>

          <template v-else>
            <ion-button 
              expand="block" 
              color="success"
              @click="saveProfile"
              :disabled="saving"
            >
              <ion-spinner v-if="saving" name="crescent"></ion-spinner>
              <template v-else>
                <ion-icon :icon="checkmarkOutline" slot="start"></ion-icon>
                Enregistrer
              </template>
            </ion-button>
            
            <ion-button 
              expand="block" 
              color="medium"
              @click="cancelEditing"
            >
              <ion-icon :icon="closeOutline" slot="start"></ion-icon>
              Annuler
            </ion-button>
          </template>
        </div>

        <!-- Section Mes Signalements -->
        <ion-card class="ion-margin-top">
          <ion-card-header>
            <ion-card-title>Mes statistiques</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item>
                <ion-icon :icon="alertCircleOutline" slot="start" color="warning"></ion-icon>
                <ion-label>
                  <h3>Signalements effectués</h3>
                  <p>{{ mySignalementsCount }} signalement(s)</p>
                </ion-label>
              </ion-item>
            </ion-list>
            <ion-button 
              expand="block" 
              fill="outline"
              @click="goToMySignalements"
              class="ion-margin-top"
            >
              <ion-icon :icon="listOutline" slot="start"></ion-icon>
              Voir mes signalements sur la carte
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonSpinner,
  IonBackButton,
  toastController
} from '@ionic/vue';
import { 
  logOutOutline, 
  personCircleOutline,
  createOutline,
  checkmarkOutline,
  closeOutline,
  alertCircleOutline,
  listOutline
} from 'ionicons/icons';
import { logout, currentUser } from '@/services/firebase/authService';
import { getMyProfile, updateMyProfile, UserProfile } from '@/services/userService';
import { getMySignalements } from '@/services/problemService';

const router = useRouter();
const loading = ref(true);
const saving = ref(false);
const isEditing = ref(false);
const mySignalementsCount = ref(0);

const profile = ref<Partial<UserProfile>>({
  displayName: '',
  telephone: '',
  github: '',
  dateNaissance: ''
});

const originalProfile = ref<Partial<UserProfile>>({});

const loadProfile = async () => {
  try {
    loading.value = true;
    const userProfile = await getMyProfile();
    
    if (userProfile) {
      profile.value = {
        displayName: userProfile.displayName || '',
        telephone: userProfile.telephone || '',
        github: userProfile.github || '',
        dateNaissance: userProfile.dateNaissance || ''
      };
      originalProfile.value = { ...profile.value };
    }

    // Charger le nombre de signalements
    const signalements = await getMySignalements();
    mySignalementsCount.value = signalements.length;
  } catch (error) {
    console.error('Erreur lors du chargement du profil:', error);
  } finally {
    loading.value = false;
  }
};

const startEditing = () => {
  originalProfile.value = { ...profile.value };
  isEditing.value = true;
};

const cancelEditing = () => {
  profile.value = { ...originalProfile.value };
  isEditing.value = false;
};

const saveProfile = async () => {
  try {
    saving.value = true;
    await updateMyProfile(profile.value);
    
    const toast = await toastController.create({
      message: '✅ Profil mis à jour avec succès !',
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
    
    isEditing.value = false;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    const toast = await toastController.create({
      message: '❌ Erreur lors de la mise à jour du profil',
      duration: 2000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  } finally {
    saving.value = false;
  }
};

const goToMySignalements = () => {
  router.push({ name: 'map', query: { filter: 'mine' } });
};

const handleLogout = async () => {
  try {
    await logout();
    router.push({ name: 'home' });
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
  }
};

onMounted(() => {
  if (!currentUser.value) {
    router.push({ name: 'login' });
    return;
  }
  loadProfile();
});
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1rem;
}

.profile-container {
  max-width: 600px;
  margin: 0 auto;
}

.profile-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.avatar {
  font-size: 5rem;
  color: var(--ion-color-primary);
}

.avatar ion-icon {
  font-size: 5rem;
}

.profile-header h2 {
  margin-top: 0.5rem;
  color: var(--ion-color-medium);
  font-size: 1rem;
}

.action-buttons {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

ion-card {
  margin: 0;
}
</style>
