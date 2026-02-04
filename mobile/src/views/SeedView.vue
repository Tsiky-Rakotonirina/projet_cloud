<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Seeding Firestore</ion-title>
        <ion-buttons slot="start">
          <ion-back-button default-href="/"></ion-back-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Initialisation des données</ion-card-title>
          <ion-card-subtitle>Outil de développement</ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <p>Cette page permet d'insérer les données de test dans Firestore.</p>

          <ion-button
            expand="block"
            color="primary"
            :disabled="isLoading"
            @click="seedData"
          >
            <ion-icon slot="start" name="cloud-upload"></ion-icon>
            Insérer les données de seed
          </ion-button>

          <ion-button
            expand="block"
            color="danger"
            fill="outline"
            :disabled="isLoading"
            @click="clearData"
            class="ion-margin-top"
          >
            <ion-icon slot="start" name="trash"></ion-icon>
            Vider toutes les données
          </ion-button>
        </ion-card-content>
      </ion-card>

      <ion-card v-if="result">
        <ion-card-header>
          <ion-card-title :color="result.success ? 'success' : 'danger'">
            {{ result.success ? 'Succès' : 'Erreur' }}
          </ion-card-title>
        </ion-card-header>

        <ion-card-content>
          <p>{{ result.message }}</p>
          <pre v-if="result.details" class="result-details">{{ result.details }}</pre>
        </ion-card-content>
      </ion-card>

      <ion-loading
        :is-open="isLoading"
        message="Traitement en cours..."
      ></ion-loading>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonButton, IonIcon, IonBackButton, IonButtons, IonLoading } from '@ionic/vue';
import { seedFirestoreData, clearAllCollections } from '@/services/firestore-seed.service';

const isLoading = ref(false);
const result = ref<{ success: boolean; message: string; details?: string } | null>(null);

const seedData = async () => {
  isLoading.value = true;
  result.value = null;

  try {
    const seedResult = await seedFirestoreData();
    result.value = seedResult;
  } catch (error: any) {
    result.value = {
      success: false,
      message: 'Erreur lors du seeding',
      details: error.message
    };
  } finally {
    isLoading.value = false;
  }
};

const clearData = async () => {
  if (!confirm('⚠️ ATTENTION: Cette action va supprimer TOUTES les données de Firestore. Continuer ?')) {
    return;
  }

  isLoading.value = true;
  result.value = null;

  try {
    const clearResult = await clearAllCollections();
    result.value = clearResult;
  } catch (error: any) {
    result.value = {
      success: false,
      message: 'Erreur lors de la suppression',
      details: error.message
    };
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.result-details {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
}
</style>