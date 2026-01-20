import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import NavbarManager from '@components/NavbarManager';
import { colors } from '@assets/colors';
import { Map as MapIcon, Locate, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// URL du serveur de tuiles offline
const TILE_SERVER_URL = import.meta.env.VITE_TILE_SERVER_URL || 'http://localhost:3001';

// Coordonnées Antananarivo
const ANTANANARIVO = {
  lat: -18.8792,
  lng: 47.5079,
  zoom: 13
};

// Créer une icône personnalisée
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 24px;
      height: 24px;
      background-color: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 3px 10px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const CarteManager = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [selectedPoint, setSelectedPoint] = useState(null);

  // Points de démo
  const demoPoints = [
    { id: 1, name: 'Route Nationale 1', lat: -18.8792, lng: 47.5179, status: 'planned' },
    { id: 2, name: 'Avenue de l\'Indépendance', lat: -18.8892, lng: 47.5079, status: 'in_progress' },
    { id: 3, name: 'Boulevard Ratsimilaho', lat: -18.8692, lng: 47.5279, status: 'completed' },
    { id: 4, name: 'Rue Rainibetsimisaraka', lat: -18.8792, lng: 47.4979, status: 'planned' },
    { id: 5, name: 'Avenue du 26 Juin', lat: -18.8992, lng: 47.5179, status: 'in_progress' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'planned': return colors.primary;
      case 'in_progress': return '#F59E0B';
      case 'completed': return '#10B981';
      default: return colors.primary;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'planned': return 'Planifié';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminé';
      default: return status;
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialiser la carte
    const map = L.map(mapRef.current, {
      center: [ANTANANARIVO.lat, ANTANANARIVO.lng],
      zoom: ANTANANARIVO.zoom,
      zoomControl: true,
    });

    // Ajouter la couche de tuiles offline
    L.tileLayer(`${TILE_SERVER_URL}/styles/basic-preview/{z}/{x}/{y}.png`, {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Ajouter les marqueurs
    demoPoints.forEach(point => {
      const marker = L.marker([point.lat, point.lng], {
        icon: createCustomIcon(getStatusColor(point.status))
      }).addTo(map);

      marker.on('click', () => {
        setSelectedPoint(point);
      });

      markersRef.current.push(marker);
    });

    // Cleanup
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      map.remove();
    };
  }, []);

  const handleLocate = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([ANTANANARIVO.lat, ANTANANARIVO.lng], ANTANANARIVO.zoom);
    }
  };

  const styles = {
    page: {
      position: 'relative',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: colors.darker
    },
    mapContainer: {
      position: 'absolute',
      top: '70px',
      left: 0,
      right: 0,
      bottom: 0
    },
    map: {
      width: '100%',
      height: '100%'
    },
    controls: {
      position: 'absolute',
      top: '90px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    locateBtn: {
      width: '48px',
      height: '48px',
      backgroundColor: 'white',
      border: 'none',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
      color: colors.primary
    },
    legend: {
      position: 'absolute',
      bottom: '30px',
      left: '20px',
      zIndex: 1000,
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      minWidth: '180px'
    },
    legendTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: colors.dark,
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '8px'
    },
    legendDot: {
      width: '14px',
      height: '14px',
      borderRadius: '50%',
      border: '2px solid white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    },
    legendText: {
      fontSize: '13px',
      color: colors.textSecondary
    },
    infoPanel: {
      position: 'absolute',
      top: '90px',
      left: '20px',
      zIndex: 1000,
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      maxWidth: '320px',
      width: '100%'
    },
    infoPanelHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px'
    },
    infoPanelTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: colors.dark,
      margin: 0
    },
    infoPanelClose: {
      width: '32px',
      height: '32px',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.textSecondary,
      transition: 'all 0.2s'
    },
    infoPanelBody: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    infoRow: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    },
    infoLabel: {
      fontSize: '12px',
      color: colors.textSecondary,
      margin: 0,
      fontWeight: '500'
    },
    infoValue: {
      fontSize: '14px',
      color: colors.dark,
      margin: 0,
      fontWeight: '500'
    },
    statusBadge: {
      display: 'inline-block',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600'
    }
  };

  return (
    <>
      <NavbarManager />
      <div style={styles.page}>
        <div style={styles.mapContainer}>
          <div ref={mapRef} style={styles.map} />

          {/* Controls */}
          <div style={styles.controls}>
            <button
              style={styles.locateBtn}
              onClick={handleLocate}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = colors.primary;
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.color = colors.primary;
              }}
            >
              <Locate size={20} />
            </button>
          </div>

          {/* Legend */}
          <div style={styles.legend}>
            <div style={styles.legendTitle}>
              <MapIcon size={16} />
              Statuts
            </div>
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendDot, backgroundColor: colors.primary }} />
              <span style={styles.legendText}>Planifié</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendDot, backgroundColor: '#F59E0B' }} />
              <span style={styles.legendText}>En cours</span>
            </div>
            <div style={{ ...styles.legendItem, marginBottom: 0 }}>
              <div style={{ ...styles.legendDot, backgroundColor: '#10B981' }} />
              <span style={styles.legendText}>Terminé</span>
            </div>
          </div>

          {/* Selected Point Panel */}
          {selectedPoint && (
            <div style={styles.infoPanel}>
              <div style={styles.infoPanelHeader}>
                <h3 style={styles.infoPanelTitle}>Détails du point</h3>
                <button
                  style={styles.infoPanelClose}
                  onClick={() => setSelectedPoint(null)}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = `${colors.danger}15`;
                    e.target.style.color = colors.danger;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = colors.textSecondary;
                  }}
                >
                  <X size={18} />
                </button>
              </div>
              <div style={styles.infoPanelBody}>
                <div style={styles.infoRow}>
                  <p style={styles.infoLabel}>Nom</p>
                  <p style={styles.infoValue}>{selectedPoint.name}</p>
                </div>
                <div style={styles.infoRow}>
                  <p style={styles.infoLabel}>Coordonnées</p>
                  <p style={styles.infoValue}>
                    {selectedPoint.lat.toFixed(4)}, {selectedPoint.lng.toFixed(4)}
                  </p>
                </div>
                <div style={styles.infoRow}>
                  <p style={styles.infoLabel}>Statut</p>
                  <span
                    style={{
                      ...styles.statusBadge,
                      color: getStatusColor(selectedPoint.status),
                      backgroundColor: `${getStatusColor(selectedPoint.status)}20`
                    }}
                  >
                    {getStatusLabel(selectedPoint.status)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CarteManager;
