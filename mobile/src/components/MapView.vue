<template>
  <div class="map-container">
    <div id="map" ref="mapContainer"></div>
    
    <!-- Légende compacte -->
    <div class="map-legend" :class="{ collapsed: legendCollapsed }" @click="legendCollapsed = !legendCollapsed">
      <div class="legend-header">
        <span>Légende</span>
        <i class="fas" :class="legendCollapsed ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
      </div>
      <div class="legend-content" v-show="!legendCollapsed">
        <div class="legend-section">
          <div class="legend-title">Types</div>
          <div class="legend-row">
            <span class="icon-flag blue"></span><span>Signalement</span>
          </div>
          <div class="legend-row">
            <span class="icon-teardrop violet"></span><span>Problème</span>
          </div>
        </div>
        <div class="legend-divider"></div>
        <div class="legend-section">
          <div class="legend-title">Statuts</div>
          <div class="legend-row">
            <span class="dot violet"></span><span>Nouveau</span>
            <span class="dot orange"></span><span>En cours</span>
          </div>
          <div class="legend-row">
            <span class="dot green"></span><span>Résolu</span>
            <span class="dot red"></span><span>Rejeté</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getAllProblems, getMySignalements } from '@/services/problem.service';
import type { Problem, Signalement } from '@/types/entities';
import { auth } from '@/services/firebase/firebase';
import { createPopupContent } from '@/utils/popupUtils';

const props = defineProps<{
  filterMine?: boolean;
}>();

const emit = defineEmits(['problemsLoaded', 'mapClicked']);

const mapContainer = ref<HTMLElement | null>(null);
const legendCollapsed = ref(true);
let map: L.Map | null = null;
let problemMarkers: L.Marker[] = [];
const problems = ref<Problem[]>([]);
const signalements = ref<Signalement[]>([]);

// Coordonnées d'Antananarivo
const ANTANANARIVO_CENTER: [number, number] = [-18.8792, 47.5079];

// Palette couleurs
const COLORS = {
  blue: '#4285F4',     // Google Blue
  violet: '#A142F4',   // Google Purple
  orange: '#FBBC04',   // Google Yellow/Orange
  green: '#34A853',    // Google Green
  red: '#EA4335',      // Google Red
};

// Créer une icône teardrop (goutte) pour les PROBLÈMES
const createTeardropIcon = (color: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 24 12 24s12-16.8 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="12" cy="12" r="5" fill="white"/>
  </svg>`;
  return L.icon({
    iconUrl: 'data:image/svg+xml,' + encodeURIComponent(svg),
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36]
  });
};

// Créer une icône drapeau pour les SIGNALEMENTS
const createFlagIcon = (color: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32">
    <rect x="3" y="0" width="3" height="32" fill="#555" rx="1"/>
    <path d="M6 2 L22 2 L18 9 L22 16 L6 16 Z" fill="${color}" stroke="white" stroke-width="1.5"/>
  </svg>`;
  return L.icon({
    iconUrl: 'data:image/svg+xml,' + encodeURIComponent(svg),
    iconSize: [24, 32],
    iconAnchor: [4, 32],
    popupAnchor: [8, -32]
  });
};

// Déterminer la couleur selon le statut
const getStatusColor = (statutLibelle: string): string => {
  const lower = statutLibelle.toLowerCase();
  if (lower.includes('résolu') || lower.includes('resolu') || lower.includes('terminé')) return COLORS.green;
  if (lower.includes('en cours') || lower.includes('traitement')) return COLORS.orange;
  if (lower.includes('rejeté') || lower.includes('rejete')) return COLORS.red;
  return COLORS.violet; // Nouveau/En attente
};

// Créer l'icône teardrop selon le statut (pour PROBLÈMES)
const createProblemIcon = (statutLibelle: string) => {
  return createTeardropIcon(getStatusColor(statutLibelle));
};

// Créer une icône drapeau selon le statut (pour SIGNALEMENTS)
const createSignalementIcon = (statutLibelle: string = 'En attente') => {
  return createFlagIcon(getStatusColor(statutLibelle));
};

