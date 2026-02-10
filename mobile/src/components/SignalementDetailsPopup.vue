<template>
  <div class="details-container">
    <!-- Simple Title -->
    <h2 class="page-title">Signalement</h2>
    
    <!-- Description -->
    <div class="details-section">
      <div class="section-title">
        <i class="fas fa-align-left"></i>
        <span>Description</span>
      </div>
      <p class="description-text">{{ signalement.description || 'Aucune description fournie' }}</p>
    </div>

    <!-- Images -->
    <div v-if="hasImages" class="details-section">
      <div class="section-title">
        <i class="fas fa-images"></i>
        <span>Photos ({{ imageCount }})</span>
      </div>
      <div class="images-grid">
        <div v-for="(img, index) in displayImages" :key="index" class="image-item">
          <img :src="img.base64 || img.url" :alt="img.name" />
        </div>
        <div v-if="imageCount > 3" class="image-more">
          <span>+{{ imageCount - 3 }}</span>
        </div>
      </div>
    </div>
    
    <!-- Status Card -->
    <div :class="['status-card', `status-card-${getStatusType}`]">
      <div class="status-row">
        <span class="status-label">
          <i class="fas fa-flag"></i>
          Statut actuel
        </span>
        <span :class="['status-badge', `badge-${getStatusType}`]">
          <i :class="getStatusIcon"></i>
          {{ statutLibelle }}
        </span>
      </div>
      <p v-if="signalement.statut?.descri" class="status-description">
        {{ signalement.statut.descri }}
      </p>
    </div>
    
    <!-- Details Grid -->
    <div class="details-grid">
      <div class="detail-item">
        <div class="detail-icon calendar">
          <i class="fas fa-calendar-alt"></i>
        </div>
        <div class="detail-info">
          <span class="detail-label">Date de création</span>
          <span class="detail-value">{{ formatDate(signalement.createdAt) }}</span>
        </div>
      </div>
      
      <div class="detail-item">
        <div class="detail-icon location">
          <i class="fas fa-map-marker-alt"></i>
        </div>
        <div class="detail-info">
          <span class="detail-label">Position GPS</span>
          <span class="detail-value coordinates">
            {{ signalement.point?.lat?.toFixed(5) }}, {{ signalement.point?.lng?.toFixed(5) }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- Historique -->
    <div v-if="signalement.historiques && signalement.historiques.length > 0" class="history-section">
      <div class="section-title">
        <i class="fas fa-history"></i>
        <span>Historique des statuts</span>
      </div>
      <div class="history-timeline">
        <div v-for="(h, index) in sortedHistoriques" :key="index" class="timeline-item">
          <div :class="['timeline-dot', `dot-${getHistoryStatusType(h)}`]"></div>
          <div class="timeline-content">
            <span class="timeline-date">{{ formatShortDate(h.date) }}</span>
            <span :class="['timeline-status', `text-${getHistoryStatusType(h)}`]">{{ getHistoryLibelle(h) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Signalement } from '@/types/entities';

const props = defineProps<{
  signalement: Signalement;
}>();

// Map des statuts connus
const statutsMap: Record<string, { libelle: string; type: string }> = {
  'nouveau': { libelle: 'Nouveau', type: 'info' },
  'en_attente': { libelle: 'En attente', type: 'warning' },
  'en_cours': { libelle: 'En cours', type: 'warning' },
  'traitement': { libelle: 'En traitement', type: 'warning' },
  'approuve': { libelle: 'Approuvé', type: 'success' },
  'resolu': { libelle: 'Résolu', type: 'success' },
  'termine': { libelle: 'Terminé', type: 'success' },
  'rejete': { libelle: 'Rejeté', type: 'danger' },
  'refuse': { libelle: 'Refusé', type: 'danger' },
};

const getStatusType = computed(() => {
  const libelle = statutLibelle.value.toLowerCase();
  // Résolu/Approuvé/Terminé = succès
  if (libelle.includes('résolu') || libelle.includes('resolu') || libelle.includes('terminé') || libelle.includes('termine') || libelle.includes('approuvé') || libelle.includes('approuve')) {
    return 'success';
  }
  // Rejeté/Refusé = danger
  if (libelle.includes('rejeté') || libelle.includes('rejete') || libelle.includes('refusé') || libelle.includes('refuse')) {
    return 'danger';
  }
  // En cours/Attente/Traitement = warning
  if (libelle.includes('en cours') || libelle.includes('en_cours') || libelle.includes('traitement') || libelle.includes('attente')) {
    return 'warning';
  }
  // Nouveau = primary (bleu thème)
  if (libelle.includes('nouveau')) {
    return 'primary';
  }
  return 'info';
});

const getStatusIcon = computed(() => {
  const type = getStatusType.value;
  switch (type) {
    case 'success': return 'fas fa-check-circle';
    case 'danger': return 'fas fa-times-circle';
    case 'warning': return 'fas fa-clock';
    case 'primary': return 'fas fa-plus-circle';
    default: return 'fas fa-info-circle';
  }
});

const statutLibelle = computed(() => props.signalement.statut?.libelle || 'Non défini');

// Pour l'historique - obtenir le libellé lisible
const getHistoryLibelle = (h: any) => {
  // Si c'est un objet avec un libellé
  if (h.statut?.libelle) return h.statut.libelle;
  // Si l'ID est une clé connue
  const id = String(h.statutId || '').toLowerCase().replace(/[^a-z_]/g, '');
  if (statutsMap[id]) return statutsMap[id].libelle;
  // Sinon afficher l'ID tel quel
  return h.statutId || 'Inconnu';
};

// Pour l'historique - obtenir le type de couleur
const getHistoryStatusType = (h: any) => {
  const libelle = getHistoryLibelle(h).toLowerCase();
  if (libelle.includes('résolu') || libelle.includes('resolu') || libelle.includes('terminé') || libelle.includes('approuvé')) {
    return 'success';
  }
  if (libelle.includes('rejeté') || libelle.includes('rejete') || libelle.includes('refusé')) {
    return 'danger';
  }
  if (libelle.includes('en cours') || libelle.includes('traitement') || libelle.includes('attente')) {
    return 'warning';
  }
  if (libelle.includes('nouveau')) {
    return 'primary';
  }
  return 'info';
};

const hasImages = computed(() => {
  return props.signalement?.images && props.signalement.images.length > 0;
});

const displayImages = computed(() => {
  return props.signalement?.images?.slice(0, 3) || [];
});

const imageCount = computed(() => {
  return props.signalement?.images?.length || 0;
});

const sortedHistoriques = computed(() => {
  const historiques = props.signalement.historiques || [];
  return [...historiques].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
});

const formatDate = (date: string | undefined) => {
  if (!date) return 'Non spécifiée';
  return new Date(date).toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });
};

