<template>
  <div style="width: 260px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 12px 14px; margin: -10px -10px 14px -10px; border-radius: 4px 4px 0 0;">
      <span style="font-size: 14px; font-weight: 700; color: #fff;">Problème Routier</span>
    </div>
    
    <!-- Description -->
    <p style="margin: 0 0 14px 0; font-size: 13px; color: #374151; line-height: 1.5;">{{ problem.signalement?.description || 'Aucune description' }}</p>

    <!-- Images -->
    <div v-if="hasImages" style="margin-bottom: 14px;">
      <div style="display: flex; gap: 8px;">
        <div v-for="(img, index) in displayImages" :key="index" style="width: 56px; height: 56px; border-radius: 8px; overflow: hidden; border: 2px solid #E5E7EB;">
          <img :src="img.base64 || img.url" :alt="img.name" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>
      </div>
      <span style="display: block; margin-top: 6px; font-size: 10px; color: #9CA3AF;">{{ imageCount }} photo(s)</span>
    </div>
    
    <!-- Statut -->
    <div style="background: #F9FAFB; padding: 12px; border-radius: 10px; margin-bottom: 14px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 12px; color: #6B7280; font-weight: 500;">Statut:</span>
        <span :style="{ background: statutBg, color: statutColor, padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }">{{ statutLibelle }}</span>
      </div>
      <div>
        <div style="background: #E5E7EB; border-radius: 10px; height: 6px; overflow: hidden;">
          <div :style="{ background: progressColor, height: '100%', width: pourcentage + '%', borderRadius: '10px' }"></div>
        </div>
        <span style="font-size: 10px; color: #9CA3AF; margin-top: 4px; display: block;">{{ pourcentage }}% complété</span>
      </div>
    </div>
    
    <!-- Détails -->
    <div style="font-size: 12px; color: #374151;">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
        <i class="fas fa-calendar" style="width: 16px; text-align: center; color: #6B7280; font-size: 12px;"></i>
        <span><strong>Date:</strong> {{ formatDate(problem.signalement?.createdAt) }}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
        <i class="fas fa-ruler-combined" style="width: 16px; text-align: center; color: #6B7280; font-size: 12px;"></i>
        <span><strong>Surface:</strong> <span style="color: #3B82F6; font-weight: 600;">{{ problem.surface }} m²</span></span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <i class="fas fa-coins" style="width: 16px; text-align: center; color: #6B7280; font-size: 12px;"></i>
        <span><strong>Budget:</strong> <span style="color: #10B981; font-weight: 600;">{{ formatBudget(problem.budget) }} Ar</span></span>
      </div>
      
      <!-- Entreprise -->
      <div v-if="problem.entreprise" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #E5E7EB;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
          <i class="fas fa-building" style="width: 16px; text-align: center; color: #6B7280; font-size: 12px;"></i>
          <span><strong>Entreprise:</strong> {{ problem.entreprise.nom }}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px; margin-left: 26px; margin-bottom: 4px; font-size: 11px; color: #6B7280;">
          <i class="fas fa-map-marker-alt" style="font-size: 10px; color: #9CA3AF;"></i>
          <span>{{ problem.entreprise.adresse }}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px; margin-left: 26px; font-size: 11px; color: #6B7280;">
          <i class="fas fa-phone" style="font-size: 10px; color: #9CA3AF;"></i>
          <span>{{ problem.entreprise.telephone }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Problem } from '@/types/entities';

const props = defineProps<{
  problem: Problem;
}>();

const getStatutStyle = (libelle: string) => {
  const lower = libelle.toLowerCase();
  if (lower.includes('résolu') || lower.includes('resolu') || lower.includes('terminé') || lower.includes('termine')) {
    return { bg: '#D1FAE5', color: '#065F46', progress: '#10B981' };
  }
  if (lower.includes('en cours') || lower.includes('en_cours') || lower.includes('traitement')) {
    return { bg: '#FEF3C7', color: '#92400E', progress: '#F59E0B' };
  }
  if (lower.includes('rejeté') || lower.includes('rejete')) {
    return { bg: '#FEE2E2', color: '#991B1B', progress: '#EF4444' };
  }
  return { bg: '#E0E7FF', color: '#3730A3', progress: '#6366F1' };
};

const statutLibelle = computed(() => props.problem.statut?.libelle || 'Non défini');
const statutStyle = computed(() => getStatutStyle(statutLibelle.value));
const statutBg = computed(() => statutStyle.value.bg);
const statutColor = computed(() => statutStyle.value.color);
const progressColor = computed(() => statutStyle.value.progress);
const pourcentage = computed(() => props.problem.statut?.pourcentage || 0);

const hasImages = computed(() => {
  return props.problem.signalement?.images && props.problem.signalement.images.length > 0;
});

const displayImages = computed(() => {
  return props.problem.signalement?.images?.slice(0, 3) || [];
});

const imageCount = computed(() => {
  return props.problem.signalement?.images?.length || 0;
});

const formatDate = (date: string | undefined) => {
  if (!date) return 'Non spécifiée';
  return new Date(date).toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });
};

const formatBudget = (budget: number) => {
  if (!budget) return '0';
  return budget.toLocaleString('fr-FR');
};
</script>
