<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Connexion</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="login-container">
        <h1>Photo Gallery</h1>
        
        <form @submit.prevent="handleLogin">
          <!-- Email -->
          <ion-item>
            <ion-label position="floating">Email</ion-label>
            <ion-input
              v-model="formData.email"
              type="email"
              value="alvinahamb@gmail.com"
              required
            ></ion-input>
          </ion-item>

          <!-- Password -->
          <ion-item>
            <ion-label position="floating">Mot de passe</ion-label>
            <ion-input
              v-model="formData.password"
              type="password"
              value="PIZZAsushi"
              required
            ></ion-input>
          </ion-item>

          <!-- Error Message -->
          <div v-if="error" class="error-message ion-margin-top">
            <ion-text color="danger">
              <p>{{ error }}</p>
            </ion-text>
          </div>

          <!-- Submit Button -->
          <ion-button 
            type="submit"
            expand="block" 
            class="ion-margin-top"
            :disabled="loading"
          >
            <ion-spinner v-if="loading" name="crescent"></ion-spinner>
            <span v-else>Se connecter</span>
          </ion-button>
        </form>

        <!-- Link to Register -->
        <div class="register-link ion-margin-top">
          <ion-text>Pas encore inscrit ?</ion-text>
          <RouterLink :to="{ name: 'register' }">
            S'inscrire ici
          </RouterLink>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { RouterLink } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonSpinner,
  IonText,
  toastController,
  alertController
} from '@ionic/vue';
import { login } from '@/authService';
import { 
  isAccountBlocked, 
  incrementLoginAttempts, 
  resetLoginAttempts,
  getMaxLoginAttempts 
} from '@/services/userService';

const router = useRouter();
const loading = ref(false);
const error = ref('');

const formData = ref({
  email: '',
  password: ''
});

const handleLogin = async () => {
  error.value = '';
  loading.value = true;

  try {
    if (!formData.value.email || !formData.value.password) {
      throw new Error('Veuillez remplir tous les champs');
    }

    // Vérifier si le compte est bloqué
    const blocked = await isAccountBlocked(formData.value.email);
    if (blocked) {
      const alert = await alertController.create({
        header: '🔒 Compte bloqué',
        message: 'Votre compte a été bloqué suite à trop de tentatives de connexion échouées. Veuillez contacter un administrateur pour le débloquer.',
        buttons: ['OK']
      });
      await alert.present();
      loading.value = false;
      return;
    }

    await login(formData.value.email, formData.value.password);
    
    // Réinitialiser les tentatives après connexion réussie
    await resetLoginAttempts(formData.value.email);
    
    const toast = await toastController.create({
      message: 'Connexion réussie !',
      duration: 1500,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();

    router.push({ name: 'home' });
  } catch (err: any) {
    // Incrémenter les tentatives de connexion échouées
    const result = await incrementLoginAttempts(formData.value.email);
    
    if (result.blocked) {
      error.value = '🔒 Compte bloqué ! Trop de tentatives échouées. Contactez un administrateur.';
    } else if (result.attempts > 0) {
      const remaining = getMaxLoginAttempts() - result.attempts;
      error.value = `${err.message || 'Erreur lors de la connexion'} (${remaining} tentative(s) restante(s))`;
    } else {
      error.value = err.message || 'Erreur lors de la connexion';
    }
    
    const toast = await toastController.create({
      message: error.value,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100%;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
  color: var(--ion-color-primary);
}

ion-item {
  margin-bottom: 20px;
}

.error-message {
  border-left: 4px solid var(--ion-color-danger);
  padding: 10px 15px;
  background-color: rgba(255, 71, 87, 0.1);
  border-radius: 4px;
}

.register-link {
  text-align: center;
  font-size: 14px;
}

.register-link ion-text {
  display: block;
  margin-bottom: 8px;
}

ion-router-link {
  color: var(--ion-color-primary);
  text-decoration: none;
  font-weight: bold;
}
</style>
