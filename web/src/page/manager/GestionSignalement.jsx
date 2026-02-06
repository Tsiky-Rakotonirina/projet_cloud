import React, { useState, useEffect } from 'react';
import NavbarManager from '@components/NavbarManager';
import ImageModal from '@components/ImageModal';
import { colors } from '@assets/colors';
import signalementApi from '@api/manager/Signalement';
import problemeApi from '@api/manager/Probleme';
import { 
  Flag, Check, X, MapPin, Edit3, ArrowUpCircle, 
  Search, RefreshCw, Building, ChevronDown, CheckCircle, Image,
  ArrowRight, History, BarChart3, Clock, TrendingUp, Users 
} from 'lucide-react';

const GestionSignalement = () => {
  const [signalements, setSignalements] = useState([]);
  const [signalementsEnCours, setSignalementsEnCours] = useState([]);
  const [signalementsResolus, setSignalementsResolus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Nouveau');
  const [showModal, setShowModal] = useState(false);
  const [selectedSignalement, setSelectedSignalement] = useState(null);
  const [entreprises, setEntreprises] = useState([]);
  const [modalData, setModalData] = useState({
    entreprise_id: '',
    budget: '',
    surface: ''
  });
  // État pour le modal d'images
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedSignalementId, setSelectedSignalementId] = useState(null);
  const [loadingImages, setLoadingImages] = useState(false);
  // États pour les tooltips d'historique
  const [hoveredSignalement, setHoveredSignalement] = useState(null);
  const [hoveredProbleme, setHoveredProbleme] = useState(null);
  const [signalementHistorique, setSignalementHistorique] = useState([]);
  const [problemeHistorique, setProblemeHistorique] = useState([]);
  const [loadingHistorique, setLoadingHistorique] = useState(false);

  useEffect(() => {
    loadData();
    loadEntreprises();
  }, []);

  const loadEntreprises = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/entreprise');
      const data = await response.json();
      setEntreprises(data.data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des entreprises:', err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [nouveaux, enCours, resolus] = await Promise.all([
        signalementApi.getNouveaux(),
        signalementApi.getEnCours(),
        signalementApi.getResolus()
      ]);
      setSignalements(nouveaux || []);
      setSignalementsEnCours(enCours || []);
      setSignalementsResolus(resolus || []);
    } catch (err) {
      console.error('Erreur lors du chargement des signalements:', err);
      setSignalements([]);
      setSignalementsEnCours([]);
      setSignalementsResolus([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprouver = async (id) => {
    try {
      // Changer le statut à "en_cours" (statut_id 2) - utilisateur admin id 1
      await signalementApi.changeStatus(id, 2, 1);
      await loadData();
    } catch (err) {
      console.error('Erreur lors de l\'approbation:', err);
      alert('Erreur lors de l\'approbation du signalement');
    }
  };

  const handleRefuser = async (id) => {
    try {
      // Changer le statut à "rejete" (statut_id 4) - utilisateur admin id 1
      await signalementApi.changeStatus(id, 4, 1);
      await loadData();
    } catch (err) {
      console.error('Erreur lors du refus:', err);
      alert('Erreur lors du refus du signalement');
    }
  };

  const handleMettreInfos = (signalement) => {
    setSelectedSignalement(signalement);
    setModalData({ entreprise_id: '', budget: '', surface: '' });
    setShowModal(true);
  };

  const handleSubmitInfos = async () => {
    try {
      // Créer un problème pour le signalement
      const response = await fetch('http://localhost:3000/api/probleme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surface: parseFloat(modalData.surface),
          budget: parseFloat(modalData.budget),
          entreprise_id: parseInt(modalData.entreprise_id),
          signalement_id: selectedSignalement.id_signalements,
          probleme_statut_id: 1 // Statut par défaut: non_commence (0%)
        })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la création du problème');
      }
      
      // Automatiquement résoudre le signalement après ajout des infos
      await signalementApi.changeStatus(selectedSignalement.id_signalements, 3, 1);
      
      await loadData();
      setShowModal(false);
      setSelectedSignalement(null);
      alert('Problème créé et signalement résolu avec succès!');
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      alert('Erreur lors de la mise à jour des informations: ' + err.message);
    }
  };

  // Avancer le problème au statut suivant
  const handleAvancerProbleme = async (signalement) => {
    try {
      const problemeId = signalement.probleme_id;
      
      if (!problemeId) {
        alert('Aucun problème lié à ce signalement');
        return;
      }
      
      await problemeApi.avancer(problemeId);
      await loadData();
    } catch (err) {
      console.error('Erreur lors de l\'avancement du problème:', err);
      alert('Erreur: ' + err.message);
    }
  };

  // Charger l'historique d'un signalement
  const loadSignalementHistorique = async (signalementId) => {
    try {
      setLoadingHistorique(true);
      const data = await signalementApi.getHistorique(signalementId);
      setSignalementHistorique(data || []);
    } catch (err) {
      console.error('Erreur chargement historique signalement:', err);
      setSignalementHistorique([]);
    } finally {
      setLoadingHistorique(false);
    }
  };

  // Charger l'historique d'un problème
  const loadProblemeHistorique = async (problemeId) => {
    try {
      setLoadingHistorique(true);
      const data = await problemeApi.getHistorique(problemeId);
      setProblemeHistorique(data || []);
    } catch (err) {
      console.error('Erreur chargement historique problème:', err);
      setProblemeHistorique([]);
    } finally {
      setLoadingHistorique(false);
    }
  };

  // Formatter l'ID du signalement
  const formatSignalementId = (id) => {
    return `SIG${String(id).padStart(3, '0')}`;
  };

  const handleUpgrade = async (id) => {
    try {
      // Changer le statut à "en_cours" (statut_id 2) - utilisateur admin id 1
      await signalementApi.changeStatus(id, 2, 1);
      await loadData();
    } catch (err) {
      console.error('Erreur lors de l\'upgrade:', err);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const handleResoudre = async (id) => {
    try {
      // Changer le statut à "resolu" (statut_id 3) - utilisateur admin id 1
      await signalementApi.changeStatus(id, 3, 1);
      await loadData();
    } catch (err) {
      console.error('Erreur lors de la résolution:', err);
      alert('Erreur lors de la résolution du signalement');
    }
  };

  const handleVoirImages = async (signalementId) => {
    try {
      setLoadingImages(true);
      setSelectedSignalementId(signalementId);
      const images = await signalementApi.getImages(signalementId);
      setSelectedImages(images);
      setShowImageModal(true);
    } catch (err) {
      console.error('Erreur lors du chargement des images:', err);
      alert('Erreur lors du chargement des images');
    } finally {
      setLoadingImages(false);
    }
  };

  const formatCoords = (point) => {
    if (!point) return 'N/A';
    return `${point.lat?.toFixed(4)}, ${point.lng?.toFixed(4)}`;
  };

  const formatBudget = (budget) => {
    if (!budget) return 'N/A';
    return new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA' }).format(budget);
  };

  const getStatutStyle = (statut) => {
    const base = {
      padding: '6px 12px',
      fontSize: '12px',
      fontWeight: '600',
      borderRadius: '20px',
      textTransform: 'capitalize'
    };
    switch (statut) {
      case 'Nouveau':
        return { ...base, color: colors.primary, backgroundColor: `${colors.primary}20` };
      case 'En cours':
        return { ...base, color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.2)' };
      case 'Resolu':
        return { ...base, color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.2)' };
      default:
        return { ...base, color: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.1)' };
    }
  };

  // Style pour l'avancement du problème (0%, 50%, 100%)
  const getProgressStyle = (pourcentage) => {
    if (pourcentage >= 100) {
      return { color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.2)' };
    } else if (pourcentage >= 50) {
      return { color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.2)' };
    } else {
      return { color: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.2)' };
    }
  };

  const styles = {
    page: {
      minHeight: '100vh',
      backgroundColor: colors.darker,
      paddingTop: '80px'
    },
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '40px 24px'
    },
    header: {
      marginBottom: '32px'
    },
    titleRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '8px'
    },
    titleIcon: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '48px',
      height: '48px',
      backgroundColor: `${colors.secondary}20`,
      borderRadius: '12px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: 'white',
      margin: 0
    },
    subtitle: {
      fontSize: '15px',
      color: 'rgba(255,255,255,0.6)',
      margin: 0,
      marginLeft: '64px'
    },
    tabs: {
      display: 'flex',
      gap: '8px',
      marginBottom: '24px',
      backgroundColor: colors.dark,
      padding: '6px',
      borderRadius: '12px',
      width: 'fit-content'
    },
    tab: {
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: '500',
      fontFamily: 'inherit',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    tabActive: {
      color: colors.darker,
      backgroundColor: colors.primary
    },
    tabInactive: {
      color: 'rgba(255,255,255,0.6)',
      backgroundColor: 'transparent'
    },
    card: {
      backgroundColor: colors.dark,
      borderRadius: '16px',
      border: `1px solid ${colors.primary}15`,
      marginBottom: '24px',
      position: 'relative'
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 24px',
      borderBottom: `1px solid ${colors.primary}15`
    },
    cardTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: 'white',
      margin: 0
    },
    badge: {
      padding: '6px 12px',
      fontSize: '12px',
      fontWeight: '600',
      borderRadius: '20px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      padding: '14px 20px',
      fontSize: '12px',
      fontWeight: '600',
      color: 'rgba(255,255,255,0.5)',
      textAlign: 'left',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      backgroundColor: `${colors.darker}50`,
      borderBottom: `1px solid ${colors.primary}10`
    },
    td: {
      padding: '14px 20px',
      fontSize: '14px',
      color: 'rgba(255,255,255,0.85)',
      borderBottom: `1px solid ${colors.primary}08`,
      verticalAlign: 'middle'
    },
    pointLink: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      color: colors.primary,
      textDecoration: 'none',
      cursor: 'pointer',
      transition: 'opacity 0.2s'
    },
    actionBtns: {
      display: 'flex',
      gap: '8px',
      justifyContent: 'center'
    },
    btnApprouver: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '8px 14px',
      fontSize: '13px',
      fontWeight: '500',
      fontFamily: 'inherit',
      color: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      border: '1px solid rgba(16, 185, 129, 0.3)',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    btnRefuser: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '8px 14px',
      fontSize: '13px',
      fontWeight: '500',
      fontFamily: 'inherit',
      color: '#EF4444',
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    btnInfo: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '8px 14px',
      fontSize: '13px',
      fontWeight: '500',
      fontFamily: 'inherit',
      color: colors.primary,
      backgroundColor: `${colors.primary}15`,
      border: `1px solid ${colors.primary}30`,
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    btnUpgrade: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '8px 14px',
      fontSize: '13px',
      fontWeight: '500',
      fontFamily: 'inherit',
      color: '#F59E0B',
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      border: '1px solid rgba(245, 158, 11, 0.3)',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    btnImages: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '8px 14px',
      fontSize: '13px',
      fontWeight: '500',
      fontFamily: 'inherit',
      color: colors.secondary,
      backgroundColor: `${colors.secondary}15`,
      border: `1px solid ${colors.secondary}30`,
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    emptyState: {
      padding: '60px 24px',
      textAlign: 'center'
    },
    emptyText: {
      fontSize: '15px',
      color: 'rgba(255,255,255,0.5)',
      margin: 0
    },
    // Modal styles
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '24px'
    },
    modal: {
      backgroundColor: colors.dark,
      borderRadius: '20px',
      width: '100%',
      maxWidth: '480px',
      border: `1px solid ${colors.primary}20`,
      overflow: 'hidden'
    },
    modalHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '24px',
      borderBottom: `1px solid ${colors.primary}15`
    },
    modalTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '18px',
      fontWeight: '600',
      color: 'white',
      margin: 0
    },
    modalClose: {
      padding: '8px',
      backgroundColor: 'transparent',
      border: 'none',
      color: 'rgba(255,255,255,0.5)',
      cursor: 'pointer',
      borderRadius: '8px',
      display: 'flex'
    },
    modalBody: {
      padding: '24px'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '600',
      color: 'rgba(255,255,255,0.7)',
      marginBottom: '8px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    input: {
      width: '100%',
      padding: '14px 16px',
      fontSize: '15px',
      fontFamily: 'inherit',
      color: 'white',
      backgroundColor: colors.darker,
      border: `2px solid ${colors.primary}30`,
      borderRadius: '10px',
      outline: 'none',
      boxSizing: 'border-box'
    },
    select: {
      width: '100%',
      padding: '14px 16px',
      fontSize: '15px',
      fontFamily: 'inherit',
      color: 'white',
      backgroundColor: colors.darker,
      border: `2px solid ${colors.primary}30`,
      borderRadius: '10px',
      outline: 'none',
      cursor: 'pointer',
      appearance: 'none'
    },
    selectWrapper: {
      position: 'relative'
    },
    selectIcon: {
      position: 'absolute',
      right: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      color: colors.primary
    },
    modalFooter: {
      display: 'flex',
      gap: '12px',
      padding: '24px',
      borderTop: `1px solid ${colors.primary}15`
    },
    btnCancel: {
      flex: 1,
      padding: '14px',
      fontSize: '15px',
      fontWeight: '500',
      fontFamily: 'inherit',
      color: 'rgba(255,255,255,0.7)',
      backgroundColor: 'transparent',
      border: `1px solid ${colors.primary}30`,
      borderRadius: '10px',
      cursor: 'pointer'
    },
    btnSubmit: {
      flex: 1,
      padding: '14px',
      fontSize: '15px',
      fontWeight: '600',
      fontFamily: 'inherit',
      color: colors.darker,
      backgroundColor: colors.primary,
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer'
    },
    // Styles pour les tooltips d'historique
    tooltip: {
      position: 'absolute',
      backgroundColor: colors.darker,
      border: `1px solid ${colors.primary}30`,
      borderRadius: '8px',
      padding: '12px',
      zIndex: 1000,
      minWidth: '250px',
      maxWidth: '350px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
    },
    tooltipTitle: {
      fontSize: '12px',
      fontWeight: '600',
      color: colors.primary,
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    tooltipItem: {
      fontSize: '11px',
      color: 'rgba(255,255,255,0.8)',
      padding: '4px 0',
      borderBottom: `1px solid ${colors.primary}10`
    },
    idCell: {
      position: 'relative',
      cursor: 'pointer'
    },
    idBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 10px',
      fontSize: '12px',
      fontWeight: '600',
      color: colors.secondary,
      backgroundColor: `${colors.secondary}15`,
      borderRadius: '6px',
      cursor: 'pointer'
    },
    progressCell: {
      position: 'relative'
    },
    progressBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      fontSize: '12px',
      fontWeight: '600',
      borderRadius: '20px',
      cursor: 'pointer'
    },
    btnAvancer: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '8px 14px',
      fontSize: '13px',
      fontWeight: '500',
      fontFamily: 'inherit',
      color: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.15)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }
  };

  // Fonction pour formater une date
  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('fr-FR');
  };

  // Composant Tooltip pour l'historique des signalements
  const SignalementHistoriqueTooltip = ({ signalementId }) => (
    <div style={{ ...styles.tooltip, top: '100%', left: '0', marginTop: '4px' }}>
      <div style={styles.tooltipTitle}>
        <History size={14} /> Historique {formatSignalementId(signalementId)}
      </div>
      {loadingHistorique ? (
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Chargement...</div>
      ) : signalementHistorique.length === 0 ? (
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Aucun historique</div>
      ) : (
        signalementHistorique.slice(0, 5).map((h, i) => (
          <div key={i} style={styles.tooltipItem}>
            <strong>{h.statut || h.libelle || 'N/A'}</strong> - {formatDate(h.date || h.date_historique)}
          </div>
        ))
      )}
    </div>
  );

  // Composant Tooltip pour l'historique des problèmes
  const ProblemeHistoriqueTooltip = ({ problemeId }) => (
    <div style={{ ...styles.tooltip, top: '100%', left: '0', marginTop: '4px' }}>
      <div style={styles.tooltipTitle}>
        <History size={14} /> Historique travaux
      </div>
      {loadingHistorique ? (
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Chargement...</div>
      ) : problemeHistorique.length === 0 ? (
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Aucun historique</div>
      ) : (
        problemeHistorique.slice(0, 5).map((h, i) => (
          <div key={i} style={styles.tooltipItem}>
            <strong>{h.pourcentage != null ? `${h.pourcentage}%` : 'N/A'}</strong> - {h.statut || h.libelle || 'N/A'} - {formatDate(h.date || h.date_historique)}
          </div>
        ))
      )}
    </div>
  );

  const renderNouveaux = () => (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={styles.cardTitle}>Signalements à traiter</h3>
        <span style={{ ...styles.badge, color: colors.secondary, backgroundColor: `${colors.secondary}20` }}>
          {signalements.length} signalement(s)
        </span>
      </div>
      {signalements.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>Aucun signalement en attente</p>
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Ville</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Description</th>
              <th style={{ ...styles.th, textAlign: 'center' }}>Images</th>
              <th style={{ ...styles.th, textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {signalements.map((s) => (
              <tr key={s.id_signalements}>
                <td style={styles.td}>
                  <div 
                    style={styles.idCell}
                    onMouseEnter={() => {
                      setHoveredSignalement(s.id_signalements);
                      loadSignalementHistorique(s.id_signalements);
                    }}
                    onMouseLeave={() => setHoveredSignalement(null)}
                  >
                    <span style={styles.idBadge}>
                      <History size={12} />
                      {formatSignalementId(s.id_signalements)}
                    </span>
                    {hoveredSignalement === s.id_signalements && (
                      <SignalementHistoriqueTooltip signalementId={s.id_signalements} />
                    )}
                  </div>
                </td>
                <td style={styles.td}>
                  <span style={styles.pointLink}>
                    <MapPin size={14} />
                    {s.ville || 'N/A'}
                  </span>
                </td>
                <td style={styles.td}>{s.email_utilisateur || 'N/A'}</td>
                <td style={styles.td}>{s.description}</td>
                <td style={{ ...styles.td, textAlign: 'center' }}>
                  <button 
                    style={styles.btnImages} 
                    onClick={() => handleVoirImages(s.id_signalements)}
                    disabled={loadingImages}
                  >
                    <Image size={14} /> Voir
                  </button>
                </td>
                <td style={styles.td}>
                  <div style={styles.actionBtns}>
                    <button style={styles.btnApprouver} onClick={() => handleApprouver(s.id_signalements)}>
                      <Check size={14} /> Approuver
                    </button>
                    <button style={styles.btnRefuser} onClick={() => handleRefuser(s.id_signalements)}>
                      <X size={14} /> Refuser
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderEnCours = () => (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={styles.cardTitle}>Signalements en cours de traitement</h3>
        <span style={{ ...styles.badge, color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.2)' }}>
          {signalementsEnCours.length} signalement(s)
        </span>
      </div>
      {signalementsEnCours.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>Aucun signalement en cours</p>
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Ville</th>
              <th style={styles.th}>Email Utilisateur</th>
              <th style={styles.th}>Description</th>
              <th style={{ ...styles.th, textAlign: 'center' }}>Budget</th>
              <th style={{ ...styles.th, textAlign: 'center' }}>Images</th>
              <th style={{ ...styles.th, textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {signalementsEnCours.map((s) => (
              <tr key={s.id_signalements}>
                <td style={styles.td}>
                  <div 
                    style={styles.idCell}
                    onMouseEnter={() => {
                      setHoveredSignalement(s.id_signalements);
                      loadSignalementHistorique(s.id_signalements);
                    }}
                    onMouseLeave={() => setHoveredSignalement(null)}
                  >
                    <span style={styles.idBadge}>
                      <History size={12} />
                      {formatSignalementId(s.id_signalements)}
                    </span>
                    {hoveredSignalement === s.id_signalements && (
                      <SignalementHistoriqueTooltip signalementId={s.id_signalements} />
                    )}
                  </div>
                </td>
                <td style={styles.td}>
                  <span style={styles.pointLink}>
                    <MapPin size={14} />
                    {s.ville || 'N/A'}
                  </span>
                </td>
                <td style={styles.td}>{s.email_utilisateur || 'N/A'}</td>
                <td style={styles.td}>{s.description}</td>
                <td style={{ ...styles.td, textAlign: 'center' }}>
                  {s.total_budget ? `${s.total_budget.toLocaleString()} Ar` : 'N/A'}
                </td>
                <td style={{ ...styles.td, textAlign: 'center' }}>
                  <button 
                    style={styles.btnImages} 
                    onClick={() => handleVoirImages(s.id_signalements)}
                    disabled={loadingImages}
                  >
                    <Image size={14} /> Voir
                  </button>
                </td>
                <td style={{ ...styles.td, textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button style={styles.btnInfo} onClick={() => handleMettreInfos(s)}>
                      <Edit3 size={14} /> Mettre Infos
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderResolus = () => (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={styles.cardTitle}>Signalements résolus - Suivi des travaux</h3>
        <span style={{ ...styles.badge, color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
          {signalementsResolus.length} signalement(s)
        </span>
      </div>
      {signalementsResolus.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>Aucun signalement résolu</p>
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Ville</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Entreprise</th>
              <th style={styles.th}>Budget</th>
              <th style={styles.th}>Avancement</th>
              <th style={{ ...styles.th, textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {signalementsResolus.map((s) => {
              const pourcentage = Number(s.probleme_pourcentage) || 0;
              const progressStyle = getProgressStyle(pourcentage);
              const budget = Number(s.total_budget) || 0;
              return (
                <tr key={s.id_signalements}>
                  <td style={styles.td}>
                    <div 
                      style={styles.idCell}
                      onMouseEnter={() => {
                        setHoveredSignalement(s.id_signalements);
                        loadSignalementHistorique(s.id_signalements);
                      }}
                      onMouseLeave={() => setHoveredSignalement(null)}
                    >
                      <span style={styles.idBadge}>
                        <History size={12} />
                        {formatSignalementId(s.id_signalements)}
                      </span>
                      {hoveredSignalement === s.id_signalements && (
                        <SignalementHistoriqueTooltip signalementId={s.id_signalements} />
                      )}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.pointLink}>
                      <MapPin size={14} />
                      {s.ville || 'N/A'}
                    </span>
                  </td>
                  <td style={styles.td}>{s.description}</td>
                  <td style={styles.td}>{s.entreprise_nom || 'N/A'}</td>
                  <td style={styles.td}>{budget > 0 ? `${budget.toLocaleString()} Ar` : 'N/A'}</td>
                  <td style={styles.td}>
                    <div 
                      style={styles.progressCell}
                      onMouseEnter={() => {
                        if (s.probleme_id) {
                          setHoveredProbleme(s.probleme_id);
                          loadProblemeHistorique(s.probleme_id);
                        }
                      }}
                      onMouseLeave={() => setHoveredProbleme(null)}
                    >
                      <span style={{ ...styles.progressBadge, ...progressStyle }}>
                        {pourcentage}%
                        <div style={{ 
                          width: '40px', 
                          height: '6px', 
                          backgroundColor: 'rgba(0,0,0,0.2)', 
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: `${pourcentage}%`, 
                            height: '100%', 
                            backgroundColor: progressStyle.color,
                            transition: 'width 0.3s'
                          }} />
                        </div>
                      </span>
                      {hoveredProbleme === s.probleme_id && s.probleme_id && (
                        <ProblemeHistoriqueTooltip problemeId={s.probleme_id} />
                      )}
                    </div>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    {pourcentage < 100 && s.probleme_id ? (
                      <button style={styles.btnAvancer} onClick={() => handleAvancerProbleme(s)}>
                        <ArrowRight size={14} /> Avancer
                      </button>
                    ) : pourcentage >= 100 ? (
                      <span style={{ color: '#10B981', fontSize: '13px', fontWeight: '600' }}>
                        <CheckCircle size={14} style={{ marginRight: '4px' }} />
                        Terminé
                      </span>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                        Pas de problème lié
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );

  // Calculer les statistiques
  const calculateStats = () => {
    const totalSignalements = signalements.length + signalementsEnCours.length + signalementsResolus.length;
    
    // Calculer le délai moyen de traitement (basé sur les signalements résolus avec problèmes terminés)
    const problemesTermines = signalementsResolus.filter(s => Number(s.probleme_pourcentage) >= 100);
    const problemesEnCours = signalementsResolus.filter(s => Number(s.probleme_pourcentage) > 0 && Number(s.probleme_pourcentage) < 100);
    const problemesNonCommences = signalementsResolus.filter(s => Number(s.probleme_pourcentage) === 0 || !s.probleme_id);
    
    // Taux de résolution
    const tauxResolution = totalSignalements > 0 
      ? ((signalementsResolus.length / totalSignalements) * 100).toFixed(1) 
      : 0;
    
    // Taux de complétion des travaux
    const tauxCompletion = signalementsResolus.length > 0 
      ? ((problemesTermines.length / signalementsResolus.length) * 100).toFixed(1) 
      : 0;
    
    // Budget total - convertir en nombre pour éviter la concaténation
    const budgetTotal = signalementsResolus.reduce((sum, s) => sum + (Number(s.total_budget) || 0), 0);
    
    // Avancement moyen des travaux - convertir en nombre pour éviter la concaténation
    const avancementMoyen = signalementsResolus.length > 0
      ? (signalementsResolus.reduce((sum, s) => sum + (Number(s.probleme_pourcentage) || 0), 0) / signalementsResolus.length).toFixed(0)
      : 0;

    // Délai moyen de résolution (en jours)
    let delaiMoyenJours = 0;
    const signalementsAvecDates = signalementsResolus.filter(s => s.date_creation && s.date_resolution);
    if (signalementsAvecDates.length > 0) {
      const totalDelai = signalementsAvecDates.reduce((sum, s) => {
        const dateCreation = new Date(s.date_creation);
        const dateResolution = new Date(s.date_resolution);
        const delaiMs = dateResolution.getTime() - dateCreation.getTime();
        const delaiJours = delaiMs / (1000 * 60 * 60 * 24);
        return sum + Math.max(0, delaiJours);
      }, 0);
      delaiMoyenJours = (totalDelai / signalementsAvecDates.length).toFixed(1);
    }

    return {
      totalSignalements,
      nouveaux: signalements.length,
      enCours: signalementsEnCours.length,
      resolus: signalementsResolus.length,
      problemesTermines: problemesTermines.length,
      problemesEnCours: problemesEnCours.length,
      problemesNonCommences: problemesNonCommences.length,
      tauxResolution,
      tauxCompletion,
      budgetTotal,
      avancementMoyen,
      delaiMoyenJours
    };
  };

  const renderStatistiques = () => {
    const stats = calculateStats();
    
    const statCardStyle = {
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: '12px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      border: '1px solid rgba(255,255,255,0.1)'
    };
    
    const statValueStyle = {
      fontSize: '32px',
      fontWeight: '700',
      color: '#fff'
    };
    
    const statLabelStyle = {
      fontSize: '14px',
      color: 'rgba(255,255,255,0.6)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    };
    
    const progressBarContainerStyle = {
      width: '100%',
      height: '8px',
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: '4px',
      overflow: 'hidden',
      marginTop: '8px'
    };

    return (
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>
            <BarChart3 size={20} style={{ marginRight: '8px' }} />
            Tableau de bord - Statistiques
          </h3>
        </div>
        
        {/* Cartes de statistiques principales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          {/* Total signalements */}
          <div style={statCardStyle}>
            <div style={statLabelStyle}>
              <Flag size={16} color={colors.primary} /> Total Signalements
            </div>
            <div style={statValueStyle}>{stats.totalSignalements}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
              {stats.nouveaux} nouveaux • {stats.enCours} en cours • {stats.resolus} résolus
            </div>
          </div>
          
          {/* Taux de résolution */}
          <div style={statCardStyle}>
            <div style={statLabelStyle}>
              <TrendingUp size={16} color="#10B981" /> Taux de Résolution
            </div>
            <div style={{ ...statValueStyle, color: '#10B981' }}>{stats.tauxResolution}%</div>
            <div style={progressBarContainerStyle}>
              <div style={{ 
                width: `${stats.tauxResolution}%`, 
                height: '100%', 
                backgroundColor: '#10B981',
                transition: 'width 0.5s'
              }} />
            </div>
          </div>
          
          {/* Avancement moyen des travaux */}
          <div style={statCardStyle}>
            <div style={statLabelStyle}>
              <TrendingUp size={16} color="#F59E0B" /> Avancement Moyen
            </div>
            <div style={{ ...statValueStyle, color: '#F59E0B' }}>{stats.avancementMoyen}%</div>
            <div style={progressBarContainerStyle}>
              <div style={{ 
                width: `${stats.avancementMoyen}%`, 
                height: '100%', 
                backgroundColor: '#F59E0B',
                transition: 'width 0.5s'
              }} />
            </div>
          </div>
          
          {/* Délai moyen de résolution */}
          <div style={statCardStyle}>
            <div style={statLabelStyle}>
              <Clock size={16} color="#8B5CF6" /> Délai Moyen de Résolution
            </div>
            <div style={{ ...statValueStyle, color: '#8B5CF6' }}>
              {stats.delaiMoyenJours} <span style={{ fontSize: '16px' }}>jours</span>
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
              Temps moyen entre création et résolution
            </div>
          </div>
          
          {/* Budget total */}
          <div style={statCardStyle}>
            <div style={statLabelStyle}>
              <Building size={16} color={colors.primary} /> Budget Total Alloué
            </div>
            <div style={{ ...statValueStyle, color: colors.primary }}>
              {stats.budgetTotal.toLocaleString()} <span style={{ fontSize: '16px' }}>Ar</span>
            </div>
          </div>
        </div>
        
        {/* Section détails des travaux */}
        <div style={{ marginTop: '24px' }}>
          <h4 style={{ color: '#fff', fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} /> Répartition des Travaux
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {/* Travaux terminés */}
            <div style={{ 
              ...statCardStyle, 
              borderLeft: '4px solid #10B981',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#10B981' }}>
                {stats.problemesTermines}
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                <CheckCircle size={14} style={{ marginRight: '4px' }} />
                Travaux Terminés (100%)
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                {stats.tauxCompletion}% des signalements résolus
              </div>
            </div>
            
            {/* Travaux en cours */}
            <div style={{ 
              ...statCardStyle, 
              borderLeft: '4px solid #F59E0B',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#F59E0B' }}>
                {stats.problemesEnCours}
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                <ArrowRight size={14} style={{ marginRight: '4px' }} />
                Travaux En Cours (50%)
              </div>
            </div>
            
            {/* Travaux non commencés */}
            <div style={{ 
              ...statCardStyle, 
              borderLeft: '4px solid #EF4444',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#EF4444' }}>
                {stats.problemesNonCommences}
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                <Clock size={14} style={{ marginRight: '4px' }} />
                Non Commencés (0%)
              </div>
            </div>
          </div>
        </div>
        
        {/* Tableau récapitulatif */}
        <div style={{ marginTop: '32px' }}>
          <h4 style={{ color: '#fff', fontSize: '16px', marginBottom: '16px' }}>
            Récapitulatif par Statut
          </h4>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Statut</th>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Pourcentage</th>
                <th style={styles.th}>Progression</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={styles.td}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: colors.secondary }} />
                    Nouveaux
                  </span>
                </td>
                <td style={styles.td}>{stats.nouveaux}</td>
                <td style={styles.td}>{stats.totalSignalements > 0 ? ((stats.nouveaux / stats.totalSignalements) * 100).toFixed(1) : 0}%</td>
                <td style={styles.td}>
                  <div style={{ ...progressBarContainerStyle, width: '100px' }}>
                    <div style={{ 
                      width: `${stats.totalSignalements > 0 ? (stats.nouveaux / stats.totalSignalements) * 100 : 0}%`, 
                      height: '100%', 
                      backgroundColor: colors.secondary 
                    }} />
                  </div>
                </td>
              </tr>
              <tr>
                <td style={styles.td}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                    En cours
                  </span>
                </td>
                <td style={styles.td}>{stats.enCours}</td>
                <td style={styles.td}>{stats.totalSignalements > 0 ? ((stats.enCours / stats.totalSignalements) * 100).toFixed(1) : 0}%</td>
                <td style={styles.td}>
                  <div style={{ ...progressBarContainerStyle, width: '100px' }}>
                    <div style={{ 
                      width: `${stats.totalSignalements > 0 ? (stats.enCours / stats.totalSignalements) * 100 : 0}%`, 
                      height: '100%', 
                      backgroundColor: '#F59E0B' 
                    }} />
                  </div>
                </td>
              </tr>
              <tr>
                <td style={styles.td}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                    Résolus
                  </span>
                </td>
                <td style={styles.td}>{stats.resolus}</td>
                <td style={styles.td}>{stats.tauxResolution}%</td>
                <td style={styles.td}>
                  <div style={{ ...progressBarContainerStyle, width: '100px' }}>
                    <div style={{ 
                      width: `${stats.tauxResolution}%`, 
                      height: '100%', 
                      backgroundColor: '#10B981' 
                    }} />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <>
      <NavbarManager />
      <div style={styles.page}>
        <div style={styles.container}>
          <header style={styles.header}>
            <div style={styles.titleRow}>
              <div style={styles.titleIcon}>
                <Flag size={24} color={colors.secondary} />
              </div>
              <h1 style={styles.title}>Gestion des Signalements</h1>
            </div>
            <p style={styles.subtitle}>Gérez et traitez les signalements des utilisateurs</p>
          </header>

          <div style={styles.tabs}>
            <button
              style={{ ...styles.tab, ...(activeTab === 'Nouveau' ? styles.tabActive : styles.tabInactive) }}
              onClick={() => setActiveTab('Nouveau')}
            >
              Nouveaux ({signalements.length})
            </button>
            <button
              style={{ ...styles.tab, ...(activeTab === 'En cours' ? styles.tabActive : styles.tabInactive) }}
              onClick={() => setActiveTab('En cours')}
            >
              En cours ({signalementsEnCours.length})
            </button>
            <button
              style={{ ...styles.tab, ...(activeTab === 'Resolu' ? styles.tabActive : styles.tabInactive) }}
              onClick={() => setActiveTab('Resolu')}
            >
              Résolus ({signalementsResolus.length})
            </button>
            <button
              style={{ ...styles.tab, ...(activeTab === 'statistiques' ? styles.tabActive : styles.tabInactive) }}
              onClick={() => setActiveTab('statistiques')}
            >
              <BarChart3 size={16} style={{ marginRight: '6px' }} />
              Statistiques
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.5)' }}>
              Chargement...
            </div>
          ) : (
            <>
              {activeTab === 'Nouveau' && renderNouveaux()}
              {activeTab === 'En cours' && renderEnCours()}
              {activeTab === 'Resolu' && renderResolus()}
              {activeTab === 'statistiques' && renderStatistiques()}
            </>
          )}
        </div>
      </div>

      {/* Modal Mettre Infos */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                <Building size={20} color={colors.primary} />
                Compléter les informations
              </h3>
              <button style={styles.modalClose} onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Entreprise</label>
                <div style={styles.selectWrapper}>
                  <select
                    value={modalData.entreprise_id}
                    onChange={(e) => setModalData({ ...modalData, entreprise_id: e.target.value })}
                    style={styles.select}
                  >
                    <option value="">Sélectionner une entreprise</option>
                    {entreprises.map((e) => (
                      <option key={e.id_entreprises} value={e.id_entreprises}>{e.nom}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} style={styles.selectIcon} />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Budget (MGA)</label>
                <input
                  type="number"
                  value={modalData.budget}
                  onChange={(e) => setModalData({ ...modalData, budget: e.target.value })}
                  placeholder="Ex: 50000000"
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Surface (m²)</label>
                <input
                  type="number"
                  value={modalData.surface}
                  onChange={(e) => setModalData({ ...modalData, surface: e.target.value })}
                  placeholder="Ex: 1200"
                  style={styles.input}
                />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.btnCancel} onClick={() => setShowModal(false)}>
                Annuler
              </button>
              <button 
                style={styles.btnSubmit} 
                onClick={handleSubmitInfos}
                disabled={!modalData.entreprise_id || !modalData.budget || !modalData.surface}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Images */}
      <ImageModal 
        isOpen={showImageModal}
        onClose={() => {
          setShowImageModal(false);
          setSelectedImages([]);
          setSelectedSignalementId(null);
        }}
        images={selectedImages}
        signalementId={selectedSignalementId}
      />
    </>
  );
};

export default GestionSignalement;
