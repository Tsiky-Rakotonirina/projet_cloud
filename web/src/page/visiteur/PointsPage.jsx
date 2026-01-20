import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@components/Navbar';
import { colors } from '@assets/colors';
import { Map, Layers, ZoomIn, ZoomOut, Locate, Info, X } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';

const PointsPage = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  // Coordonnées Antananarivo
  const ANTANANARIVO = {
    lng: 47.5079,
    lat: -18.8792,
    zoom: 12
  };

  // URL du TileServer
  const TILESERVER_URL = 'http://localhost:3001';

  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'raster-tiles': {
            type: 'raster',
            tiles: [`${TILESERVER_URL}/styles/basic/{z}/{x}/{y}.png`],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'raster-layer',
            type: 'raster',
            source: 'raster-tiles',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: [ANTANANARIVO.lng, ANTANANARIVO.lat],
      zoom: ANTANANARIVO.zoom,
      maxZoom: 18,
      minZoom: 5
    });

    map.current.on('load', () => {
      setMapLoaded(true);
      
      // Ajouter les contrôles de navigation
      map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');
      map.current.addControl(new maplibregl.ScaleControl(), 'bottom-left');

      // Exemple de points (à remplacer par vos données)
      const demoPoints = [
        { id: 1, lng: 47.5161, lat: -18.8883, name: 'Route RN7 - Km 5', status: 'en_cours' },
        { id: 2, lng: 47.5250, lat: -18.8750, name: 'Carrefour Analakely', status: 'planifie' },
        { id: 3, lng: 47.4950, lat: -18.8950, name: 'Boulevard de l\'Indépendance', status: 'termine' },
        { id: 4, lng: 47.5350, lat: -18.8650, name: 'Route vers Ivato', status: 'en_cours' },
      ];

      // Ajouter les marqueurs
      demoPoints.forEach(point => {
        const markerColor = point.status === 'termine' ? '#10B981' : 
                           point.status === 'en_cours' ? '#F59E0B' : colors.primary;
        
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.cssText = `
          width: 32px;
          height: 32px;
          background-color: ${markerColor};
          border: 3px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transition: transform 0.2s;
        `;
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.2)';
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
        });
        el.addEventListener('click', () => {
          setSelectedPoint(point);
        });

        new maplibregl.Marker({ element: el })
          .setLngLat([point.lng, point.lat])
          .addTo(map.current);
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const handleZoomIn = () => {
    if (map.current) map.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (map.current) map.current.zoomOut();
  };

  const handleLocate = () => {
    if (map.current) {
      map.current.flyTo({
        center: [ANTANANARIVO.lng, ANTANANARIVO.lat],
        zoom: ANTANANARIVO.zoom,
        duration: 1500
      });
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'termine': return '#10B981';
      case 'en_cours': return '#F59E0B';
      default: return colors.primary;
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
      height: '100%',
      minHeight: 'calc(100vh - 120px)'
    },
    controls: {
      position: 'absolute',
      top: '16px',
      left: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      zIndex: 10
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
      zIndex: 10
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
      bottom: '60px',
      left: '16px',
      padding: '16px',
      backgroundColor: colors.dark,
      borderRadius: '12px',
      border: `1px solid ${colors.primary}30`,
      zIndex: 10
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
      zIndex: 10
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
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.darker,
      zIndex: 20
    },
    loadingText: {
      fontSize: '15px',
      color: 'rgba(255,255,255,0.6)'
    }
  };

  return (
    <>
      <Navbar />
      <div style={styles.page}>
        <div style={styles.mapWrapper}>
          <div ref={mapContainer} style={styles.mapContainer} />

          {!mapLoaded && (
            <div style={styles.loadingOverlay}>
              <span style={styles.loadingText}>Chargement de la carte...</span>
            </div>
          )}

          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerIcon}>
              <Map size={20} color={colors.primary} />
            </div>
            <div>
              <h2 style={styles.headerTitle}>Points d'Intérêt</h2>
              <p style={styles.headerSubtitle}>Région Antananarivo</p>
            </div>
          </div>

          {/* Controls */}
          <div style={styles.controls}>
            <button
              style={styles.controlBtn}
              onClick={handleZoomIn}
              onMouseEnter={(e) => e.target.style.borderColor = colors.primary}
              onMouseLeave={(e) => e.target.style.borderColor = `${colors.primary}30`}
            >
              <ZoomIn size={20} />
            </button>
            <button
              style={styles.controlBtn}
              onClick={handleZoomOut}
              onMouseEnter={(e) => e.target.style.borderColor = colors.primary}
              onMouseLeave={(e) => e.target.style.borderColor = `${colors.primary}30`}
            >
              <ZoomOut size={20} />
            </button>
            <button
              style={styles.controlBtn}
              onClick={handleLocate}
              onMouseEnter={(e) => e.target.style.borderColor = colors.primary}
              onMouseLeave={(e) => e.target.style.borderColor = `${colors.primary}30`}
            >
              <Locate size={20} />
            </button>
            <button
              style={styles.controlBtn}
              onClick={() => setShowInfo(!showInfo)}
              onMouseEnter={(e) => e.target.style.borderColor = colors.primary}
              onMouseLeave={(e) => e.target.style.borderColor = `${colors.primary}30`}
            >
              <Layers size={20} />
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

export default PointsPage;
