<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="profile-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" text="" color="light"></ion-back-button>
        </ion-buttons>
        <ion-title>Mon Profil</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleLogout" fill="clear" color="light">
            <i class="fas fa-sign-out-alt"></i>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true">
      <div v-if="loading" class="loading-container">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <p>Chargement du profil...</p>
      </div>

      <div v-else class="profile-container">
        <!-- Avatar et Email -->
        <div class="profile-header">
          <div class="avatar-wrapper">
            <div class="avatar">
              <i class="fas fa-user"></i>
            </div>
          </div>
          <h2 class="user-email">{{ currentUser?.email }}</h2>
          <span class="user-badge">
            <i class="fas fa-shield-alt"></i>
            Membre actif
          </span>
        </div>

        <!-- Formulaire de profil -->
        <div class="form-card">
          <div class="card-header">
            <i class="fas fa-user-edit"></i>
            <h3>Informations personnelles</h3>
          </div>
          
          <div class="form-group">
            <label class="form-label">Nom d'affichage</label>
            <div class="input-wrapper">
              <i class="fas fa-id-card"></i>
              <input
                type="text"
                v-model="profile.displayName"
                placeholder="Votre nom"
                :disabled="!isEditing"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Email</label>
            <div class="input-wrapper">
              <i class="fas fa-envelope"></i>
              <input
                type="email"
                :value="currentUser?.email"
                disabled
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Téléphone</label>
            <div class="input-wrapper">
              <i class="fas fa-phone"></i>
              <input
                type="tel"
                v-model="profile.telephone"
                placeholder="+261 XX XXX XX"
                :disabled="!isEditing"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">GitHub</label>
            <div class="input-wrapper">
              <i class="fab fa-github"></i>
              <input
                type="text"
                v-model="profile.github"
                placeholder="votre-username"
                :disabled="!isEditing"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Date de naissance</label>
            <div class="input-wrapper">
              <i class="fas fa-calendar-alt"></i>
              <input
                type="date"
                v-model="profile.dateNaissance"
                :disabled="!isEditing"
                class="form-input"
              />
            </div>
          </div>
        </div>

        <!-- Boutons d'action -->
        <div class="action-buttons">
          <button 
            v-if="!isEditing" 
            class="btn btn-primary"
            @click="startEditing"
          >
            <i class="fas fa-edit"></i>
            Modifier le profil
          </button>

          <template v-else>
            <button 
              class="btn btn-success"
              @click="saveProfile"
              :disabled="saving"
            >
              <ion-spinner v-if="saving" name="crescent"></ion-spinner>
              <template v-else>
                <i class="fas fa-check"></i>
                Enregistrer
              </template>
            </button>
            
            <button 
              class="btn btn-secondary"
              @click="cancelEditing"
            >
              <i class="fas fa-times"></i>
              Annuler
            </button>
          </template>
        </div>

        <!-- Section Mes Signalements -->
        <div class="stats-card">
          <div class="card-header">
            <i class="fas fa-chart-bar"></i>
            <h3>Mes statistiques</h3>
          </div>
          
          <div class="stats-item">
            <div class="stats-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="stats-info">
              <span class="stats-value">{{ mySignalementsCount }}</span>
              <span class="stats-label">Signalement(s) effectué(s)</span>
            </div>
          </div>
          
          <button 
            class="btn btn-outline"
            @click="goToMySignalements"
          >
            <i class="fas fa-map-marked-alt"></i>
            Voir mes signalements sur la carte
          </button>
        </div>
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
  IonSpinner,
  IonBackButton,
  toastController
} from '@ionic/vue';
import { logout, currentUser } from '@/services/firebase/authService';
import { getMyProfile, updateMyProfile } from '@/services/userService';
import type { UserProfile } from '@/types/user';
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
      message: 'Profil mis à jour avec succès !',
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
    
    isEditing.value = false;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    const toast = await toastController.create({
      message: 'Erreur lors de la mise à jour du profil',
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
.profile-toolbar {
  --background: #2D4654;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  color: rgba(255, 255, 255, 0.7);
}

.profile-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 24px 16px;
}

/* Header Section */
.profile-header {
  text-align: center;
  margin-bottom: 32px;
}

.avatar-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #87BCDE, #805E73);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(135, 188, 222, 0.3);
}

.avatar i {
  font-size: 48px;
  color: white;
}

.user-email {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 8px 0;
  font-weight: 400;
}

.user-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(135, 188, 222, 0.15);
  border-radius: 20px;
  font-size: 12px;
  color: #87BCDE;
}

.user-badge i {
  font-size: 10px;
}

/* Form Card */
.form-card,
.stats-card {
  background: #2D4654;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.card-header i {
  font-size: 18px;
  color: #87BCDE;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: #243B4A;
  border-radius: 12px;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}

.input-wrapper:focus-within {
  border-color: #87BCDE;
}

.input-wrapper i {
  padding: 0 16px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 16px;
}

.form-input {
  flex: 1;
  padding: 14px 16px 14px 0;
  font-size: 15px;
  color: white;
  background: transparent;
  border: none;
  outline: none;
  font-family: inherit;
}

.form-input:disabled {
  color: rgba(255, 255, 255, 0.5);
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

/* Action Buttons */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 16px 24px;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #87BCDE;
  color: #243B4A;
}

.btn-primary:hover:not(:disabled) {
  background: #6fa8cc;
}

.btn-success {
  background: #10B981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #059669;
}

.btn-secondary {
  background: #4E4D5C;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5d5c6d;
}

.btn-outline {
  background: transparent;
  color: #87BCDE;
  border: 2px solid #87BCDE;
}

.btn-outline:hover {
  background: rgba(135, 188, 222, 0.1);
}

/* Stats Card */
.stats-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #243B4A;
  border-radius: 12px;
  margin-bottom: 16px;
}

.stats-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(245, 158, 11, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-icon i {
  font-size: 20px;
  color: #F59E0B;
}

.stats-info {
  display: flex;
  flex-direction: column;
}

.stats-value {
  font-size: 24px;
  font-weight: 700;
  color: white;
}

.stats-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

/* Toolbar button */
ion-toolbar ion-button i {
  font-size: 18px;
}
</style>
