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
      <Loader v-if="loading" text="Chargement des données..." />

      <div v-else class="recap-container">
        <!-- Page Header -->
        <div class="page-header">
          <div class="header-icon">
            <i class="fas fa-chart-pie"></i>
          </div>
          <h1>Récapitulatif des Problèmes</h1>
          <p class="header-subtitle">Vue d'ensemble des données routières</p>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon-wrapper blue">
              <i class="fas fa-map-marker-alt"></i>
            </div>
            <div class="stat-value">{{ stats.nombreProblemes }}</div>
            <div class="stat-label">Points signalés</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon-wrapper teal">
              <i class="fas fa-ruler-combined"></i>
            </div>
            <div class="stat-value">{{ formatSurface(stats.surfaceTotale) }}</div>
            <div class="stat-label">Surface totale (m²)</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon-wrapper green">
              <i class="fas fa-tasks"></i>
            </div>
            <div class="stat-value">{{ formatPercent(stats.avancementMoyen) }}%</div>
            <div class="stat-label">Avancement moyen</div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: Math.min(stats.avancementMoyen, 100) + '%' }"></div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon-wrapper orange">
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
            <h3>Répartition par statut</h3>
          </div>
          
          <div class="status-list">
            <div class="status-item" v-for="s in stats.parStatut" :key="s.statut">
              <div class="status-left">
                <span class="status-indicator" :class="getStatusClass(s.statut)"></span>
                <span class="status-name">{{ formatStatutLabel(s.statut) }}</span>
              </div>
              <div class="status-right">
                <span class="status-count">{{ s.count }} problème(s)</span>
                <span class="status-badge" :class="getStatusClass(s.statut)">{{ s.pourcentage }}%</span>
              </div>
            </div>
            <div v-if="stats.parStatut.length === 0" class="empty-state">
              <i class="fas fa-inbox"></i>
              <p>Aucune donnée disponible</p>
            </div>
          </div>
        </div>

        <!-- Action Button -->
        <button class="btn-primary" @click="goToMap">
          <i class="fas fa-map-marked-alt"></i>
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
  IonBackButton,
} from '@ionic/vue';
import Loader from '@/components/Loader.vue';
import { getAllProblems } from '@/services/problem.service';
import { logout, currentUser } from '@/services/firebase/auth.service';

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

// Formatage sécurisé des nombres
const safeNumber = (val: any): number => {
  const n = Number(val);
  return isFinite(n) && !isNaN(n) ? n : 0;
};

const formatSurface = (val: any): string => {
  const n = safeNumber(val);
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return Math.round(n).toLocaleString('fr-FR');
};

const formatPercent = (val: any): string => {
  const n = safeNumber(val);
  return n.toFixed(1);
};

const formatBudget = (val: any): string => {
  const n = safeNumber(val);
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'Mrd';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return Math.round(n).toLocaleString('fr-FR');
};

const getStatusClass = (statut: string): string => {
  const s = statut.toLowerCase().replace(/_/g, ' ');
  // Vert: terminé, résolu
  if (s.includes('termin') || s.includes('resolu') || s.includes('résolu')) return 'green';
  // Orange: en cours, traitement
  if (s.includes('en cours') || s.includes('encours') || s.includes('traitement')) return 'orange';
  // Bleu: nouveau, planifié, non commencé, attente
  if (s.includes('nouveau') || s.includes('planifi') || s.includes('non commence') || s.includes('attente')) return 'blue';
  // Rouge: rejeté, annulé
  if (s.includes('rejet') || s.includes('annul')) return 'red';
  // Gris par défaut (non défini, etc.)
  return 'gray';
};

const formatStatutLabel = (statut: string): string => {
  // Capitaliser et formater le libellé
  return statut.charAt(0).toUpperCase() + statut.slice(1).toLowerCase().replace(/_/g, ' ');
};

