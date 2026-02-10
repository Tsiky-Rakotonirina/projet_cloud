<template>
  <div class="signalement-details">
    <!-- Header -->
    <div class="details-header">
      <i class="fas fa-map-marker-alt"></i>
      <span>Détails du Signalement</span>
    </div>
    
    <!-- Description -->
    <div class="details-section">
      <h4 class="section-title">Description</h4>
      <p class="description">{{ signalement.description || 'Aucune description' }}</p>
    </div>

    <!-- Images -->
    <div v-if="hasImages" class="details-section">
      <h4 class="section-title">Photos</h4>
      <div class="images-grid">
        <div v-for="(img, index) in displayImages" :key="index" class="image-item">
          <img :src="img.base64 || img.url" :alt="img.name" />
        </div>
      </div>
      <span class="image-count">{{ imageCount }} photo(s)</span>
    </div>
    
    <!-- Statut -->
    <div class="details-section">
      <h4 class="section-title">Statut actuel</h4>
      <div class="status-box">
        <span :class="['status-badge', statusClass]">{{ statutLibelle }}</span>
        <p v-if="signalement.statut?.descri" class="status-description">{{ signalement.statut.descri }}</p>
      </div>
    </div>
    
    <!-- Infos -->
    <div class="details-section">
      <h4 class="section-title">Informations</h4>
      <div class="info-row">
        <i class="fas fa-calendar"></i>
        <span>Créé le {{ formatDate(signalement.createdAt) }}</span>
      </div>
      <div class="info-row">
        <i class="fas fa-map-pin"></i>
        <span>{{ signalement.point?.lat?.toFixed(4) }}, {{ signalement.point?.lng?.toFixed(4) }}</span>
      </div>
    </div>

    <!-- Historique -->
    <div v-if="signalement.historiques && signalement.historiques.length > 0" class="details-section">
      <h4 class="section-title">Historique</h4>
      <div class="historique-list">
        <div v-for="(h, index) in sortedHistoriques" :key="index" class="historique-item">
          <div class="historique-date">{{ formatDate(h.date) }}</div>
          <div class="historique-status">Statut: {{ h.statutId }}</div>
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

const statutLibelle = computed(() => props.signalement.statut?.libelle || 'Non défini');

const statusClass = computed(() => {
  const lower = statutLibelle.value.toLowerCase();
  if (lower.includes('résolu') || lower.includes('resolu') || lower.includes('terminé') || lower.includes('termine') || lower.includes('approuvé') || lower.includes('approuve')) {
    return 'status-success';
  }
  if (lower.includes('en cours') || lower.includes('en_cours') || lower.includes('traitement') || lower.includes('en attente')) {
    return 'status-warning';
  }
  if (lower.includes('rejeté') || lower.includes('rejete') || lower.includes('refusé')) {
    return 'status-danger';
  }
  return 'status-default';
});

const hasImages = computed(() => {
  return props.signalement?.images && props.signalement.images.length > 0;
});

const displayImages = computed(() => {
  return props.signalement?.images?.slice(0, 4) || [];
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
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<style scoped>
.signalement-details {
  padding: 0;
}

.details-header {
  background: linear-gradient(135deg, #274c77 0%, #1a365d 100%);
  padding: 16px;
  margin: -16px -16px 16px -16px;
  border-radius: 12px 12px 0 0;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  font-weight: 600;
  font-size: 16px;
}

.details-header i {
  font-size: 18px;
}

.details-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 8px 0;
}

.description {
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
  margin: 0;
}

.images-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.image-item {
  width: 70px;
  height: 70px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #E5E7EB;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-count {
  display: block;
  margin-top: 6px;
  font-size: 11px;
  color: #9CA3AF;
}

.status-box {
  background: #F9FAFB;
  padding: 12px;
  border-radius: 10px;
}

.status-badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-success {
  background: #D1FAE5;
  color: #065F46;
}

.status-warning {
  background: #FEF3C7;
  color: #92400E;
}

.status-danger {
  background: #FEE2E2;
  color: #991B1B;
}

.status-default {
  background: #E0E7FF;
  color: #3730A3;
}

.status-description {
  font-size: 12px;
  color: #6B7280;
  margin: 8px 0 0 0;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #374151;
  margin-bottom: 8px;
}

.info-row i {
  width: 16px;
  text-align: center;
  color: #6B7280;
  font-size: 12px;
}

.historique-list {
  max-height: 150px;
  overflow-y: auto;
}

.historique-item {
  padding: 8px 12px;
  background: #F9FAFB;
  border-radius: 8px;
  margin-bottom: 6px;
}

.historique-date {
  font-size: 11px;
  color: #6B7280;
}

.historique-status {
  font-size: 12px;
  color: #374151;
  font-weight: 500;
}
</style>
