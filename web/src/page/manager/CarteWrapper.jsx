import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import NavbarManager from '@components/NavbarManager';
import { colors } from '@assets/colors';
import { Map as MapIcon, Locate, X } from 'lucide-react';
import { mapApi } from '../../api/map.api';
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

const CarteWrapper = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les points depuis l'API
  useEffect(() => {
    const loadPoints = async () => {
      try {
        const data = await mapApi.getSignalements();
        setPoints(data);
      } catch (error) {
        console.error('Erreur chargement points:', error);
        // Utiliser les données de démo en cas d'erreur
        setPoints([
          { id: 1, lng: 47.5161, lat: -18.8883, name: 'Route RN7 - Km 5', status: 'en_cours' },
          { id: 2, lng: 47.5250, lat: -18.8750, name: 'Carrefour Analakely', status: 'planifie' },
          { id: 3, lng: 47.4950, lat: -18.8950, name: 'Boulevard de l\'Indépendance', status: 'termine' },
          { id: 4, lng: 47.5350, lat: -18.8650, name: 'Route vers Ivato', status: 'en_cours' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadPoints();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'termine': return '#10B981';
      case 'en_cours': return '#F59E0B';
      default: return colors.primary;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'termine': return 'Terminé';
      case 'en_cours': return 'En cours';
      case 'planifie': return 'Planifié';
      default: return status;
    }
  };

  // Initialiser la carte
  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current && points.length > 0) {
      // Créer la carte
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: false
      }).setView([ANTANANARIVO.lat, ANTANANARIVO.lng], ANTANANARIVO.zoom);

      // Ajouter les tuiles depuis le serveur offline local
      L.tileLayer(`${TILE_SERVER_URL}/tiles/{z}/{x}/{y}.png`, {
        maxZoom: 19,
        attribution: '© OpenStreetMap | Serveur Offline Antananarivo'
      }).addTo(mapInstanceRef.current);

      // Ajouter les marqueurs
      points.forEach((point) => {
        const marker = L.marker([point.lat, point.lng], {
          icon: createCustomIcon(getStatusColor(point.status))
        }).addTo(mapInstanceRef.current);

        marker.bindPopup(`<strong>${point.name}</strong><br/>Statut: ${getStatusLabel(point.status)}`);
        
        marker.on('click', () => {
          setSelectedPoint(point);
        });

        markersRef.current.push(marker);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [points]);

  const handleLocate = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([ANTANANARIVO.lat, ANTANANARIVO.lng], ANTANANARIVO.zoom, {
        duration: 1
      });
    }
  };

  const styles = {
    page: {
      minHeight: '100vh',
      backgroundColor: colors.darker,
      paddingTop: '70px',
      display: 'flex',
      flexDirection: 'column'
    },
    mapWrapper: {
      flex: 1,
      position: 'relative',
      margin: '16px',
      borderRadius: '16px',
      overflow: 'hidden',
      border: `1px solid ${colors.primary}20`
    },
    mapContainer: {
      width: '100%',
      height: 'calc(100vh - 120px)'
    },
    controls: {
      position: 'absolute',
      top: '16px',
      left: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      zIndex: 1000
    },
    controlBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '44px',
      height: '44px',
      backgroundColor: colors.dark,
      border: `1px solid ${colors.primary}30`,
      borderRadius: '12px',
      cursor: 'pointer',
      color: 'white',
      transition: 'all 0.2s'
    },
    header: {
      position: 'absolute',
      top: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 24px',
      backgroundColor: colors.dark,
      borderRadius: '12px',
      border: `1px solid ${colors.primary}30`,
      zIndex: 1000
    },
    headerIcon: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '36px',
      height: '36px',
      backgroundColor: `${colors.primary}20`,
      borderRadius: '10px'
    },
    headerTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: 'white',
      margin: 0
    },
    headerSubtitle: {
      fontSize: '12px',
      color: 'rgba(255,255,255,0.6)',
      margin: 0
    },
    legend: {
      position: 'absolute',
      bottom: '30px',
      left: '16px',
      padding: '16px',
      backgroundColor: colors.dark,
      borderRadius: '12px',
      border: `1px solid ${colors.primary}30`,
      zIndex: 1000
    },
    legendTitle: {
      fontSize: '12px',
      fontWeight: '600',
      color: 'rgba(255,255,255,0.6)',
      margin: '0 0 12px 0',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '8px'
    },
    legendDot: {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      border: '2px solid white'
    },
    legendText: {
      fontSize: '13px',
      color: 'rgba(255,255,255,0.85)'
    },
    infoPanel: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      width: '280px',
      backgroundColor: colors.dark,
      borderRadius: '16px',
      border: `1px solid ${colors.primary}30`,
      overflow: 'hidden',
      zIndex: 1000
    },
    infoPanelHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px',
      borderBottom: `1px solid ${colors.primary}15`
    },
    infoPanelTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: 'white',
      margin: 0
    },
    infoPanelClose: {
      display: 'flex',
      padding: '6px',
      backgroundColor: 'transparent',
      border: 'none',
      color: 'rgba(255,255,255,0.5)',
      cursor: 'pointer',
      borderRadius: '6px'
    },
    infoPanelBody: {
      padding: '16px'
    },
    infoRow: {
      marginBottom: '12px'
    },
    infoLabel: {
      fontSize: '11px',
      fontWeight: '600',
      color: 'rgba(255,255,255,0.5)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '4px'
    },
    infoValue: {
      fontSize: '14px',
      color: 'white'
    },
    statusBadge: {
      display: 'inline-flex',
      padding: '6px 12px',
      fontSize: '12px',
      fontWeight: '600',
      borderRadius: '20px'
    }
  };

  return (
    <>
      <NavbarManager />
      <div style={styles.page}>
        <div style={styles.mapWrapper}>
          {/* Container de la carte */}
          <div ref={mapRef} style={styles.mapContainer} />

          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerIcon}>
              <MapIcon size={20} color={colors.primary} />
            </div>
            <div>
              <h2 style={styles.headerTitle}>Points d'Intérêt</h2>
              <p style={styles.headerSubtitle}>Région Antananarivo - Serveur Offline</p>
            </div>
          </div>

          {/* Controls */}
          <div style={styles.controls}>
            <button style={styles.controlBtn} onClick={handleLocate} title="Recentrer">
              <Locate size={20} />
            </button>
          </div>

          {/* Legend */}
          <div style={styles.legend}>
            <h4 style={styles.legendTitle}>Légende</h4>
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

export default CarteWrapper;
