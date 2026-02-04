import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import Navbar from '@components/Navbar';
import { colors } from '@assets/colors';
import { Map as MapIcon, Locate, X, Image as ImageIcon } from 'lucide-react';
import { mapApi } from '@api/map.api';
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

// Créer le contenu HTML du popup avec images
const createPopupContent = (point, getStatusColor, getStatusLabel) => {
  let imagesHtml = '';
  if (point.images && point.images.length > 0) {
    const imageThumbs = point.images.slice(0, 3).map(img => 
      `<div style="width: 50px; height: 50px; border-radius: 6px; overflow: hidden; border: 2px solid #dee2e6;">
        <img src="${img.url}" alt="${img.name || 'Image'}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'"/>
      </div>`
    ).join('');
    
    imagesHtml = `
      <div style="margin: 10px 0;">
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">${imageThumbs}</div>
        <small style="color: #6c757d; font-size: 10px;">${point.images.length} photo(s)</small>
      </div>
    `;
  }

  const statusColor = getStatusColor(point.status);
  
  return `
    <div style="max-width: 260px; font-family: Arial, sans-serif;">
      <div style="background: ${statusColor}; color: white; padding: 8px; margin: -10px -10px 10px -10px; border-radius: 4px 4px 0 0;">
        <b style="font-size: 14px;">📍 Signalement</b>
      </div>
      <p style="margin: 0 0 8px 0; font-size: 13px; color: #333;">${point.name}</p>
      ${imagesHtml}
      <div style="background: #f8f9fa; padding: 8px; border-radius: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <b style="font-size: 12px;">Statut:</b>
          <span style="background: ${statusColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">
            ${getStatusLabel(point.status)}
          </span>
        </div>
        ${point.date ? `<small style="color: #6c757d;">📅 ${new Date(point.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</small>` : ''}
        ${point.email ? `<br/><small style="color: #6c757d;">👤 ${point.email}</small>` : ''}
      </div>
    </div>
  `;
};

const PointsPage = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [signalements, setSignalements] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Charger les signalements depuis l'API
  useEffect(() => {
    const loadSignalements = async () => {
      try {
        setLoading(true);
        const data = await mapApi.getSignalements();
        console.log('Signalements chargés:', data);
        setSignalements(data);
      } catch (error) {
        console.error('Erreur chargement signalements:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSignalements();
  }, []);

  // Initialiser la carte et ajouter les marqueurs
  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      // Créer la carte
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: false
      }).setView([ANTANANARIVO.lat, ANTANANARIVO.lng], ANTANANARIVO.zoom);

      // Ajouter les tuiles depuis le serveur offline local
      L.tileLayer(`${TILE_SERVER_URL}/tiles/{z}/{x}/{y}.png`, {
        maxZoom: 19,
        attribution: '© OpenStreetMap | Serveur Offline Antananarivo'
      }).addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Mettre à jour les marqueurs quand les signalements changent
  useEffect(() => {
    if (!mapInstanceRef.current || signalements.length === 0) return;

    // Supprimer les anciens marqueurs
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Ajouter les nouveaux marqueurs
    signalements.forEach((point) => {
      if (point.lat && point.lng) {
        const marker = L.marker([point.lat, point.lng], {
          icon: createCustomIcon(getStatusColor(point.status))
        }).addTo(mapInstanceRef.current);

        // Créer un popup riche avec images
        const popupContent = createPopupContent(point, getStatusColor, getStatusLabel);
        marker.bindPopup(popupContent, { maxWidth: 300 });
        
        marker.on('click', () => {
          setSelectedPoint(point);
        });

        markersRef.current.push(marker);
      }
    });

    console.log(`${markersRef.current.length} marqueurs ajoutés sur la carte`);
  }, [signalements]);

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
      <Navbar />
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
              <h2 style={styles.headerTitle}>Signalements Routiers</h2>
              <p style={styles.headerSubtitle}>
                {loading ? 'Chargement...' : `${signalements.length} signalement(s) - Région Antananarivo`}
              </p>
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
                  <p style={styles.infoLabel}>Description</p>
                  <p style={styles.infoValue}>{selectedPoint.name}</p>
                </div>
                {selectedPoint.images && selectedPoint.images.length > 0 && (
                  <div style={styles.infoRow}>
                    <p style={styles.infoLabel}>Photos</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {selectedPoint.images.slice(0, 3).map((img, idx) => (
                        <div key={idx} style={{ 
                          width: '70px', 
                          height: '70px', 
                          borderRadius: '8px', 
                          overflow: 'hidden',
                          border: `2px solid ${colors.primary}30`
                        }}>
                          <img 
                            src={img.url} 
                            alt={img.name || `Image ${idx + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        </div>
                      ))}
                    </div>
                    <small style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
                      {selectedPoint.images.length} photo(s)
                    </small>
                  </div>
                )}
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
                {selectedPoint.email && (
                  <div style={styles.infoRow}>
                    <p style={styles.infoLabel}>Signalé par</p>
                    <p style={styles.infoValue}>{selectedPoint.email}</p>
                  </div>
                )}
                {selectedPoint.date && (
                  <div style={styles.infoRow}>
                    <p style={styles.infoLabel}>Date</p>
                    <p style={styles.infoValue}>
                      {new Date(selectedPoint.date).toLocaleDateString('fr-FR', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PointsPage;
