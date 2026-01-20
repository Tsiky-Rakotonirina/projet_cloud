<template>
  <ion-page>
    <ion-content :fullscreen="true" class="register-page">
      <!-- Background decoratif -->
      <div class="bg-decoration">
        <div class="bg-shape bg-shape-1"></div>
        <div class="bg-shape bg-shape-2"></div>
        <div class="bg-lines"></div>
      </div>

      <div class="register-container">
        <!-- Back button -->
        <RouterLink :to="{ name: 'login' }" class="back-link">
          <i class="fas fa-arrow-left"></i>
          <span>Retour</span>
        </RouterLink>

        <!-- Header -->
        <div class="register-header">
          <div class="logo-container">
            <i class="fas fa-user-plus"></i>
          </div>
          <h1 class="page-title">Créer un compte</h1>
          <p class="page-subtitle">Rejoignez Lalan-Tsara</p>
        </div>

        <!-- Card d'inscription -->
        <div class="register-card">
          <form @submit.prevent="handleRegister" class="register-form">
            <!-- Email -->
            <div class="form-group">
              <label class="form-label">Email</label>
              <div class="input-wrapper">
                <i class="fas fa-envelope input-icon"></i>
                <input
                  v-model="formData.email"
                  type="email"
                  class="form-input"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            <!-- Password -->
            <div class="form-group">
              <label class="form-label">Mot de passe</label>
              <div class="input-wrapper">
                <i class="fas fa-lock input-icon"></i>
                <input
                  v-model="formData.password"
                  :type="showPassword ? 'text' : 'password'"
                  class="form-input"
                  placeholder="Min. 6 caractères"
                  required
                />
                <button type="button" class="toggle-password" @click="showPassword = !showPassword">
                  <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </div>
            </div>

            <!-- Confirm Password -->
            <div class="form-group">
              <label class="form-label">Confirmer le mot de passe</label>
              <div class="input-wrapper">
                <i class="fas fa-lock input-icon"></i>
                <input
                  v-model="formData.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  class="form-input"
                  placeholder="Confirmez votre mot de passe"
                  required
                />
                <button type="button" class="toggle-password" @click="showConfirmPassword = !showConfirmPassword">
                  <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </div>
            </div>

            <!-- Error Message -->
            <div v-if="error" class="error-box">
              <i class="fas fa-exclamation-circle"></i>
              <span>{{ error }}</span>
            </div>

            <!-- Submit Button -->
            <button type="submit" class="btn-submit" :disabled="loading">
              <ion-spinner v-if="loading" name="crescent"></ion-spinner>
              <template v-else>
                <i class="fas fa-check"></i>
                <span>S'inscrire</span>
              </template>
            </button>
          </form>

          <!-- Divider -->
          <div class="divider">
            <span>ou</span>
          </div>

          <!-- Link to Login -->
          <div class="login-section">
            <p class="login-text">Déjà un compte ?</p>
            <RouterLink :to="{ name: 'login' }" class="btn-login">
              <i class="fas fa-sign-in-alt"></i>
              <span>Se connecter</span>
            </RouterLink>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { IonPage, IonContent, IonSpinner, toastController } from '@ionic/vue';
import { register } from '@/services/firebase/authService';

const router = useRouter();
const loading = ref(false);
const error = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const formData = ref({
  email: '',
  password: '',
  confirmPassword: ''
});

const handleRegister = async () => {
  error.value = '';
  loading.value = true;

  try {
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

    router.push({ name: 'home' });
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
.register-page {
  --background: #243B4A;
}

.bg-decoration {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.bg-shape {
  position: absolute;
  border-radius: 50%;
}

.bg-shape-1 {
  top: -10%;
  right: -15%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(128, 94, 115, 0.15) 0%, transparent 70%);
}

.bg-shape-2 {
  bottom: -15%;
  left: -10%;
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(135, 188, 222, 0.12) 0%, transparent 70%);
}

.bg-lines {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(135, 188, 222, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(135, 188, 222, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
}

.register-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100%;
  padding: 24px;
  padding-top: calc(24px + var(--ion-safe-area-top, 0px));
  z-index: 1;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  color: #87BCDE;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 24px;
  transition: opacity 0.2s;
}

.back-link:hover {
  opacity: 0.8;
}

.register-header {
  text-align: center;
  margin-bottom: 24px;
}

.logo-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: rgba(128, 94, 115, 0.15);
  border: 2px solid rgba(128, 94, 115, 0.2);
  border-radius: 18px;
  margin-bottom: 16px;
}

.logo-container i {
  font-size: 28px;
  color: #805E73;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin: 0 0 4px 0;
  letter-spacing: -0.5px;
}

.page-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.register-card {
  width: 100%;
  max-width: 400px;
  background: #2D4654;
  border-radius: 24px;
  padding: 28px;
  border: 1px solid rgba(135, 188, 222, 0.15);
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #87BCDE;
  font-size: 16px;
  pointer-events: none;
}

.form-input {
  width: 100%;
  padding: 14px 48px 14px 48px;
  font-size: 15px;
  font-family: inherit;
  color: white;
  background: #243B4A;
  border: 2px solid rgba(135, 188, 222, 0.2);
  border-radius: 12px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #87BCDE;
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.toggle-password {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  padding: 4px;
}

.toggle-password:hover {
  color: #87BCDE;
}

.error-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  font-size: 14px;
  color: #F87171;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
}

.error-box i {
  font-size: 16px;
}

.btn-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  color: #243B4A;
  background: #87BCDE;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 4px;
}

.btn-submit:hover:not(:disabled) {
  background: #6fa8cc;
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 20px 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(135, 188, 222, 0.2);
}

.divider span {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
}

.login-section {
  text-align: center;
}

.login-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 12px 0;
}

.btn-login {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  color: #87BCDE;
  background: transparent;
  border: 2px solid rgba(135, 188, 222, 0.3);
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-login:hover {
  background: rgba(135, 188, 222, 0.1);
  border-color: #87BCDE;
}
</style>
