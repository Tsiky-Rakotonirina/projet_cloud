<template>
  <div class="map-container">
    <div id="map" ref="mapContainer"></div>
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
let map: L.Map | null = null;
let problemMarkers: L.Marker[] = [];
const problems = ref<Problem[]>([]);
const signalements = ref<Signalement[]>([]);

// Coordonnées d'Antananarivo
const ANTANANARIVO_CENTER: [number, number] = [-18.8792, 47.5079];
const ANTANANARIVO_CITY_ID = "villeId"; // ID de la ville dans Firestore

// Créer une icône personnalisée pour les problèmes
const createProblemIcon = (isMine: boolean = false) => {
  const color = isMine ? '%234CAF50' : '%23FF6B6B'; // Vert pour mes signalements, rouge pour les autres
  return L.icon({
    iconUrl: `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/%3E%3C/svg%3E`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

// Créer une icône pour les signalements sans problème associé
const createSignalementIcon = () => {
  return L.icon({
    iconUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23FFC107"%3E%3Cpath d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/%3E%3C/svg%3E',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
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
      return `<div style="width: 65px; height: 65px; border-radius: 6px; overflow: hidden; background: #f5f5f5;">
        <img src="${src}" alt="${img.name || 'Image'}" style="width: 100%; height: 100%; object-fit: cover;"/>
      </div>`;
    }).join('');
    
    imagesHtml = `
      <div style="margin: 12px 0;">
        <div style="display: flex; gap: 8px;">${imageThumbs}</div>
        <span style="font-size: 11px; color: #888; margin-top: 6px; display: block;">${sig.images.length} photo(s)</span>
      </div>
    `;
  }

  // Utiliser le statut résolu depuis l'historique
  const statutLibelle = sig.statut?.libelle || 'En attente';
  const statutStyle = getSignalementStatutStyle(statutLibelle);
  
  return `
    <div style="width: 250px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="background: #FFC107; padding: 10px 12px; margin: -10px -10px 12px -10px; border-radius: 4px 4px 0 0;">
        <span style="font-size: 13px; font-weight: 600; color: #333;">Mon Signalement</span>
      </div>
      
      <p style="margin: 0 0 12px 0; font-size: 14px; color: #333; line-height: 1.4;">${sig.description}</p>
      
      ${imagesHtml}
      
      <div style="border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px;">
        <div style="font-size: 12px; color: #666; margin-bottom: 6px;">
          ${new Date(sig.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
        <span style="display: inline-block; background: ${statutStyle.bg}; color: ${statutStyle.color}; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 500;">
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
    let allProblems = await getAllProblems();
    
    // Si on filtre par utilisateur connecté
    if (filterByUser && currentUserId) {
      // Récupérer mes signalements
      const mySignalementsList = await getMySignalements();
      signalements.value = mySignalementsList;
      const mySignalementIds = mySignalementsList.map(s => s.id);
      
      // Filtrer les problèmes liés à mes signalements
      allProblems = allProblems.filter(p => mySignalementIds.includes(p.signalementId));
      
      // Ajouter aussi les signalements qui n'ont pas encore de problème associé
      mySignalementsList.forEach(sig => {
        const hasProblem = allProblems.some(p => p.signalementId === sig.id);
        if (!hasProblem && map) {
          const marker = L.marker([sig.point.lat, sig.point.lng], { 
            icon: createSignalementIcon() 
          }).addTo(map);
          
          const sigStatutLibelle = sig.statut?.libelle || 'En attente';
          const sigStatutStyle = getSignalementStatutStyle(sigStatutLibelle);
          const tooltipContent = `
            <div style="text-align: center;">
              <b style="color: #FFC107;">📍 ${sig.description}</b><br/>
              <span style="color: ${sigStatutStyle.color};">${sigStatutLibelle}</span>
            </div>
          `;
          marker.bindTooltip(tooltipContent, { 
            permanent: false, 
            direction: 'top',
            offset: [0, -20]
          });
          
          const popupContent = createSignalementPopupContent(sig);
          marker.bindPopup(popupContent, { maxWidth: 300 });
          problemMarkers.push(marker);
        }
      });
    }
    
    problems.value = allProblems;
    emit('problemsLoaded', allProblems.length);
    
    // Afficher les marqueurs des problèmes sur la carte
    if (map) {
      allProblems.forEach(problem => {
        if (problem.signalement) {
          const { lat, lng } = problem.signalement.point;
          const isMine = !!(currentUserId && problem.signalement.utilisateurId === currentUserId);
          const marker = L.marker([lat, lng], { icon: createProblemIcon(isMine) }).addTo(map!);
          problemMarkers.push(marker);
          
          // Déterminer la couleur du statut
          const getStatutColor = (libelle: string) => {
            const lower = libelle.toLowerCase();
            if (lower.includes('nouveau') || lower.includes('en cours')) return '#FFA500';
            if (lower.includes('terminé') || lower.includes('résolu')) return '#28A745';
            return '#6C757D';
          };

          const statutLibelle = problem.statut?.libelle || 'Non défini';
          const statutColor = getStatutColor(statutLibelle);
          const pourcentage = problem.statut?.pourcentage || 0;
          
          // Tooltip au survol
          const tooltipContent = `
            <div style="text-align: center;">
              <b style="color: #FF6B6B;">⚠️ ${problem.signalement.description}</b><br/>
              <span style="color: ${statutColor}; font-weight: bold;">
                ${statutLibelle} (${pourcentage}%)
              </span>
            </div>
          `;
          marker.bindTooltip(tooltipContent, { 
            permanent: false, 
            direction: 'top',
            offset: [0, -20]
          });
          
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

  // Ajouter un marqueur sur Antananarivo
  const marker = L.marker(ANTANANARIVO_CENTER).addTo(map);
  marker.bindPopup('<b>Antananarivo</b><br>Capitale de Madagascar').openPopup();

  // Ajouter quelques points d'intérêt
  const poiData = [
    { name: 'Palais de la Reine (Rova)', coords: [-18.9150, 47.5328] as [number, number] },
    { name: 'Avenue de l\'Indépendance', coords: [-18.9090, 47.5212] as [number, number] },
    { name: 'Lac Anosy', coords: [-18.9250, 47.5260] as [number, number] },
    { name: 'Tsimbazaza Zoo', coords: [-18.9282, 47.5270] as [number, number] },
  ];

  poiData.forEach(poi => {
    const poiMarker = L.marker(poi.coords).addTo(map!);
    poiMarker.bindPopup(`<b>${poi.name}</b>`);
  });

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
}

#map {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
</style>
