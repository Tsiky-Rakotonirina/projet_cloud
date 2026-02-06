import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import Navbar from '@components/Navbar';
import { colors } from '@assets/colors';
import { Map as MapIcon, Locate, X, Filter, ChevronDown, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
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

// Statuts des problèmes
const STATUTS = {
  'Non commence': { color: '#EF4444', icon: 'alert', label: 'Non commencé' },
  'En cours': { color: '#F59E0B', icon: 'clock', label: 'En cours' },
  'Termine': { color: '#10B981', icon: 'check', label: 'Terminé' }
};

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

const PointsPage = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [problemes, setProblemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Charger les problèmes depuis l'API
  useEffect(() => {
    const loadProblemes = async () => {
      try {
        const data = await pointVisiteurApi.getAllProblemes();
        // Transformer les données pour la carte
        const formattedData = data.map(p => ({
          id: p.id_problemes,
          lat: p.geometry?.coordinates?.[1] || 0,
          lng: p.geometry?.coordinates?.[0] || 0,
          description: p.description || 'Problème sans description',
          status: p.statut || 'Non commence',
          pourcentage: p.pourcentage || 0,
          surface: p.surface,
          budget: p.budget,
          entreprise: p.entreprise
        }));
        setProblemes(formattedData);
      } catch (error) {
        console.error('Erreur chargement problèmes:', error);
        // Données de démo en cas d'erreur
        setProblemes([
          { id: 1, lng: 47.5200, lat: -18.8850, description: 'Nid de poule Avenue Indépendance', status: 'Non commence', pourcentage: 0, surface: 15, budget: 500000, entreprise: 'SORGETRAM' },
          { id: 2, lng: 47.5250, lat: -18.8780, description: 'Fissure chaussée Rue de la Reine', status: 'En cours', pourcentage: 50, surface: 25, budget: 800000, entreprise: 'BTP Madagascar' },
          { id: 3, lng: 47.5150, lat: -18.8900, description: 'Route dégradée Boulevard Ratsimilaho', status: 'Termine', pourcentage: 100, surface: 40, budget: 1200000, entreprise: 'Travaux Publics Plus' },
          { id: 4, lng: 47.5300, lat: -18.8750, description: 'Affaissement chaussée Analakely', status: 'En cours', pourcentage: 50, surface: 20, budget: 600000, entreprise: 'SORGETRAM' },
          { id: 5, lng: 47.5100, lat: -18.8820, description: 'Nid de poule Route Ivato', status: 'Non commence', pourcentage: 0, surface: 10, budget: 300000, entreprise: 'Infrastructure Solutions' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadProblemes();
  }, []);

  // Filtrer les problèmes selon le statut
  const filteredProblemes = filterStatus === 'all' 
    ? problemes 
    : problemes.filter(p => p.status === filterStatus);

  const getStatusConfig = (status) => {
    return STATUTS[status] || STATUTS['Non commence'];
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
      const tooltipContent = `
        <div style="min-width: 220px; padding: 8px;">
          <div style="font-weight: 600; margin-bottom: 8px; color: #1f2937;">${point.description}</div>
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${getStatusConfig(point.status).color};"></span>
            <span style="font-size: 12px; color: #6b7280;">${getStatusConfig(point.status).label} (${point.pourcentage}%)</span>
          </div>
          ${point.surface ? `<div style="font-size: 12px; color: #6b7280;">📐 Surface: ${point.surface} m²</div>` : ''}
          ${point.budget ? `<div style="font-size: 12px; color: #6b7280;">💰 Budget: ${point.budget.toLocaleString()} Ar</div>` : ''}
          ${point.entreprise ? `<div style="font-size: 12px; color: #6b7280;">🏢 Entreprise: ${point.entreprise}</div>` : ''}
          <div style="font-size: 11px; color: #9ca3af; margin-top: 8px; text-align: center; font-style: italic; border-top: 1px solid #e5e7eb; padding-top: 6px;">👆 Cliquer pour plus de détails</div>
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
      backgroundColor: colors.dark,
      border: `1px solid ${colors.primary}30`,
      borderRadius: '12px',
      cursor: 'pointer',
      color: 'white',
      fontSize: '14px',
      transition: 'all 0.2s'
    },
    filterDropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      marginTop: '8px',
      backgroundColor: colors.dark,
      border: `1px solid ${colors.primary}30`,
      borderRadius: '12px',
      overflow: 'hidden',
      minWidth: '180px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
    },
    filterOption: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '12px 16px',
      cursor: 'pointer',
      color: 'white',
      fontSize: '14px',
      transition: 'all 0.2s',
      borderBottom: `1px solid ${colors.primary}10`
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
      color: 'rgba(255,255,255,0.85)'
    },
    infoPanel: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      width: '300px',
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
      backgroundColor: 'rgba(255,255,255,0.1)',
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
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    },
    loadingText: {
      color: 'white',
      fontSize: '16px'
    },
    counter: {
      position: 'absolute',
      bottom: '30px',
      right: '16px',
      padding: '12px 20px',
      backgroundColor: colors.dark,
      borderRadius: '12px',
      border: `1px solid ${colors.primary}30`,
      zIndex: 1000,
      color: 'white',
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
      <Navbar />
      <div style={styles.page}>
        <div style={styles.mapWrapper}>
          {/* Container de la carte */}
          <div ref={mapRef} style={styles.mapContainer} />

          {/* Loading overlay */}
          {loading && (
            <div style={styles.loadingOverlay}>
              <span style={styles.loadingText}>Chargement des problèmes...</span>
            </div>
          )}

          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerIcon}>
              <MapIcon size={20} color={colors.primary} />
            </div>
            <div>
              <h2 style={styles.headerTitle}>Carte des Problèmes routiers</h2>
              <p style={styles.headerSubtitle}>Zone Antananarivo</p>
            </div>
          </div>

          {/* Controls */}
          <div style={styles.controls}>
            <button style={styles.controlBtn} onClick={handleLocate} title="Recentrer">
              <Locate size={20} />
            </button>
          </div>

          {/* Filter Dropdown */}
          <div style={styles.filterContainer}>
            <button 
              style={styles.filterBtn} 
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <Filter size={18} />
              <span>
                {filterStatus === 'all' ? 'Tous les statuts' : getStatusConfig(filterStatus).label}
              </span>
              <ChevronDown size={16} style={{ transform: showFilterDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
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
                {Object.entries(STATUTS).map(([key, value]) => (
                  <div 
                    key={key}
                    style={{
                      ...styles.filterOption,
                      ...(filterStatus === key ? styles.filterOptionActive : {}),
                      borderBottom: key === 'Termine' ? 'none' : styles.filterOption.borderBottom
                    }}
                    onClick={() => { setFilterStatus(key); setShowFilterDropdown(false); }}
                  >
                    <div style={{ ...styles.filterDot, backgroundColor: value.color }} />
                    <span>{value.label}</span>
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
                <AlertTriangle size={12} color="white" />
              </div>
              <span style={styles.legendText}>Non commencé</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendIcon, backgroundColor: '#F59E0B' }}>
                <Clock size={12} color="white" />
              </div>
              <span style={styles.legendText}>En cours</span>
            </div>
            <div style={{ ...styles.legendItem, marginBottom: 0 }}>
              <div style={{ ...styles.legendIcon, backgroundColor: '#10B981' }}>
                <CheckCircle size={12} color="white" />
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
                  <X size={18} />
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
                    {selectedPoint.status === 'Non commence' && <AlertTriangle size={14} />}
                    {selectedPoint.status === 'En cours' && <Clock size={14} />}
                    {selectedPoint.status === 'Termine' && <CheckCircle size={14} />}
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
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
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
                    <p style={styles.infoLabel}>🏢 Entreprise responsable</p>
                    <p style={{ ...styles.infoValue, fontWeight: '600', color: colors.primary }}>{selectedPoint.entreprise}</p>
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