// Déterminer la couleur de fond et texte pour le statut de signalement
const getSignalementStatutStyle = (libelle: string): { bg: string; color: string } => {
  const lower = libelle.toLowerCase();
  if (lower.includes('nouveau')) return { bg: '#FFF3CD', color: '#856404' };
  if (lower.includes('en cours')) return { bg: '#D1ECF1', color: '#0C5460' };
  if (lower.includes('resolu') || lower.includes('résolu')) return { bg: '#D4EDDA', color: '#155724' };
  if (lower.includes('rejete') || lower.includes('rejeté')) return { bg: '#F8D7DA', color: '#721C24' };
  return { bg: '#E2E3E5', color: '#383D41' };
};

// Créer le contenu HTML du popup pour un signalement (avec images)
const createSignalementPopupContent = (sig: Signalement): string => {
  let imagesHtml = '';
  if (sig.images && sig.images.length > 0) {
    const imageThumbs = sig.images.slice(0, 3).map(img => {
      const src = img.base64 || img.url || '';
      return `<div style="width: 60px; height: 60px; border-radius: 8px; overflow: hidden; border: 2px solid #E5E7EB;">
        <img src="${src}" alt="${img.name || 'Image'}" style="width: 100%; height: 100%; object-fit: cover;"/>
      </div>`;
    }).join('');
    
    imagesHtml = `
      <div style="margin: 12px 0;">
        <div style="display: flex; gap: 6px;">${imageThumbs}</div>
        <small style="color: #9CA3AF; font-size: 10px; margin-top: 4px; display: block;">${sig.images.length} photo(s)</small>
      </div>
    `;
  }

  // Utiliser le statut résolu depuis l'historique
  const statutLibelle = sig.statut?.libelle || 'En attente';
  const statutStyle = getSignalementStatutStyle(statutLibelle);
  
  return `
    <div style="width: 250px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); padding: 10px 12px; margin: -10px -10px 12px -10px; border-radius: 4px 4px 0 0;">
        <span style="font-size: 13px; font-weight: 600; color: #fff;">Mon Signalement</span>
      </div>
      
      <p style="margin: 0 0 12px 0; font-size: 13px; color: #374151; line-height: 1.4;">${sig.description}</p>
      
      ${imagesHtml}
      
      <div style="background: #F9FAFB; padding: 10px; border-radius: 8px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <i class="fas fa-calendar" style="color: #6B7280; font-size: 12px;"></i>
          <span style="font-size: 12px; color: #6B7280;">${new Date(sig.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
        </div>
        <span style="display: inline-block; background: ${statutStyle.bg}; color: ${statutStyle.color}; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600;">
          ${statutLibelle}
        </span>
      </div>
    </div>
  `;
};

const clearProblemMarkers = () => {
  if (map) {
    problemMarkers.forEach(marker => {
      map!.removeLayer(marker);
    });
    problemMarkers = [];
  }
};

const loadProblems = async (filterByUser: boolean = false) => {
  try {
    clearProblemMarkers();
    
    const currentUserId = auth.currentUser?.uid;
    console.log(`📍 loadProblems: filterByUser=${filterByUser}, currentUserId=${currentUserId}`);
    
    let allProblems = await getAllProblems();
    console.log(`📍 Total problèmes récupérés: ${allProblems.length}`);
    
    // Si on filtre par utilisateur connecté
    if (filterByUser && currentUserId) {
      // Récupérer mes signalements
      const mySignalementsList = await getMySignalements();
      signalements.value = mySignalementsList;
      const mySignalementIds = mySignalementsList.map(s => s.id);
      console.log(`📍 Mes signalements: ${mySignalementIds.length}`, mySignalementIds);
      
      // Filtrer les problèmes liés à mes signalements
      allProblems = allProblems.filter(p => mySignalementIds.includes(p.signalementId));
      console.log(`📍 Problèmes filtrés pour mes signalements: ${allProblems.length}`);
      
      // Ajouter aussi les signalements qui n'ont pas encore de problème associé
      mySignalementsList.forEach(sig => {
        const hasProblem = allProblems.some(p => p.signalementId === sig.id);
        if (!hasProblem && map) {
          const sigStatut = sig.statut?.libelle || 'En attente';
          const marker = L.marker([sig.point.lat, sig.point.lng], { 
            icon: createSignalementIcon(sigStatut) 
          }).addTo(map);
          
          const popupContent = createSignalementPopupContent(sig);
          marker.bindPopup(popupContent, { maxWidth: 300 });
          problemMarkers.push(marker);
        }
      });
    }
    
    problems.value = allProblems;
    emit('problemsLoaded', allProblems.length);
    
    // Afficher les marqueurs des problèmes sur la carte (icône teardrop)
    if (map) {
      allProblems.forEach(problem => {
        if (problem.signalement) {
          const { lat, lng } = problem.signalement.point;
          const statutLibelle = problem.statut?.libelle || 'Non défini';
          const marker = L.marker([lat, lng], { icon: createProblemIcon(statutLibelle) }).addTo(map!);
          problemMarkers.push(marker);
          
          // Générer le contenu de la popup avec le composant réutilisable
          const popupContent = createPopupContent(problem);
          marker.bindPopup(popupContent, { maxWidth: 300 });
        }
      });
    }
  } catch (error) {
    console.error("Erreur lors du chargement des problèmes:", error);
  }
};

