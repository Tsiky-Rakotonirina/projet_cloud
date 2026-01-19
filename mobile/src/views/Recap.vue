<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Tableau Récapitulatif</ion-title>
        <ion-buttons slot="end">
          <ion-button v-if="currentUser" @click="handleLogout">
            <ion-icon :icon="logOutOutline"></ion-icon>
          </ion-button>
          <ion-button v-else @click="goToLogin">
            <ion-icon :icon="logInOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true" class="ion-padding">
      <div v-if="loading" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Chargement des données...</p>
      </div>

      <div v-else class="recap-container">
        <h1 class="page-title">📊 Récapitulatif des Problèmes Routiers</h1>
        
        <ion-grid>
          <ion-row>
            <ion-col size="12" size-md="6">
              <ion-card class="stat-card">
                <ion-card-content>
                  <div class="stat-icon">📍</div>
                  <div class="stat-value">{{ stats.nombreProblemes }}</div>
                  <div class="stat-label">Points signalés</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            
            <ion-col size="12" size-md="6">
              <ion-card class="stat-card">
                <ion-card-content>
                  <div class="stat-icon">📐</div>
                  <div class="stat-value">{{ stats.surfaceTotale.toLocaleString('fr-FR') }}</div>
                  <div class="stat-label">m² de surface totale</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            
            <ion-col size="12" size-md="6">
              <ion-card class="stat-card">
                <ion-card-content>
                  <div class="stat-icon">📈</div>
                  <div class="stat-value">{{ stats.avancementMoyen.toFixed(1) }}%</div>
                  <div class="stat-label">Avancement moyen</div>
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :style="{ width: stats.avancementMoyen + '%' }"
                    ></div>
                  </div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            
            <ion-col size="12" size-md="6">
              <ion-card class="stat-card">
                <ion-card-content>
                  <div class="stat-icon">💰</div>
                  <div class="stat-value">{{ stats.budgetTotal.toLocaleString('fr-FR') }}</div>
                  <div class="stat-label">Ariary de budget total</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>

        <ion-card class="details-card">
          <ion-card-header>
            <ion-card-title>Détails par statut</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item v-for="stat in stats.parStatut" :key="stat.statut">
                <ion-label>
                  <h3>{{ stat.statut }}</h3>
                  <p>{{ stat.count }} problème(s) - {{ stat.pourcentage }}%</p>
                </ion-label>
                <ion-badge slot="end" :color="getStatutColor(stat.statut)">
                  {{ stat.count }}
                </ion-badge>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <ion-button expand="block" @click="goToMap" class="action-button">
          <ion-icon :icon="mapOutline" slot="start"></ion-icon>
          Voir sur la carte
        </ion-button>
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
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonBackButton,
} from '@ionic/vue';
import { mapOutline, logOutOutline, logInOutline } from 'ionicons/icons';
import { getAllProblems } from '@/services/problemService';
import { logout, currentUser } from '@/authService';

const router = useRouter();
const loading = ref(true);

interface Stats {
  nombreProblemes: number;
  surfaceTotale: number;
  avancementMoyen: number;
  budgetTotal: number;
  parStatut: Array<{
    statut: string;
    count: number;
    pourcentage: number;
  }>;
}

const stats = ref<Stats>({
  nombreProblemes: 0,
  surfaceTotale: 0,
  avancementMoyen: 0,
  budgetTotal: 0,
  parStatut: []
});

const loadStats = async () => {
  try {
    loading.value = true;
    const problems = await getAllProblems();
    
    // Calculer les statistiques
    const nombreProblemes = problems.length;
    const surfaceTotale = problems.reduce((sum, p) => sum + p.surface, 0);
    const budgetTotal = problems.reduce((sum, p) => sum + p.budget, 0);
    
    // Calculer l'avancement moyen
    const totalPourcentage = problems.reduce((sum, p) => {
      return sum + (p.statut?.pourcentage || 0);
    }, 0);
    const avancementMoyen = nombreProblemes > 0 ? totalPourcentage / nombreProblemes : 0;
    
    // Statistiques par statut
    const statutMap = new Map<string, number>();
    problems.forEach(p => {
      const statutLibelle = p.statut?.libelle || 'Non défini';
      statutMap.set(statutLibelle, (statutMap.get(statutLibelle) || 0) + 1);
    });
    
    const parStatut = Array.from(statutMap.entries()).map(([statut, count]) => ({
      statut,
      count,
      pourcentage: nombreProblemes > 0 ? Math.round((count / nombreProblemes) * 100) : 0
    })).sort((a, b) => b.count - a.count);
    
    stats.value = {
      nombreProblemes,
      surfaceTotale,
      avancementMoyen,
      budgetTotal,
      parStatut
    };
  } catch (error) {
    console.error('Erreur lors du chargement des statistiques:', error);
  } finally {
    loading.value = false;
  }
};

const getStatutColor = (statut: string) => {
  const lower = statut.toLowerCase();
  if (lower.includes('nouveau')) return 'warning';
  if (lower.includes('en cours')) return 'primary';
  if (lower.includes('terminé') || lower.includes('résolu')) return 'success';
  return 'medium';
};

const goToMap = () => {
  router.push({ name: 'map' });
};

const goToLogin = () => {
  router.push({ name: 'login' });
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
  loadStats();
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

.recap-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  text-align: center;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: var(--ion-color-primary);
}

.stat-card {
  margin: 0;
  height: 100%;
}

.stat-card ion-card-content {
  text-align: center;
  padding: 1.5rem;
}

.stat-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--ion-color-primary);
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.progress-bar {
  margin-top: 0.8rem;
  background: var(--ion-color-light);
  border-radius: 10px;
  height: 8px;
  overflow: hidden;
}

.progress-fill {
  background: linear-gradient(90deg, var(--ion-color-primary), var(--ion-color-secondary));
  height: 100%;
  transition: width 0.5s ease;
}

.details-card {
  margin-top: 1rem;
}

.action-button {
  margin-top: 1.5rem;
  --background: var(--ion-color-primary);
}

ion-badge {
  font-size: 1rem;
  padding: 0.5rem 0.8rem;
}
</style>
