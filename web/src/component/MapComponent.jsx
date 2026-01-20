import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// URL du serveur de tuiles (localhost:3001 depuis le navigateur)
const TILE_SERVER_URL = import.meta.env.VITE_TILE_SERVER_URL || 'http://localhost:3001';

// Coordonnées Antananarivo
const ANTANANARIVO = {
  lat: -18.8792,
  lng: 47.5079,
  zoom: 13
};

/**
 * Composant Map avec Leaflet
 * Utilise le serveur de tuiles offline local
 */
const MapComponent = ({ 
  center = [ANTANANARIVO.lat, ANTANANARIVO.lng],
  zoom = ANTANANARIVO.zoom,
  markers = [],
  onMapClick = null,
  style = { height: '500px', width: '100%' }
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  useEffect(() => {
    // Initialiser la carte si elle n'existe pas
    if (!mapInstanceRef.current && mapRef.current) {
      // Créer la carte
      mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom);

      // Ajouter le layer de tuiles depuis notre serveur offline
      L.tileLayer(`${TILE_SERVER_URL}/tiles/{z}/{x}/{y}.png`, {
        maxZoom: 19,
        attribution: '© OpenStreetMap | Serveur Offline Antananarivo'
      }).addTo(mapInstanceRef.current);

      // Layer pour les marqueurs
      markersLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);

      // Gestionnaire de clic sur la carte
      if (onMapClick) {
        mapInstanceRef.current.on('click', (e) => {
          onMapClick({
            lat: e.latlng.lat,
            lng: e.latlng.lng
          });
        });
      }
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Mettre à jour les marqueurs quand ils changent
  useEffect(() => {
    if (markersLayerRef.current) {
      // Vider les marqueurs existants
      markersLayerRef.current.clearLayers();

      // Ajouter les nouveaux marqueurs
      markers.forEach((marker) => {
        const leafletMarker = L.marker([marker.lat, marker.lng]);
        
        if (marker.popup) {
          leafletMarker.bindPopup(marker.popup);
        }
        
        if (marker.tooltip) {
          leafletMarker.bindTooltip(marker.tooltip);
        }

        markersLayerRef.current.addLayer(leafletMarker);
      });
    }
  }, [markers]);

  // Mettre à jour le centre quand il change
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  return <div ref={mapRef} style={style} />;
};

export default MapComponent;