const formatShortDate = (date: string | undefined) => {
  if (!date) return 'Non spécifiée';
  return new Date(date).toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: 'short',
    year: 'numeric'
  });
};
</script>

<style scoped>
.details-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #FFFFFF;
  padding-top: 8px;
}

/* Page Title */
.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #274c77;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;
}

/* Sections */
.details-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  font-weight: 700;
  color: #274c77;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(39, 76, 119, 0.1);
}

.section-title i {
  font-size: 14px;
  color: #6096ba;
}

.description-text {
  font-size: 15px;
  color: #1a1a2e;
  line-height: 1.7;
  margin: 0;
  padding: 14px 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

/* Images Grid */
.images-grid {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.image-item {
  width: 72px;
  height: 72px;
  border-radius: 12px;
  overflow: hidden;
  border: 3px solid #f1f5f9;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease;
}

.image-item:active {
  transform: scale(0.95);
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-more {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #e2e8f0 0%, #f1f5f9 100%);
  border-radius: 12px;
  border: 3px solid #f1f5f9;
  font-size: 16px;
  font-weight: 700;
  color: #64748b;
}

/* Status Card - with theme variation */
.status-card {
  padding: 16px;
  border-radius: 14px;
  margin-bottom: 24px;
}

.status-card.status-card-success {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.12) 100%);
  border: 1px solid rgba(16, 185, 129, 0.2);
}
.status-card.status-card-warning {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.12) 100%);
  border: 1px solid rgba(245, 158, 11, 0.2);
}
.status-card.status-card-danger {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.12) 100%);
  border: 1px solid rgba(239, 68, 68, 0.2);
}
.status-card.status-card-info {
  background: linear-gradient(135deg, rgba(96, 150, 186, 0.08) 0%, rgba(39, 76, 119, 0.12) 100%);
  border: 1px solid rgba(39, 76, 119, 0.2);
}
.status-card.status-card-primary {
  background: linear-gradient(135deg, rgba(39, 76, 119, 0.08) 0%, rgba(26, 54, 93, 0.12) 100%);
  border: 1px solid rgba(39, 76, 119, 0.2);
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #64748b;
  font-weight: 600;
}

