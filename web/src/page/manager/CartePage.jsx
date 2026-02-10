import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import NavbarManager from '@components/NavbarManager';
import { colors } from '@assets/colors';
import { pointVisiteurApi } from '../../api/visiteur/PointVisiteur';
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

// Statuts des problèmes (supporte les deux formats)
const STATUTS = {
  'Non commence': { color: '#EF4444', icon: 'alert', label: 'Non commencé' },
  'En cours': { color: '#F59E0B', icon: 'clock', label: 'En cours' },
  'Termine': { color: '#10B981', icon: 'check', label: 'Terminé' }
};

// Liste des filtres pour le dropdown (format API)
const FILTER_OPTIONS = [
  { key: 'Non commence', color: '#EF4444', label: 'Non commencé' },
  { key: 'En cours', color: '#F59E0B', label: 'En cours' },
  { key: 'Termine', color: '#10B981', label: 'Terminé' }
];

// Créer une icône personnalisée selon le statut
const createStatusIcon = (status) => {
  const config = STATUTS[status] || STATUTS['Non commence'];
  
  // SVG icons pour chaque statut
  const icons = {
    alert: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    clock: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
  };

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 32px;
      height: 32px;
      background-color: ${config.color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 3px 10px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    ">${icons[config.icon]}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const CartePage = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [problemes, setProblemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [error, setError] = useState(null);

  // Charger les problèmes depuis l'API
  useEffect(() => {
    const loadProblemes = async () => {
      try {
        setError(null);
        const data = await pointVisiteurApi.getAllProblemes();
        // Transformer les données pour la carte
        const formattedData = data.map(p => {
          let lat = parseFloat(p.geometry?.coordinates?.[1]) || 0;
          let lng = parseFloat(p.geometry?.coordinates?.[0]) || 0;
          // Antananarivo est dans l'hémisphère sud, forcer la latitude négative
          if (lat > 0) lat = -lat;
          return {
            id: p.id_problemes,
            lat,
            lng,
            description: p.description || 'Problème sans description',
            status: p.statut || 'Non commence',
            pourcentage: parseFloat(p.pourcentage) || 0,
            surface: p.surface,
            budget: p.budget,
            niveau: p.niveau || 1,
            entreprise: p.entreprise,
            signalement_id: p.signalement_id,
            date_creation: p.date_creation
          };
        });
        setProblemes(formattedData);
      } catch (error) {
        console.error('Erreur chargement problèmes:', error);
        setError('Impossible de charger les problèmes depuis le serveur');
        setProblemes([]);
      } finally {
        setLoading(false);
      }
    };

    loadProblemes();
    // Rafraîchir les données toutes les 30 secondes
    const interval = setInterval(loadProblemes, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filtrer les problèmes selon le statut
  const filteredProblemes = filterStatus === 'all' 
    ? problemes 
    : problemes.filter(p => p.status === filterStatus);

  const getStatusConfig = (status) => {
    return STATUTS[status] || STATUTS['non_commence'];
  };

  // Initialiser et mettre à jour la carte
  useEffect(() => {
    if (!mapRef.current) return;

    // Initialiser la carte si pas encore fait
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: false
      }).setView([ANTANANARIVO.lat, ANTANANARIVO.lng], ANTANANARIVO.zoom);

      // Ajouter les tuiles depuis le serveur offline local
      L.tileLayer(`${TILE_SERVER_URL}/tiles/{z}/{x}/{y}.png`, {
        maxZoom: 19,
        attribution: '© OpenStreetMap | Serveur Offline Antananarivo'
      }).addTo(mapInstanceRef.current);
    }

    // Nettoyer les anciens marqueurs
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Ajouter les nouveaux marqueurs
    filteredProblemes.forEach((point) => {
      if (!point.lat || !point.lng) return;

      const marker = L.marker([point.lat, point.lng], {
        icon: createStatusIcon(point.status)
      }).addTo(mapInstanceRef.current);

      // Tooltip au survol avec infos du problème
      const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      };
      
      const tooltipContent = `
        <div style="min-width: 260px; padding: 10px;">
          <div style="font-weight: 600; margin-bottom: 10px; color: #1f2937; font-size: 14px;">${point.description}</div>
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
            <span style="width: 10px; height: 10px; border-radius: 50%; background: ${getStatusConfig(point.status).color};"></span>
            <span style="font-size: 13px; font-weight: 500; color: #374151;">${getStatusConfig(point.status).label} (${point.pourcentage}%)</span>
          </div>
          <div style="display: grid; gap: 4px; margin-top: 8px;">
            <div style="font-size: 12px; color: #6b7280;">📅 Date: ${formatDate(point.date_creation)}</div>
            <div style="font-size: 12px; color: #6b7280;">⚡ Niveau: <strong style="color: #1f2937;">${point.niveau}/10</strong></div>
            ${point.surface ? `<div style="font-size: 12px; color: #6b7280;">📐 Surface: ${point.surface} m²</div>` : ''}
            ${point.budget ? `<div style="font-size: 12px; color: #6b7280;">💰 Budget: ${point.budget.toLocaleString()} Ar</div>` : ''}
            ${point.entreprise ? `<div style="font-size: 12px; color: #6b7280;">🏢 Entreprise: ${point.entreprise}</div>` : ''}
          </div>
          <div style="font-size: 11px; color: #9ca3af; margin-top: 10px; text-align: center; font-style: italic; border-top: 1px solid #e5e7eb; padding-top: 8px;">👆 Cliquer pour plus de détails</div>
        </div>
      `;

      marker.bindTooltip(tooltipContent, {
        permanent: false,
        direction: 'top',
        offset: [0, -16],
        className: 'custom-tooltip'
      });

      marker.on('click', () => {
        setSelectedPoint(point);
      });

      marker.on('mouseover', () => {
        setHoveredPoint(point);
      });

      marker.on('mouseout', () => {
        setHoveredPoint(null);
      });

      markersRef.current.push(marker);
    });

    return () => {
      // Cleanup uniquement des marqueurs, pas de la carte
    };
  }, [filteredProblemes]);

  // Cleanup de la carte au démontage
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleLocate = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([ANTANANARIVO.lat, ANTANANARIVO.lng], ANTANANARIVO.zoom, {
        duration: 1
      });
    }
  };

  const formatBudget = (budget) => {
    if (!budget) return 'Non défini';
    return `${budget.toLocaleString()} Ar`;
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
      backgroundColor: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      cursor: 'pointer',
      color: colors.text,
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
      backgroundColor: colors.surface,
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
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
      color: colors.text,
      margin: 0
    },
    headerSubtitle: {
      fontSize: '12px',
      color: colors.tertiary,
      margin: 0
    },
    filterContainer: {
      position: 'absolute',
      top: '80px',
      left: '16px',
      zIndex: 1000
    },
    filterBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 16px',
      backgroundColor: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      cursor: 'pointer',
      color: colors.text,
      fontSize: '14px',
      transition: 'all 0.2s'
    },
    filterDropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      marginTop: '8px',
      backgroundColor: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      overflow: 'hidden',
      minWidth: '180px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
    },
    filterOption: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '12px 16px',
      cursor: 'pointer',
      color: colors.text,
      fontSize: '14px',
      transition: 'all 0.2s',
      borderBottom: `1px solid ${colors.border}`
    },
    filterOptionActive: {
      backgroundColor: `${colors.primary}20`
    },
    filterDot: {
      width: '10px',
      height: '10px',
      borderRadius: '50%'
    },
    legend: {
      position: 'absolute',
      bottom: '30px',
      left: '16px',
      padding: '16px',
      backgroundColor: colors.surface,
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      zIndex: 1000
    },
    legendTitle: {
      fontSize: '12px',
      fontWeight: '600',
      color: colors.tertiary,
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
    legendIcon: {
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid white'
    },
    legendText: {
      fontSize: '13px',
      color: colors.text
    },
    infoPanel: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      width: '300px',
      backgroundColor: colors.surface,
      borderRadius: '16px',
      border: `1px solid ${colors.border}`,
      overflow: 'hidden',
      zIndex: 1000
    },
    infoPanelHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px',
      borderBottom: `1px solid ${colors.border}`
    },
    infoPanelTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: colors.text,
      margin: 0
    },
    infoPanelClose: {
      display: 'flex',
      padding: '6px',
      backgroundColor: 'transparent',
      border: 'none',
      color: colors.tertiary,
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
      color: colors.tertiary,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '4px'
    },
    infoValue: {
      fontSize: '14px',
      color: colors.text
    },
    statusBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      fontSize: '12px',
      fontWeight: '600',
      borderRadius: '20px'
    },
    progressBar: {
      width: '100%',
      height: '8px',
      backgroundColor: '#E2E8F0',
      borderRadius: '4px',
      overflow: 'hidden',
      marginTop: '8px'
    },
    progressFill: {
      height: '100%',
      borderRadius: '4px',
      transition: 'width 0.3s ease'
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      zIndex: 2000
    },
    loadingSpinner: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    loadingDot: {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
    },
    loadingText: {
      color: colors.text,
      fontSize: '15px',
      fontWeight: '500'
    },
    counter: {
      position: 'absolute',
      bottom: '30px',
      right: '16px',
      padding: '12px 20px',
      backgroundColor: colors.surface,
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      zIndex: 1000,
      color: colors.text,
      fontSize: '14px'
    }
  };

  // Ajouter les styles CSS pour le tooltip personnalisé
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-tooltip {
        background: white !important;
        border: none !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 15px rgba(0,0,0,0.15) !important;
        padding: 0 !important;
      }
      .custom-tooltip::before {
        border-top-color: white !important;
      }
      .leaflet-tooltip-left.custom-tooltip::before {
        border-left-color: white !important;
      }
      .leaflet-tooltip-right.custom-tooltip::before {
        border-right-color: white !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <>
      <NavbarManager />
      <div style={styles.page}>
        <div style={styles.mapWrapper}>
          {/* Container de la carte */}
          <div ref={mapRef} style={styles.mapContainer} />

          {/* Loading overlay */}
          {loading && (
            <div style={styles.loadingOverlay}>
              <style>{`
                @keyframes mapBounce {
                  0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
                  40% { transform: scale(1); opacity: 1; }
                }
              `}</style>
              <div style={styles.loadingSpinner}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      ...styles.loadingDot,
                      animation: `mapBounce 1.4s ease-in-out ${i * 0.16}s infinite`
                    }}
                  />
                ))}
              </div>
              <span style={styles.loadingText}>Chargement de la carte...</span>
            </div>
          )}

          {/* Erreur */}
          {error && !loading && (
            <div style={{
              position: 'absolute',
              top: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(239, 68, 68, 0.95)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '10px',
              zIndex: 2000,
              fontSize: '14px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}>
              {error}
            </div>
          )}

          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerIcon}>
              <i className="fas fa-map" style={{ fontSize: '20px', color: colors.primary }}></i>
            </div>
            <div>
              <h2 style={styles.headerTitle}>Carte des Problèmes routiers</h2>
              <p style={styles.headerSubtitle}>Zone Antananarivo</p>
            </div>
          </div>

          {/* Controls */}
          <div style={styles.controls}>
            <button style={styles.controlBtn} onClick={handleLocate} title="Recentrer">
              <i className="fas fa-crosshairs" style={{ fontSize: '20px' }}></i>
            </button>
          </div>

          {/* Filter Dropdown */}
          <div style={styles.filterContainer}>
            <button 
              style={styles.filterBtn} 
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <i className="fas fa-filter" style={{ fontSize: '18px' }}></i>
              <span>
                {filterStatus === 'all' ? 'Tous les statuts' : getStatusConfig(filterStatus).label}
              </span>
              <i className="fas fa-chevron-down" style={{ fontSize: '16px', transform: showFilterDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}></i>
            </button>

            {showFilterDropdown && (
              <div style={styles.filterDropdown}>
                <div 
                  style={{
                    ...styles.filterOption,
                    ...(filterStatus === 'all' ? styles.filterOptionActive : {})
                  }}
                  onClick={() => { setFilterStatus('all'); setShowFilterDropdown(false); }}
                >
                  <div style={{ ...styles.filterDot, background: 'linear-gradient(135deg, #EF4444, #F59E0B, #10B981)' }} />
                  <span>Tous les statuts</span>
                </div>
                {FILTER_OPTIONS.map(({ key, color, label }, index) => (
                  <div 
                    key={key}
                    style={{
                      ...styles.filterOption,
                      ...(filterStatus === key ? styles.filterOptionActive : {}),
                      borderBottom: index === FILTER_OPTIONS.length - 1 ? 'none' : styles.filterOption.borderBottom
                    }}
                    onClick={() => { setFilterStatus(key); setShowFilterDropdown(false); }}
                  >
                    <div style={{ ...styles.filterDot, backgroundColor: color }} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Legend */}
          <div style={styles.legend}>
            <h4 style={styles.legendTitle}>Légende</h4>
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendIcon, backgroundColor: '#EF4444' }}>
                <i className="fas fa-exclamation-triangle" style={{ fontSize: '12px', color: 'white' }}></i>
              </div>
              <span style={styles.legendText}>Non commencé</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendIcon, backgroundColor: '#F59E0B' }}>
                <i className="fas fa-clock" style={{ fontSize: '12px', color: 'white' }}></i>
              </div>
              <span style={styles.legendText}>En cours</span>
            </div>
            <div style={{ ...styles.legendItem, marginBottom: 0 }}>
              <div style={{ ...styles.legendIcon, backgroundColor: '#10B981' }}>
                <i className="fas fa-check-circle" style={{ fontSize: '12px', color: 'white' }}></i>
              </div>
              <span style={styles.legendText}>Terminé</span>
            </div>
          </div>

          {/* Counter */}
          <div style={styles.counter}>
            <strong>{filteredProblemes.length}</strong> problème{filteredProblemes.length > 1 ? 's' : ''} affiché{filteredProblemes.length > 1 ? 's' : ''}
          </div>

          {/* Selected Point Panel */}
          {selectedPoint && (
            <div style={styles.infoPanel}>
              <div style={styles.infoPanelHeader}>
                <h3 style={styles.infoPanelTitle}>Détails du problème</h3>
                <button
                  style={styles.infoPanelClose}
                  onClick={() => setSelectedPoint(null)}
                >
                  <i className="fas fa-times" style={{ fontSize: '18px' }}></i>
                </button>
              </div>
              <div style={styles.infoPanelBody}>
                <div style={styles.infoRow}>
                  <p style={styles.infoLabel}>Description</p>
                  <p style={styles.infoValue}>{selectedPoint.description}</p>
                </div>
                <div style={styles.infoRow}>
                  <p style={styles.infoLabel}>Coordonnées</p>
                  <p style={styles.infoValue}>
                    {selectedPoint.lat?.toFixed(4)}, {selectedPoint.lng?.toFixed(4)}
                  </p>
                </div>
                <div style={styles.infoRow}>
                  <p style={styles.infoLabel}>Statut</p>
                  <span
                    style={{
                      ...styles.statusBadge,
                      color: getStatusConfig(selectedPoint.status).color,
                      backgroundColor: `${getStatusConfig(selectedPoint.status).color}20`
                    }}
                  >
                    {(selectedPoint.status === 'Non commence' || selectedPoint.status === 'Non commence') && <i className="fas fa-exclamation-triangle" style={{ fontSize: '14px' }}></i>}
                    {(selectedPoint.status === 'En cours' || selectedPoint.status === 'En cours') && <i className="fas fa-clock" style={{ fontSize: '14px' }}></i>}
                    {(selectedPoint.status === 'Termine' || selectedPoint.status === 'Termine') && <i className="fas fa-check-circle" style={{ fontSize: '14px' }}></i>}
                    {getStatusConfig(selectedPoint.status).label}
                  </span>
                  <div style={styles.progressBar}>
                    <div 
                      style={{
                        ...styles.progressFill,
                        width: `${selectedPoint.pourcentage}%`,
                        backgroundColor: getStatusConfig(selectedPoint.status).color
                      }}
                    />
                  </div>
                  <p style={{ fontSize: '12px', color: colors.tertiary, marginTop: '4px' }}>
                    Avancement: {selectedPoint.pourcentage}%
                  </p>
                </div>
                {selectedPoint.surface && (
                  <div style={styles.infoRow}>
                    <p style={styles.infoLabel}>Surface</p>
                    <p style={styles.infoValue}>{selectedPoint.surface} m²</p>
                  </div>
                )}
                {selectedPoint.budget && (
                  <div style={styles.infoRow}>
                    <p style={styles.infoLabel}>Budget</p>
                    <p style={styles.infoValue}>{formatBudget(selectedPoint.budget)}</p>
                  </div>
                )}
                {selectedPoint.entreprise && (
                  <div style={styles.infoRow}>
                    <p style={styles.infoLabel}>Entreprise responsable</p>
                    <p style={styles.infoValue}>{selectedPoint.entreprise}</p>
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

export default CartePage;
