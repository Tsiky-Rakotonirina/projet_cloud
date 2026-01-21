<template>
  <ion-page>
    <ion-content :fullscreen="true" class="login-page">
      <!-- Background decoratif -->
      <div class="bg-decoration">
        <div class="bg-shape bg-shape-1"></div>
        <div class="bg-shape bg-shape-2"></div>
        <div class="bg-lines"></div>
      </div>

      <div class="login-container">
        <!-- Header avec logo -->
        <div class="login-header">
          <div class="logo-container">
            <i class="fas fa-road"></i>
          </div>
          <h1 class="app-title">Lalan-Tsara</h1>
          <p class="app-subtitle">Signalement routier</p>
        </div>

        <!-- Card de connexion -->
        <div class="login-card">
          <div class="card-header">
            <div class="card-icon">
              <i class="fas fa-sign-in-alt"></i>
            </div>
            <h2 class="card-title">Connexion</h2>
          </div>

          <form @submit.prevent="handleLogin" class="login-form">
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
                  placeholder="Votre mot de passe"
                  required
                />
                <button type="button" class="toggle-password" @click="showPassword = !showPassword">
                  <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
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
                <i class="fas fa-arrow-right"></i>
                <span>Se connecter</span>
              </template>
            </button>
          </form>

          <!-- Divider -->
          <!-- <div class="divider">
            <span>ou</span>
          </div> -->

          <!-- GitHub Login Button -->
          <!-- <button type="button" class="btn-github" @click="handleGithubLogin" :disabled="loading">
            <ion-spinner v-if="loading" name="crescent"></ion-spinner>
            <template v-else>
              <i class="fab fa-github"></i>
              <span>Se connecter avec GitHub</span>
            </template>
          </button> -->
        </div>

        <!-- Footer -->
        <p class="footer-text">
          <i class="fas fa-shield-alt"></i>
          Connexion sécurisée
        </p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { IonPage, IonContent, IonSpinner, toastController, alertController } from '@ionic/vue';
import { login, loginWithGithub } from '@/services/firebase/authService';
import { isAccountBlocked, incrementLoginAttempts, resetLoginAttempts } from '@/services/userService';
import { getMaxLoginAttempts } from '@/config/auth';

const router = useRouter();
const loading = ref(false);
const error = ref('');
const showPassword = ref(false);

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

    const blocked = await isAccountBlocked(formData.value.email);
    if (blocked) {
      const alert = await alertController.create({
        header: 'Compte bloqué',
        message: 'Votre compte a été bloqué suite à trop de tentatives de connexion échouées. Veuillez contacter un administrateur.',
        buttons: ['OK']
      });
      await alert.present();
      loading.value = false;
      return;
    }

    await login(formData.value.email, formData.value.password);
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
    const result = await incrementLoginAttempts(formData.value.email);
    
    if (result.blocked) {
      error.value = 'Compte bloqué ! Trop de tentatives échouées.';
    } else if (result.attempts > 0) {
      const remaining = getMaxLoginAttempts() - result.attempts;
      if (remaining <= 0) {
        error.value = 'Votre compte a été bloqué. Contactez un administrateur pour le réactiver.';
      } else {
      error.value = `${err.message || 'Erreur de connexion'} (${remaining} tentative(s) restante(s))`;
      }
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

const handleGithubLogin = async () => {
  error.value = '';
  loading.value = true;

  try {
    await loginWithGithub();
    
    const toast = await toastController.create({
      message: 'Connexion avec GitHub réussie !',
      duration: 1500,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();

    router.push({ name: 'home' });
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de la connexion avec GitHub';
    
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
.login-page {
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
  left: -15%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(135, 188, 222, 0.15) 0%, transparent 70%);
}

.bg-shape-2 {
  bottom: -15%;
  right: -10%;
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(128, 94, 115, 0.12) 0%, transparent 70%);
}

.bg-lines {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(135, 188, 222, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(135, 188, 222, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
}

.login-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 24px;
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  background: rgba(135, 188, 222, 0.12);
  border: 2px solid rgba(135, 188, 222, 0.2);
  border-radius: 20px;
  margin-bottom: 16px;
}

.logo-container i {
  font-size: 32px;
  color: #87BCDE;
}

.app-title {
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin: 0 0 4px 0;
  letter-spacing: -0.5px;
}

.app-subtitle {
  font-size: 14px;
  color: #87BCDE;
  margin: 0;
  font-weight: 500;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: #2D4654;
  border-radius: 24px;
  padding: 32px;
  border: 1px solid rgba(135, 188, 222, 0.15);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 28px;
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: rgba(135, 188, 222, 0.15);
  border-radius: 12px;
}

.card-icon i {
  font-size: 18px;
  color: #87BCDE;
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  color: white;
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  padding: 16px 48px 16px 48px;
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
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-github {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  color: white;
  background: #24292e;
  border: 2px solid #24292e;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 20px;
}

.btn-github:hover:not(:disabled) {
  background: #1a1e22;
  border-color: #1a1e22;
}

.btn-github:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-github i {
  font-size: 18px;
}

.divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 24px 0;
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

.footer-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

.footer-text i {
  color: #10B981;
}
</style>
