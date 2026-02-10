<template>
  <div style="width: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 12px 14px; margin: -10px -10px 14px -10px; border-radius: 4px 4px 0 0;">
      <span style="font-size: 14px; font-weight: 700; color: #fff;">Signalement</span>
    </div>
    
    <!-- Description -->
    <p style="margin: 0 0 14px 0; font-size: 13px; color: #374151; line-height: 1.5;">{{ signalement.description || 'Aucune description' }}</p>

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
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 12px; color: #6B7280; font-weight: 500;">Statut:</span>
        <span :style="{ background: statutBg, color: statutColor, padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }">{{ statutLibelle }}</span>
      </div>
      <p v-if="signalement.statut?.descri" style="font-size: 11px; color: #6B7280; margin: 8px 0 0 0;">{{ signalement.statut.descri }}</p>
    </div>
    
    <!-- Détails -->
    <div style="font-size: 12px; color: #374151;">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
        <i class="fas fa-calendar" style="width: 16px; text-align: center; color: #6B7280; font-size: 12px;"></i>
        <span><strong>Date:</strong> {{ formatDate(signalement.createdAt) }}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
        <i class="fas fa-map-pin" style="width: 16px; text-align: center; color: #6B7280; font-size: 12px;"></i>
        <span><strong>Position:</strong> <span style="color: #3B82F6; font-weight: 600;">{{ signalement.point?.lat?.toFixed(4) }}, {{ signalement.point?.lng?.toFixed(4) }}</span></span>
      </div>
    </div>
    
    <!-- Historique -->
    <div v-if="signalement.historiques && signalement.historiques.length > 0" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #E5E7EB;">
      <span style="font-size: 12px; color: #6B7280; font-weight: 500; display: block; margin-bottom: 8px;">Historique des statuts</span>
      <div v-for="(h, index) in sortedHistoriques" :key="index" style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px; font-size: 11px; color: #6B7280;">
        <i class="fas fa-history" style="font-size: 10px; color: #9CA3AF;"></i>
        <span>{{ formatShortDate(h.date) }} - {{ h.statutId }}</span>
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

const getStatutStyle = (libelle: string) => {
  const lower = libelle.toLowerCase();
  if (lower.includes('résolu') || lower.includes('resolu') || lower.includes('terminé') || lower.includes('termine') || lower.includes('approuvé') || lower.includes('approuve')) {
    return { bg: '#D1FAE5', color: '#065F46' };
  }
  if (lower.includes('en cours') || lower.includes('en_cours') || lower.includes('traitement') || lower.includes('en attente')) {
    return { bg: '#FEF3C7', color: '#92400E' };
  }
  if (lower.includes('rejeté') || lower.includes('rejete') || lower.includes('refusé')) {
    return { bg: '#FEE2E2', color: '#991B1B' };
  }
  return { bg: '#E0E7FF', color: '#3730A3' };
};

const statutLibelle = computed(() => props.signalement.statut?.libelle || 'Non défini');
const statutStyle = computed(() => getStatutStyle(statutLibelle.value));
const statutBg = computed(() => statutStyle.value.bg);
const statutColor = computed(() => statutStyle.value.color);

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