.status-label i {
  font-size: 14px;
  color: #94a3b8;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 24px;
  font-size: 13px;
  font-weight: 700;
}

.status-badge i {
  font-size: 12px;
}

.badge-success {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: #FFFFFF;
}
.badge-warning {
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  color: #FFFFFF;
}
.badge-danger {
  background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
  color: #FFFFFF;
}
.badge-info {
  background: linear-gradient(135deg, #6096ba 0%, #274c77 100%);
  color: #FFFFFF;
}
.badge-primary {
  background: linear-gradient(135deg, #274c77 0%, #1a365d 100%);
  color: #FFFFFF;
}

.status-description {
  font-size: 13px;
  color: #64748b;
  margin: 12px 0 0 0;
  line-height: 1.5;
  font-style: italic;
}

/* Details Grid */
.details-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: #FFFFFF;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.detail-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  flex-shrink: 0;
}

.detail-icon.calendar {
  background: linear-gradient(135deg, rgba(39, 76, 119, 0.1) 0%, rgba(96, 150, 186, 0.15) 100%);
}

.detail-icon.calendar i {
  font-size: 16px;
  color: #274c77;
}

.detail-icon.location {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.15) 100%);
}

.detail-icon.location i {
  font-size: 16px;
  color: #3B82F6;
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a2e;
}

.detail-value.coordinates {
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
  font-weight: 600;
  color: #3B82F6;
  background: rgba(59, 130, 246, 0.08);
  padding: 4px 8px;
  border-radius: 6px;
}

/* History Section */
.history-section {
  padding-top: 20px;
  border-top: 2px solid #f1f5f9;
}

.history-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 16px;
  padding-left: 4px;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  position: relative;
  padding-bottom: 16px;
}

.timeline-item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 16px;
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, #e2e8f0 0%, #f1f5f9 100%);
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 3px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.timeline-dot.dot-success {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
}
.timeline-dot.dot-warning {
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
}
.timeline-dot.dot-danger {
  background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
}
.timeline-dot.dot-info {
  background: linear-gradient(135deg, #6096ba 0%, #274c77 100%);
}
.timeline-dot.dot-primary {
  background: linear-gradient(135deg, #274c77 0%, #1a365d 100%);
}

.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #f8fafc;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  flex: 1;
}

.timeline-date {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.timeline-status {
  font-size: 14px;
  font-weight: 600;
}

.timeline-status.text-success {
  color: #059669;
}
.timeline-status.text-warning {
  color: #D97706;
}
.timeline-status.text-danger {
  color: #DC2626;
}
.timeline-status.text-info {
  color: #274c77;
}
.timeline-status.text-primary {
  color: #274c77;
}
</style>
