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
      <Loader v-if="loading" text="Chargement du profil..." />

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
          
          <!-- Mode Affichage -->
          <template v-if="!isEditing">
            <div class="info-row">
              <div class="info-icon"><i class="fas fa-id-card"></i></div>
              <div class="info-content">
                <span class="info-label">Nom d'affichage</span>
                <span class="info-value">{{ profile.displayName || 'Non défini' }}</span>
              </div>
            </div>

            <div class="info-row">
              <div class="info-icon"><i class="fas fa-envelope"></i></div>
              <div class="info-content">
                <span class="info-label">Email</span>
                <span class="info-value">{{ currentUser?.email }}</span>
              </div>
            </div>

            <div class="info-row">
              <div class="info-icon"><i class="fas fa-phone"></i></div>
              <div class="info-content">
                <span class="info-label">Téléphone</span>
                <span class="info-value">{{ profile.telephone || 'Non défini' }}</span>
              </div>
            </div>

            <div class="info-row">
              <div class="info-icon"><i class="fab fa-github"></i></div>
              <div class="info-content">
                <span class="info-label">GitHub</span>
                <span class="info-value">{{ profile.github || 'Non défini' }}</span>
              </div>
            </div>

            <div class="info-row">
              <div class="info-icon"><i class="fas fa-calendar-alt"></i></div>
              <div class="info-content">
                <span class="info-label">Date de naissance</span>
                <span class="info-value">{{ profile.dateNaissance || 'Non définie' }}</span>
              </div>
            </div>
          </template>

          <!-- Mode Edition -->
          <template v-else>
            <div class="form-group">
              <label class="form-label">Nom d'affichage</label>
              <div class="input-wrapper">
                <i class="fas fa-id-card"></i>
                <input type="text" v-model="profile.displayName" placeholder="Votre nom" class="form-input" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Email</label>
              <div class="input-wrapper disabled">
                <i class="fas fa-envelope"></i>
                <input type="email" :value="currentUser?.email" disabled class="form-input" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Téléphone</label>
              <div class="input-wrapper">
                <i class="fas fa-phone"></i>
                <input type="tel" v-model="profile.telephone" placeholder="+261 XX XXX XX" class="form-input" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">GitHub</label>
              <div class="input-wrapper">
                <i class="fab fa-github"></i>
                <input type="text" v-model="profile.github" placeholder="votre-username" class="form-input" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Date de naissance</label>
              <div class="input-wrapper">
                <i class="fas fa-calendar-alt"></i>
                <input type="date" v-model="profile.dateNaissance" class="form-input" />
              </div>
            </div>
          </template>
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
import Loader from '@/components/Loader.vue';
import { logout, currentUser } from '@/services/firebase/auth.service';
import { getMyProfile, updateMyProfile } from '@/services/user.service';
import type { UserProfile } from '@/types/user';
import { getMySignalements } from '@/services/problem.service';

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
  router.push({ name: 'tabs-map', query: { filter: 'mine' } });
};

const handleLogout = async () => {
  try {
    await logout();
    router.push({ name: 'tabs-home' });
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
  --background: #274c77;
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
  background: linear-gradient(135deg, #274c77, #6096ba);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(39, 76, 119, 0.25);
}

.avatar i {
  font-size: 48px;
  color: white;
}

.user-email {
  font-size: 16px;
  color: #1a1a2e;
  margin: 0 0 8px 0;
  font-weight: 400;
}

.user-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(39, 76, 119, 0.1);
  border-radius: 20px;
  font-size: 12px;
  color: #274c77;
}

.user-badge i {
  font-size: 10px;
}

/* Form Card */
.form-card,
.stats-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #E2E8F0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #E2E8F0;
}

.card-header i {
  font-size: 18px;
  color: #274c77;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
}

/* Info Display Mode (non-editing) */
.info-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid #F3F4F6;
}

.info-row:last-child {
  border-bottom: none;
}

.info-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #F0F4F8;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-icon i {
  font-size: 16px;
  color: #274c77;
}

.info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  font-weight: 500;
  color: #9CA3AF;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.info-value {
  font-size: 15px;
  font-weight: 500;
  color: #1a1a2e;
}

/* Form Edit Mode */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: #F8FAFC;
  border-radius: 12px;
  border: 2px solid #E2E8F0;
  transition: border-color 0.2s;
}

.input-wrapper:focus-within {
  border-color: #274c77;
}

.input-wrapper.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-wrapper i {
  padding: 0 16px;
  color: #9CA3AF;
  font-size: 16px;
}

.form-input {
  flex: 1;
  padding: 14px 16px 14px 0;
  font-size: 15px;
  color: #1a1a2e;
  background: transparent;
  border: none;
  outline: none;
  font-family: inherit;
}

.form-input:disabled {
  color: #9CA3AF;
}

.form-input::placeholder {
  color: #9CA3AF;
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
  background: #274c77;
  color: #FFFFFF;
}

.btn-primary:hover:not(:disabled) {
  background: #1d3a5c;
}

.btn-success {
  background: #10B981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #059669;
}

.btn-secondary {
  background: #6B7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6270;
}

.btn-outline {
  background: transparent;
  color: #274c77;
  border: 2px solid #274c77;
}

.btn-outline:hover {
  background: rgba(39, 76, 119, 0.08);
}

/* Stats Card */
.stats-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #F8FAFC;
  border-radius: 12px;
  margin-bottom: 16px;
}

.stats-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(245, 158, 11, 0.12);
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
  color: #1a1a2e;
}

.stats-label {
  font-size: 13px;
  color: #6B7280;
}

/* Toolbar button */
ion-toolbar ion-button i {
  font-size: 18px;
}
</style>