onMounted(() => {
  if (!mapContainer.value) return;

  // Initialiser la carte centrée sur Antananarivo
  map = L.map(mapContainer.value, {
    center: ANTANANARIVO_CENTER,
    zoom: 13,
  });

  // Ajouter le layer de tuiles OpenStreetMap standard
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);

  // Émettre un événement mapClicked quand on clique sur la carte
  map.on('click', (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng;
    emit('mapClicked', { lat, lng });
  });

  // Note: Les marqueurs de la capitale et points d'intérêt ont été supprimés
  // pour ne garder que les signalements utilisateurs

  // Charger et afficher les problèmes routiers
  loadProblems(props.filterMine);

  // Forcer le redimensionnement de la carte après le montage
  setTimeout(() => {
    map?.invalidateSize();
  }, 100);
});

// Surveiller les changements de filtre
watch(() => props.filterMine, (newValue) => {
  loadProblems(newValue);
});

onUnmounted(() => {
  // Nettoyer la carte lors du démontage du composant
  if (map) {
    map.remove();
    map = null;
  }
});

// Exposer des méthodes pour manipuler la carte
defineExpose({
  flyTo: (lat: number, lng: number, zoom: number = 15) => {
    if (map) {
      map.flyTo([lat, lng], zoom);
    }
  },
  addMarker: (lat: number, lng: number, popupText: string) => {
    if (map) {
      const marker = L.marker([lat, lng]).addTo(map);
      marker.bindPopup(popupText);
      return marker;
    }
  },
  getMap: () => map,
  getProblems: () => problems.value,
  reloadProblems: (filterByUser: boolean = false) => loadProblems(filterByUser),
});
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  position: relative;
}

#map {
  width: 100%;
  height: 100%;
  min-height: 400px;
}

/* Légende compacte */
.map-legend {
  position: absolute;
  bottom: 20px;
  left: 8px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.2s ease;
}

.legend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #374151;
  background: #F9FAFB;
}

.legend-header i {
  font-size: 10px;
  color: #9CA3AF;
}

.legend-content {
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.legend-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.legend-title {
  font-size: 9px;
  font-weight: 600;
  color: #9CA3AF;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.legend-divider {
  height: 1px;
  background: #E5E7EB;
  margin: 4px 0;
}

.legend-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #6B7280;
}

.legend-row span:not(.dot):not(.icon-flag):not(.icon-teardrop) {
  margin-right: 8px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Icône drapeau pour signalements */
.icon-flag {
  width: 14px;
  height: 16px;
  position: relative;
  flex-shrink: 0;
}
.icon-flag::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 0;
  width: 2px;
  height: 100%;
  background: #555;
  border-radius: 1px;
}
.icon-flag::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 10px;
  height: 8px;
  clip-path: polygon(0 0, 100% 0, 75% 50%, 100% 100%, 0 100%);
}
.icon-flag.blue::after { background: #4285F4; }
.icon-flag.violet::after { background: #A142F4; }

/* Icône teardrop pour problèmes */
.icon-teardrop {
  width: 12px;
  height: 16px;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  transform: rotate(180deg);
  flex-shrink: 0;
  border: 1.5px solid white;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
.icon-teardrop.violet { background: #A142F4; }

.dot.blue { background: #4285F4; }
.dot.violet { background: #A142F4; }
.dot.orange { background: #FBBC04; }
.dot.green { background: #34A853; }
.dot.red { background: #EA4335; }
</style>