const loadStats = async () => {
  try {
    loading.value = true;
    const problems = await getAllProblems();
    
    const nombreProblemes = problems.length;
    let surfaceTotale = 0;
    let budgetTotal = 0;
    let totalPourcentage = 0;
    
    problems.forEach(p => {
      surfaceTotale += safeNumber(p.surface);
      budgetTotal += safeNumber(p.budget);
      totalPourcentage += safeNumber(p.statut?.pourcentage);
    });
    
    const avancementMoyen = nombreProblemes > 0 ? totalPourcentage / nombreProblemes : 0;
    
    // Stats par statut
    const statutMap = new Map<string, number>();
    problems.forEach(p => {
      const lib = p.statut?.libelle || 'Non défini';
      statutMap.set(lib, (statutMap.get(lib) || 0) + 1);
    });
    
    const parStatut = Array.from(statutMap.entries())
      .map(([statut, count]) => ({
        statut,
        count,
        pourcentage: nombreProblemes > 0 ? Math.round((count / nombreProblemes) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
    
    stats.value = { nombreProblemes, surfaceTotale, avancementMoyen, budgetTotal, parStatut };
  } catch (error) {
    console.error('Erreur chargement stats:', error);
  } finally {
    loading.value = false;
  }
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
  --background: #274c77;
}

.recap-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px 16px 32px;
}

/* Page Header */
.page-header {
  text-align: center;
  margin-bottom: 28px;
}

.header-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #274c77, #6096ba);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  box-shadow: 0 8px 24px rgba(39, 76, 119, 0.25);
}

.header-icon i {
  font-size: 28px;
  color: #fff;
}

.page-header h1 {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
}

.header-subtitle {
  margin: 0;
  font-size: 14px;
  color: #6B7280;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px 16px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #F0F0F5;
}

.stat-icon-wrapper {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
}

.stat-icon-wrapper i {
  font-size: 22px;
  color: #fff;
}

.stat-icon-wrapper.blue { background: linear-gradient(135deg, #274c77, #3a6491); }
.stat-icon-wrapper.teal { background: linear-gradient(135deg, #6096ba, #7ab3d4); }
.stat-icon-wrapper.green { background: linear-gradient(135deg, #10B981, #34d399); }
.stat-icon-wrapper.orange { background: linear-gradient(135deg, #F59E0B, #fbbf24); }

.stat-value {
  font-size: 26px;
  font-weight: 800;
  color: #1a1a2e;
  margin-bottom: 4px;
  line-height: 1.2;
}

.stat-label {
  font-size: 11px;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.progress-bar {
  margin-top: 14px;
  background: #E5E7EB;
  border-radius: 10px;
  height: 8px;
  overflow: hidden;
}

.progress-fill {
  background: linear-gradient(90deg, #10B981, #34d399);
  height: 100%;
  border-radius: 10px;
  transition: width 0.5s ease;
}

/* Details Card */
.details-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #F0F0F5;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid #E5E7EB;
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

.status-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #F8FAFC;
  border-radius: 12px;
  transition: background 0.2s;
}

.status-item:hover {
  background: #F1F5F9;
}

.status-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-indicator.green { background: #10B981; }
.status-indicator.orange { background: #F59E0B; }
.status-indicator.blue { background: #274c77; }
.status-indicator.red { background: #EF4444; }
.status-indicator.gray { background: #9CA3AF; }

.status-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.status-count {
  font-size: 12px;
  color: #6B7280;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  min-width: 48px;
  text-align: center;
}

.status-badge.green { background: rgba(16, 185, 129, 0.15); color: #059669; }
.status-badge.orange { background: rgba(245, 158, 11, 0.15); color: #D97706; }
.status-badge.blue { background: rgba(39, 76, 119, 0.12); color: #274c77; }
.status-badge.red { background: rgba(239, 68, 68, 0.15); color: #DC2626; }
.status-badge.gray { background: #F3F4F6; color: #6B7280; }

.empty-state {
  text-align: center;
  padding: 32px 16px;
  color: #9CA3AF;
}

.empty-state i {
  font-size: 40px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

/* Action Button */
.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  background: linear-gradient(135deg, #274c77, #3a6491);
  color: #fff;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(39, 76, 119, 0.3);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(39, 76, 119, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary i {
  font-size: 18px;
}

/* Responsive */
@media (max-width: 400px) {
  .stats-grid {
    gap: 10px;
  }
  
  .stat-card {
    padding: 16px 12px;
  }
  
  .stat-value {
    font-size: 22px;
  }
  
  .stat-icon-wrapper {
    width: 44px;
    height: 44px;
  }
  
  .stat-icon-wrapper i {
    font-size: 18px;
  }
}
</style>
