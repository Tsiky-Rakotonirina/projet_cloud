<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Inscription</ion-title>
        <ion-buttons slot="start">
          <ion-back-button default-href="/login"></ion-back-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="register-container">
        <h1>Créer un compte</h1>
        
        <form @submit.prevent="handleRegister">
          <!-- Email -->
          <ion-item>
            <ion-label position="floating">Email</ion-label>
            <ion-input
              v-model="formData.email"
              type="email"
              placeholder="Entrez votre email"
              required
            ></ion-input>
          </ion-item>

          <!-- Password -->
          <ion-item>
            <ion-label position="floating">Mot de passe</ion-label>
            <ion-input
              v-model="formData.password"
              type="password"
              placeholder="Min. 6 caractères"
              required
            ></ion-input>
          </ion-item>

          <!-- Confirm Password -->
          <ion-item>
            <ion-label position="floating">Confirmer le mot de passe</ion-label>
            <ion-input
              v-model="formData.confirmPassword"
              type="password"
              placeholder="Confirmez votre mot de passe"
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
            <span v-else>S'inscrire</span>
          </ion-button>
        </form>

        <!-- Link to Login -->
        <div class="login-link ion-margin-top">
          <ion-text>Vous avez déjà un compte ?</ion-text>
          <RouterLink :to="{ name: 'login' }">
            Se connecter ici
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
  IonButtons,
  IonBackButton,
  toastController
} from '@ionic/vue';
import { register } from '@/authService';

const router = useRouter();
const loading = ref(false);
const error = ref('');

const formData = ref({
  email: '',
  password: '',
  confirmPassword: ''
});

const handleRegister = async () => {
  error.value = '';
  loading.value = true;

  try {
    // Validation
    if (!formData.value.email || !formData.value.password) {
      throw new Error('Veuillez remplir tous les champs');
    }

    if (formData.value.password.length < 6) {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères');
    }

    if (formData.value.password !== formData.value.confirmPassword) {
      throw new Error('Les mots de passe ne correspondent pas');
    }

    await register(formData.value.email, formData.value.password);
    
    const toast = await toastController.create({
      message: 'Inscription réussie !',
      duration: 1500,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();

    router.push({ name: 'tabs' });
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de l\'inscription';
    const toast = await toastController.create({
      message: error.value,
      duration: 2000,
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
.register-container {
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

.login-link {
  text-align: center;
  font-size: 14px;
}

.login-link ion-text {
  display: block;
  margin-bottom: 8px;
}

ion-router-link {
  color: var(--ion-color-primary);
  text-decoration: none;
  font-weight: bold;
}
</style>
