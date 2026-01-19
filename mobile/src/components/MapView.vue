<template>
  <div class="map-container">
    <div id="map" ref="mapContainer"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getAllProblems, getMySignalements } from '@/services/problemService';
import type { Problem, Signalement } from '@/services/problemService';
import { auth } from '@/firebase';

const props = defineProps<{
  filterMine?: boolean;
}>();

const emit = defineEmits(['problemsLoaded']);

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
          
          const tooltipContent = `
            <div style="text-align: center;">
              <b style="color: #FFC107;">📍 ${sig.description}</b><br/>
              <span style="color: #6c757d;">En attente de traitement</span>
            </div>
          `;
          marker.bindTooltip(tooltipContent, { 
            permanent: false, 
            direction: 'top',
            offset: [0, -20]
          });
          
          const popupContent = `
            <div style="max-width: 200px;">
              <b style="color: #FFC107;">📍 Mon Signalement</b><br/>
              <p style="margin: 5px 0;">${sig.description}</p>
              <small style="color: #6c757d;">
                Signalé le ${new Date(sig.createdAt).toLocaleDateString('fr-FR')}<br/>
                <em>En attente de prise en charge</em>
              </small>
            </div>
          `;
          marker.bindPopup(popupContent);
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
          const isMine = currentUserId && problem.signalement.utilisateurId === currentUserId;
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
          
          // Popup complet au clic
          const popupContent = `
            <div style="max-width: 250px; font-family: Arial, sans-serif;">
              <div style="background: #FF6B6B; color: white; padding: 8px; margin: -10px -10px 10px -10px; border-radius: 4px 4px 0 0;">
                <b style="font-size: 14px;">⚠️ Problème Routier</b>
              </div>
              
              <div style="margin-bottom: 8px;">
                <p style="margin: 0; font-size: 13px; color: #333;">${problem.signalement.description}</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <b style="font-size: 12px;">Statut:</b>
                  <span style="background: ${statutColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">
                    ${statutLibelle}
                  </span>
                </div>
                <div style="margin-top: 4px;">
                  <div style="background: #e9ecef; border-radius: 10px; height: 6px; overflow: hidden;">
                    <div style="background: ${statutColor}; height: 100%; width: ${pourcentage}%;"></div>
                  </div>
                  <small style="color: #6c757d;">${pourcentage}% complété</small>
                </div>
              </div>
              
              <div style="font-size: 12px; line-height: 1.6;">
                <div style="margin-bottom: 4px;">
                  <b>📅 Date:</b> ${new Date(problem.signalement.createdAt).toLocaleDateString('fr-FR', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </div>
                <div style="margin-bottom: 4px;">
                  <b>📐 Surface:</b> <span style="color: #007bff;">${problem.surface} m²</span>
                </div>
                <div style="margin-bottom: 4px;">
                  <b>💰 Budget:</b> <span style="color: #28a745; font-weight: bold;">${problem.budget.toLocaleString('fr-FR')} Ar</span>
                </div>
                ${problem.entreprise ? `
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #dee2e6;">
                    <b>🏢 Entreprise:</b> ${problem.entreprise.nom}<br/>
                    <small style="color: #6c757d;">📍 ${problem.entreprise.adresse}</small><br/>
                    <small style="color: #6c757d;">📞 ${problem.entreprise.telephone}</small>
                  </div>
                ` : ''}
              </div>
            </div>
          `;
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

  // Ajouter le layer de tuiles OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

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
