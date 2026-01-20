import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes Leaflet avec Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Configuration
const TILE_SERVER_URL = import.meta.env.VITE_TILE_SERVER_URL || 'http://localhost:3001';
const ANTANANARIVO_CENTER = [-18.8792, 47.5079];
const DEFAULT_ZOOM = 13;

// Composant pour centrer la carte
function SetViewOnClick({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// Composant Map principal
export default function Map({ 
  center = ANTANANARIVO_CENTER, 
  zoom = DEFAULT_ZOOM, 
  markers = [],
  onMapClick,
  style = { height: '500px', width: '100%' }
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={style}
      scrollWheelZoom={true}
    >
      {/* Tuiles depuis notre serveur offline local */}
      <TileLayer
        url={`${TILE_SERVER_URL}/tiles/{z}/{x}/{y}.png`}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Serveur Offline'
        maxZoom={19}
      />
      
      <SetViewOnClick center={center} zoom={zoom} />
      
      {/* Afficher les marqueurs */}
      {markers.map((marker, index) => (
        <Marker 
          key={marker.id || index} 
          position={[marker.lat, marker.lng]}
        >
          {marker.popup && (
            <Popup>
              <div>
                {marker.title && <strong>{marker.title}</strong>}
                {marker.description && <p>{marker.description}</p>}
              </div>
            </Popup>
          )}
        </Marker>
      ))}
    </MapContainer>
  );
}

// Export de la configuration pour utilisation ailleurs
export const mapConfig = {
  tileServerUrl: TILE_SERVER_URL,
  defaultCenter: ANTANANARIVO_CENTER,
  defaultZoom: DEFAULT_ZOOM
};
