<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="recap-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" text="" color="light"></ion-back-button>
        </ion-buttons>
        <ion-title>Tableau Récapitulatif</ion-title>
        <ion-buttons slot="end">
          <ion-button v-if="currentUser" @click="handleLogout" fill="clear" color="light">
            <i class="fas fa-sign-out-alt"></i>
          </ion-button>
          <ion-button v-else @click="goToLogin" fill="clear" color="light">
            <i class="fas fa-sign-in-alt"></i>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true">
      <div v-if="loading" class="loading-container">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <p>Chargement des données...</p>
      </div>

      <div v-else class="recap-container">
        <!-- Page Title -->
        <div class="page-header">
          <i class="fas fa-chart-pie"></i>
          <h1>Récapitulatif des Problèmes Routiers</h1>
        </div>
        
        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon stat-icon-primary">
              <i class="fas fa-map-marker-alt"></i>
            </div>
            <div class="stat-value">{{ stats.nombreProblemes }}</div>
            <div class="stat-label">Points signalés</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon stat-icon-secondary">
              <i class="fas fa-ruler-combined"></i>
            </div>
            <div class="stat-value">{{ stats.surfaceTotale.toLocaleString('fr-FR') }}</div>
            <div class="stat-label">m² de surface totale</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon stat-icon-success">
              <i class="fas fa-tasks"></i>
            </div>
            <div class="stat-value">{{ stats.avancementMoyen.toFixed(1) }}%</div>
            <div class="stat-label">Avancement moyen</div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: stats.avancementMoyen + '%' }"
              ></div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon stat-icon-warning">
              <i class="fas fa-coins"></i>
            </div>
            <div class="stat-value">{{ formatBudget(stats.budgetTotal) }}</div>
            <div class="stat-label">Budget total (Ar)</div>
          </div>
        </div>

        <!-- Details Card -->
        <div class="details-card">
          <div class="card-header">
            <i class="fas fa-list-ul"></i>
            <h3>Détails par statut</h3>
          </div>
          
          <div class="status-list">
            <div 
              class="status-item" 
              v-for="stat in stats.parStatut" 
              :key="stat.statut"
            >
              <div class="status-info">
                <span class="status-name">{{ stat.statut }}</span>
                <span class="status-count">{{ stat.count }} problème(s) - {{ stat.pourcentage }}%</span>
              </div>
              <div class="status-badge" :class="getStatutColorClass(stat.statut)">
                {{ stat.count }}
              </div>
            </div>
          </div>
        </div>

        <!-- Action Button -->
        <button class="btn btn-primary" @click="goToMap">
          <i class="fas fa-map"></i>
          Voir sur la carte
        </button>
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
} from '@ionic/vue';
import { getAllProblems } from '@/services/problemService';
import { logout, currentUser } from '@/services/firebase/authService';

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

const formatBudget = (value: number) => {
  if (value >= 1000000000) {
    return (value / 1000000000).toFixed(1) + ' Mrd';
  } else if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + ' M';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + ' K';
  }
  return value.toLocaleString('fr-FR');
};

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

const getStatutColorClass = (statut: string) => {
  const lower = statut.toLowerCase();
  if (lower.includes('nouveau')) return 'badge-warning';
  if (lower.includes('en cours')) return 'badge-primary';
  if (lower.includes('terminé') || lower.includes('résolu')) return 'badge-success';
  return 'badge-secondary';
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
.recap-toolbar {
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

.recap-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px;
}

/* Page Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 32px;
  text-align: center;
}

.page-header i {
  font-size: 28px;
  color: #87BCDE;
}

.page-header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: white;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #2D4654;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.stat-icon i {
  font-size: 24px;
}

.stat-icon-primary {
  background: rgba(135, 188, 222, 0.15);
}
.stat-icon-primary i { color: #87BCDE; }

.stat-icon-secondary {
  background: rgba(128, 94, 115, 0.15);
}
.stat-icon-secondary i { color: #805E73; }

.stat-icon-success {
  background: rgba(16, 185, 129, 0.15);
}
.stat-icon-success i { color: #10B981; }

.stat-icon-warning {
  background: rgba(245, 158, 11, 0.15);
}
.stat-icon-warning i { color: #F59E0B; }

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.progress-bar {
  margin-top: 12px;
  background: #243B4A;
  border-radius: 10px;
  height: 8px;
  overflow: hidden;
}

.progress-fill {
  background: linear-gradient(90deg, #87BCDE, #10B981);
  height: 100%;
  border-radius: 10px;
  transition: width 0.5s ease;
}

/* Details Card */
.details-card {
  background: #2D4654;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
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

.status-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #243B4A;
  border-radius: 12px;
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-name {
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.status-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.status-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.badge-primary {
  background: rgba(135, 188, 222, 0.2);
  color: #87BCDE;
}

.badge-warning {
  background: rgba(245, 158, 11, 0.2);
  color: #F59E0B;
}

.badge-success {
  background: rgba(16, 185, 129, 0.2);
  color: #10B981;
}

.badge-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

/* Action Button */
.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #87BCDE;
  color: #243B4A;
}

.btn-primary:hover {
  background: #6fa8cc;
}

/* Toolbar button */
ion-toolbar ion-button i {
  font-size: 18px;
}

/* Responsive */
@media (max-width: 400px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-value {
    font-size: 24px;
  }
}
</style>
