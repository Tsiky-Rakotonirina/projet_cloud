<template>
  <div style="max-width: 280px; font-family: Arial, sans-serif;">
    <div style="background: #FF6B6B; color: white; padding: 8px; margin: -10px -10px 10px -10px; border-radius: 4px 4px 0 0;">
      <b style="font-size: 14px;">⚠️ Problème Routier</b>
    </div>
    
    <div style="margin-bottom: 8px;">
      <p style="margin: 0; font-size: 13px; color: #333;">{{ problem.signalement?.description }}</p>
    </div>

    <!-- Images du signalement -->
    <div v-if="hasImages" style="margin-bottom: 10px;">
      <div style="display: flex; gap: 6px; flex-wrap: wrap;">
        <div 
          v-for="(img, index) in displayImages" 
          :key="index"
          style="width: 60px; height: 60px; border-radius: 6px; overflow: hidden; border: 2px solid #dee2e6;"
        >
          <img 
            :src="img.base64 || img.url" 
            :alt="img.name"
            style="width: 100%; height: 100%; object-fit: cover;"
          />
        </div>
      </div>
      <small style="color: #6c757d; font-size: 10px;">{{ imageCount }} photo(s)</small>
    </div>
    
    <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <b style="font-size: 12px;">Statut:</b>
        <span :style="{background: statutColor, color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px'}">
          {{ statutLibelle }}
        </span>
      </div>
      <div style="margin-top: 4px;">
        <div style="background: #e9ecef; border-radius: 10px; height: 6px; overflow: hidden;">
          <div :style="{background: statutColor, height: '100%', width: pourcentage + '%'}"></div>
        </div>
        <small style="color: #6c757d;">{{ pourcentage }}% complété</small>
      </div>
    </div>
    
    <div style="font-size: 12px; line-height: 1.6;">
      <div style="margin-bottom: 4px;">
        <b>📅 Date:</b> {{ formatDate(problem.signalement?.createdAt) }}
      </div>
      <div style="margin-bottom: 4px;">
        <b>📐 Surface:</b> <span style="color: #007bff;">{{ problem.surface }} m²</span>
      </div>
      <div style="margin-bottom: 4px;">
        <b>💰 Budget:</b> <span style="color: #28a745; font-weight: bold;">{{ formatBudget(problem.budget) }} Ar</span>
      </div>
      <div v-if="problem.entreprise" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #dee2e6;">
        <b>🏢 Entreprise:</b> {{ problem.entreprise.nom }}<br/>
        <small style="color: #6c757d;">📍 {{ problem.entreprise.adresse }}</small><br/>
        <small style="color: #6c757d;">📞 {{ problem.entreprise.telephone }}</small>
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

const getStatutColor = (libelle: string) => {
  const lower = libelle.toLowerCase();
  if (lower.includes('nouveau') || lower.includes('en cours')) return '#FFA500';
  if (lower.includes('terminé') || lower.includes('résolu')) return '#28A745';
  return '#6C757D';
};

const statutLibelle = props.problem.statut?.libelle || 'Non défini';
const statutColor = getStatutColor(statutLibelle);
const pourcentage = props.problem.statut?.pourcentage || 0;

// Images
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
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });
};

const formatBudget = (budget: number) => {
  return budget.toLocaleString('fr-FR');
};
</script>
