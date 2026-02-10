import React, { useState, useEffect } from 'react';
import NavbarManager from '@components/NavbarManager';
import ImageModal from '@components/ImageModal';
import { colors } from '@assets/colors';
import signalementApi from '@api/manager/Signalement';
import problemeApi from '@api/manager/Probleme';

const GestionSignalement = () => {
  const [signalements, setSignalements] = useState([]);
  const [signalementsEnCours, setSignalementsEnCours] = useState([]);
  const [signalementsResolus, setSignalementsResolus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Nouveau');
  const [showModal, setShowModal] = useState(false);
  const [selectedSignalement, setSelectedSignalement] = useState(null);
  const [entreprises, setEntreprises] = useState([]);
  const [prixParM2, setPrixParM2] = useState(1000);
  const [modalData, setModalData] = useState({
    entreprise_id: '',
    niveau: 1,
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
  // États pour la configuration prix/m2
  const [editingPrix, setEditingPrix] = useState(false);
  const [tempPrix, setTempPrix] = useState('');

  useEffect(() => {
    loadData();
    loadEntreprises();
    loadPrixParM2();
  }, []);

  const loadPrixParM2 = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/config/prix-par-m2');
      const data = await response.json();
      if (data.success && data.data.prix_par_m2) {
        setPrixParM2(data.data.prix_par_m2);
      }
    } catch (err) {
      console.error('Erreur lors du chargement du prix par m2:', err);
    }
  };

  const updatePrixParM2 = async () => {
    const newPrix = parseFloat(tempPrix);
    if (isNaN(newPrix) || newPrix <= 0) {
      alert('Veuillez entrer un prix valide');
      return;
    }
    try {
      const response = await fetch('http://localhost:3000/api/config/prix-par-m2', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prix_par_m2: newPrix })
      });
      const data = await response.json();
      if (data.success) {
        setPrixParM2(newPrix);
        setEditingPrix(false);
        setTempPrix('');
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du prix:', err);
      alert('Erreur lors de la mise à jour');
    }
  };

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
    setModalData({ entreprise_id: '', niveau: 1, surface: '' });
    setShowModal(true);
  };

  const handleSubmitInfos = async () => {
    try {
      // Créer un problème pour le signalement (budget calculé automatiquement côté serveur)
      const response = await fetch('http://localhost:3000/api/probleme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surface: parseFloat(modalData.surface),
          niveau: parseInt(modalData.niveau),
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
        return { ...base, color: '#6B7280', backgroundColor: '#F3F4F6' };
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
      backgroundColor: '#FFFFFF',
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
      color: colors.text,
      margin: 0
    },
    subtitle: {
      fontSize: '15px',
      color: '#6B7280',
      margin: 0,
      marginLeft: '64px'
    },
    tabs: {
      display: 'flex',
      gap: '8px',
      marginBottom: '24px',
      backgroundColor: '#F3F4F6',
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
      color: 'white',
      backgroundColor: colors.primary
    },
    tabInactive: {
      color: '#6B7280',
      backgroundColor: 'transparent'
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      border: '1px solid #E5E7EB',
      marginBottom: '24px',
      position: 'relative',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 24px',
      borderBottom: '1px solid #E5E7EB'
    },
    cardTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: colors.text,
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
      color: '#6B7280',
      textAlign: 'left',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      backgroundColor: '#F9FAFB',
      borderBottom: '1px solid #E5E7EB'
    },
    td: {
      padding: '14px 20px',
      fontSize: '14px',
      color: colors.text,
      borderBottom: '1px solid #F3F4F6',
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
      color: '#6B7280',
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
      backgroundColor: '#FFFFFF',
      borderRadius: '20px',
      width: '100%',
      maxWidth: '480px',
      border: '1px solid #E5E7EB',
      overflow: 'hidden',
      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
    },
    modalHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '24px',
      borderBottom: '1px solid #E5E7EB'
    },
    modalTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '18px',
      fontWeight: '600',
      color: colors.text,
      margin: 0
    },
    modalClose: {
      padding: '8px',
      backgroundColor: 'transparent',
      border: 'none',
      color: '#6B7280',
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
      color: '#6B7280',
      marginBottom: '8px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    input: {
      width: '100%',
      padding: '14px 16px',
      fontSize: '15px',
      fontFamily: 'inherit',
      color: colors.text,
      backgroundColor: '#F9FAFB',
      border: '2px solid #E5E7EB',
      borderRadius: '10px',
      outline: 'none',
      boxSizing: 'border-box'
    },
    select: {
      width: '100%',
      padding: '14px 16px',
      fontSize: '15px',
      fontFamily: 'inherit',
      color: colors.text,
      backgroundColor: '#F9FAFB',
      border: '2px solid #E5E7EB',
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
      borderTop: '1px solid #E5E7EB'
    },
    btnCancel: {
      flex: 1,
      padding: '14px',
      fontSize: '15px',
      fontWeight: '500',
      fontFamily: 'inherit',
      color: '#6B7280',
      backgroundColor: 'transparent',
      border: '1px solid #E5E7EB',
      borderRadius: '10px',
      cursor: 'pointer'
    },
    btnSubmit: {
      flex: 1,
      padding: '14px',
      fontSize: '15px',
      fontWeight: '600',
      fontFamily: 'inherit',
      color: 'white',
      backgroundColor: colors.primary,
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer'
    },
    // Styles pour les tooltips d'historique
    tooltip: {
      position: 'absolute',
      backgroundColor: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      padding: '12px',
      zIndex: 1000,
      minWidth: '250px',
      maxWidth: '350px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
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
      color: colors.text,
      padding: '4px 0',
      borderBottom: '1px solid #F3F4F6'
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
        <i className="fas fa-history" style={{ fontSize: '14px', marginRight: '6px' }}></i> Historique {formatSignalementId(signalementId)}
      </div>
      {loadingHistorique ? (
        <div style={{ fontSize: '11px', color: '#6B7280' }}>Chargement...</div>
      ) : signalementHistorique.length === 0 ? (
        <div style={{ fontSize: '11px', color: '#6B7280' }}>Aucun historique</div>
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
        <i className="fas fa-history" style={{ fontSize: '14px', marginRight: '6px' }}></i> Historique travaux
      </div>
      {loadingHistorique ? (
        <div style={{ fontSize: '11px', color: '#6B7280' }}>Chargement...</div>
      ) : problemeHistorique.length === 0 ? (
        <div style={{ fontSize: '11px', color: '#6B7280' }}>Aucun historique</div>
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
                      <i className="fas fa-history" style={{ fontSize: '12px', marginRight: '4px' }}></i>
                      {formatSignalementId(s.id_signalements)}
                    </span>
                    {hoveredSignalement === s.id_signalements && (
                      <SignalementHistoriqueTooltip signalementId={s.id_signalements} />
                    )}
                  </div>
                </td>
                <td style={styles.td}>
                  <span style={styles.pointLink}>
                    <i className="fas fa-map-marker-alt" style={{ fontSize: '14px', marginRight: '4px' }}></i>
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
                    <i className="fas fa-image" style={{ fontSize: '14px', marginRight: '4px' }}></i> Voir
                  </button>
                </td>
                <td style={styles.td}>
                  <div style={styles.actionBtns}>
                    <button style={styles.btnApprouver} onClick={() => handleApprouver(s.id_signalements)}>
                      <i className="fas fa-check" style={{ fontSize: '14px', marginRight: '4px' }}></i> Approuver
                    </button>
                    <button style={styles.btnRefuser} onClick={() => handleRefuser(s.id_signalements)}>
                      <i className="fas fa-times" style={{ fontSize: '14px', marginRight: '4px' }}></i> Refuser
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
                      <i className="fas fa-history" style={{ fontSize: '12px', marginRight: '4px' }}></i>
                      {formatSignalementId(s.id_signalements)}
                    </span>
                    {hoveredSignalement === s.id_signalements && (
                      <SignalementHistoriqueTooltip signalementId={s.id_signalements} />
                    )}
                  </div>
                </td>
                <td style={styles.td}>
                  <span style={styles.pointLink}>
                    <i className="fas fa-map-marker-alt" style={{ fontSize: '14px', marginRight: '4px' }}></i>
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
                    <i className="fas fa-image" style={{ fontSize: '14px', marginRight: '4px' }}></i> Voir
                  </button>
                </td>
                <td style={{ ...styles.td, textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button style={styles.btnInfo} onClick={() => handleMettreInfos(s)}>
                      <i className="fas fa-edit" style={{ fontSize: '14px', marginRight: '4px' }}></i> Mettre Infos
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
              <th style={{ ...styles.th, textAlign: 'center' }}>Niveau</th>
              <th style={styles.th}>Avancement</th>
              <th style={{ ...styles.th, textAlign: 'center' }}>Photos</th>
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
                        <i className="fas fa-history" style={{ fontSize: '12px', marginRight: '4px' }}></i>
                        {formatSignalementId(s.id_signalements)}
                      </span>
                      {hoveredSignalement === s.id_signalements && (
                        <SignalementHistoriqueTooltip signalementId={s.id_signalements} />
                      )}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.pointLink}>
                      <i className="fas fa-map-marker-alt" style={{ fontSize: '14px', marginRight: '4px' }}></i>
                      {s.ville || 'N/A'}
                    </span>
                  </td>
                  <td style={styles.td}>{s.description}</td>
                  <td style={styles.td}>{s.entreprise_nom || 'N/A'}</td>
                  <td style={styles.td}>{budget > 0 ? `${budget.toLocaleString()} Ar` : 'N/A'}</td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    {s.probleme_niveau ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        backgroundColor: s.probleme_niveau >= 7 ? 'rgba(239, 68, 68, 0.15)' : s.probleme_niveau >= 4 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: s.probleme_niveau >= 7 ? '#EF4444' : s.probleme_niveau >= 4 ? '#F59E0B' : '#10B981'
                      }}>
                        <i className="fas fa-signal" style={{ fontSize: '11px' }}></i>
                        {s.probleme_niveau}/10
                      </span>
                    ) : (
                      <span style={{ color: '#9CA3AF', fontSize: '12px' }}>N/A</span>
                    )}
                  </td>
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
                    {s.images && s.images.length > 0 ? (
                      <button
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          backgroundColor: colors.surface,
                          color: colors.tertiary,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          transition: 'all 0.2s'
                        }}
                        onClick={() => {
                          setSelectedImages(s.images);
                          setSelectedSignalementId(s.id_signalements);
                          setShowImageModal(true);
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.borderColor = colors.primary;
                          e.target.style.color = colors.primary;
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.borderColor = colors.border;
                          e.target.style.color = colors.tertiary;
                        }}
                      >
                        <i className="fas fa-image"></i>
                        Voir
                      </button>
                    ) : (
                      <span style={{ color: '#9CA3AF', fontSize: '12px' }}>
                        <i className="fas fa-image" style={{ opacity: 0.5 }}></i>
                      </span>
                    )}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    {pourcentage < 100 && s.probleme_id ? (
                      <button style={styles.btnAvancer} onClick={() => handleAvancerProbleme(s)}>
                        <i className="fas fa-arrow-right" style={{ fontSize: '14px', marginRight: '4px' }}></i> Avancer
                      </button>
                    ) : pourcentage >= 100 ? (
                      <span style={{ color: '#10B981', fontSize: '13px', fontWeight: '600' }}>
                        <i className="fas fa-check-circle" style={{ fontSize: '14px', marginRight: '4px' }}></i>
                        Terminé
                      </span>
                    ) : (
                      <span style={{ color: '#9CA3AF', fontSize: '12px' }}>
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
      backgroundColor: '#FFFFFF',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      border: '1px solid #E5E7EB'
    };
    
    const statValueStyle = {
      fontSize: '28px',
      fontWeight: '700',
      color: colors.text
    };
    
    const statLabelStyle = {
      fontSize: '13px',
      fontWeight: '500',
      color: '#6B7280',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    };
    
    const progressBarContainerStyle = {
      width: '100%',
      height: '6px',
      backgroundColor: '#E5E7EB',
      borderRadius: '3px',
      overflow: 'hidden',
      marginTop: '4px'
    };

    const iconWrapperStyle = (bgColor) => ({
      width: '36px',
      height: '36px',
      borderRadius: '10px',
      backgroundColor: bgColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    });

    return (
      <div style={{ padding: '24px' }}>
        {/* Cartes de statistiques principales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {/* Total signalements */}
          <div style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={iconWrapperStyle(`${colors.primary}15`)}>
                <i className="fas fa-flag" style={{ fontSize: '14px', color: colors.primary }}></i>
              </div>
              <span style={statLabelStyle}>Total Signalements</span>
            </div>
            <div style={statValueStyle}>{stats.totalSignalements}</div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
              {stats.nouveaux} nouveaux • {stats.enCours} en cours • {stats.resolus} résolus
            </div>
          </div>
          
          {/* Taux de résolution */}
          <div style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={iconWrapperStyle('rgba(16, 185, 129, 0.15)')}>
                <i className="fas fa-chart-line" style={{ fontSize: '14px', color: '#10B981' }}></i>
              </div>
              <span style={statLabelStyle}>Taux de Résolution</span>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={iconWrapperStyle('rgba(245, 158, 11, 0.15)')}>
                <i className="fas fa-tasks" style={{ fontSize: '14px', color: '#F59E0B' }}></i>
              </div>
              <span style={statLabelStyle}>Avancement Moyen</span>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={iconWrapperStyle('rgba(139, 92, 246, 0.15)')}>
                <i className="fas fa-clock" style={{ fontSize: '14px', color: '#8B5CF6' }}></i>
              </div>
              <span style={statLabelStyle}>Délai Moyen</span>
            </div>
            <div style={{ ...statValueStyle, color: '#8B5CF6' }}>
              {stats.delaiMoyenJours} <span style={{ fontSize: '14px', fontWeight: '500' }}>jours</span>
            </div>
            <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
              Temps moyen entre création et résolution
            </div>
          </div>
          
          {/* Budget total */}
          <div style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={iconWrapperStyle(`${colors.primary}15`)}>
                <i className="fas fa-wallet" style={{ fontSize: '14px', color: colors.primary }}></i>
              </div>
              <span style={statLabelStyle}>Budget Total Alloué</span>
            </div>
            <div style={{ ...statValueStyle, color: colors.primary }}>
              {stats.budgetTotal.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: '500' }}>Ar</span>
            </div>
          </div>
        </div>
        
        {/* Section détails des travaux */}
        <div style={{ marginTop: '32px' }}>
          <h4 style={{ color: colors.text, fontSize: '15px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fas fa-hard-hat" style={{ fontSize: '16px', color: colors.primary }}></i> Répartition des Travaux
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {/* Travaux terminés */}
            <div style={{ 
              ...statCardStyle, 
              textAlign: 'center',
              padding: '24px'
            }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <i className="fas fa-check" style={{ fontSize: '20px', color: '#10B981' }}></i>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#10B981' }}>
                {stats.problemesTermines}
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                Travaux Terminés
              </div>
              <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                {stats.tauxCompletion}% des signalements résolus
              </div>
            </div>
            
            {/* Travaux en cours */}
            <div style={{ 
              ...statCardStyle, 
              textAlign: 'center',
              padding: '24px'
            }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(245, 158, 11, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <i className="fas fa-spinner" style={{ fontSize: '20px', color: '#F59E0B' }}></i>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#F59E0B' }}>
                {stats.problemesEnCours}
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                Travaux En Cours
              </div>
            </div>
            
            {/* Travaux non commencés */}
            <div style={{ 
              ...statCardStyle, 
              textAlign: 'center',
              padding: '24px'
            }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <i className="fas fa-pause" style={{ fontSize: '20px', color: '#EF4444' }}></i>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#EF4444' }}>
                {stats.problemesNonCommences}
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                Non Commencés
              </div>
            </div>
          </div>
        </div>
        
        {/* Tableau récapitulatif */}
        <div style={{ 
          marginTop: '32px',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          overflow: 'hidden'
        }}>
          <div style={{ 
            padding: '16px 20px',
            borderBottom: '1px solid #E5E7EB',
            backgroundColor: '#F9FAFB'
          }}>
            <h4 style={{ color: colors.text, fontSize: '15px', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fas fa-list-alt" style={{ fontSize: '16px', color: colors.primary }}></i>
              Récapitulatif par Statut
            </h4>
          </div>
          <table style={{ ...styles.table, margin: 0 }}>
            <thead>
              <tr>
                <th style={{ ...styles.th, backgroundColor: 'transparent' }}>Statut</th>
                <th style={{ ...styles.th, backgroundColor: 'transparent' }}>Nombre</th>
                <th style={{ ...styles.th, backgroundColor: 'transparent' }}>Pourcentage</th>
                <th style={{ ...styles.th, backgroundColor: 'transparent' }}>Progression</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={styles.td}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors.secondary }} />
                    <span style={{ fontWeight: '500' }}>Nouveaux</span>
                  </span>
                </td>
                <td style={{ ...styles.td, fontWeight: '600' }}>{stats.nouveaux}</td>
                <td style={styles.td}>{stats.totalSignalements > 0 ? ((stats.nouveaux / stats.totalSignalements) * 100).toFixed(1) : 0}%</td>
                <td style={styles.td}>
                  <div style={{ width: '120px', height: '6px', backgroundColor: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${stats.totalSignalements > 0 ? (stats.nouveaux / stats.totalSignalements) * 100 : 0}%`, 
                      height: '100%', 
                      backgroundColor: colors.secondary,
                      borderRadius: '3px'
                    }} />
                  </div>
                </td>
              </tr>
              <tr>
                <td style={styles.td}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                    <span style={{ fontWeight: '500' }}>En cours</span>
                  </span>
                </td>
                <td style={{ ...styles.td, fontWeight: '600' }}>{stats.enCours}</td>
                <td style={styles.td}>{stats.totalSignalements > 0 ? ((stats.enCours / stats.totalSignalements) * 100).toFixed(1) : 0}%</td>
                <td style={styles.td}>
                  <div style={{ width: '120px', height: '6px', backgroundColor: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${stats.totalSignalements > 0 ? (stats.enCours / stats.totalSignalements) * 100 : 0}%`, 
                      height: '100%', 
                      backgroundColor: '#F59E0B',
                      borderRadius: '3px'
                    }} />
                  </div>
                </td>
              </tr>
              <tr>
                <td style={styles.td}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                    <span style={{ fontWeight: '500' }}>Résolus</span>
                  </span>
                </td>
                <td style={{ ...styles.td, fontWeight: '600' }}>{stats.resolus}</td>
                <td style={styles.td}>{stats.tauxResolution}%</td>
                <td style={styles.td}>
                  <div style={{ width: '120px', height: '6px', backgroundColor: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${stats.tauxResolution}%`, 
                      height: '100%', 
                      backgroundColor: '#10B981',
                      borderRadius: '3px'
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
                <i className="fas fa-flag" style={{ fontSize: '24px', color: colors.secondary }}></i>
              </div>
              <h1 style={styles.title}>Gestion des Signalements</h1>
            </div>
            <p style={styles.subtitle}>Gérez et traitez les signalements des utilisateurs</p>
          </header>

          {/* Configuration prix par m² */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            padding: '12px 20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '10px',
            marginBottom: '20px',
            border: '1px solid #e9ecef'
          }}>
            <span style={{ color: '#666', fontSize: '14px', fontWeight: '500' }}>
              <i className="fas fa-calculator" style={{ marginRight: '6px' }}></i>
              Prix par m² :
            </span>
            {editingPrix ? (
              <>
                <input
                  type="number"
                  value={tempPrix}
                  onChange={(e) => setTempPrix(e.target.value)}
                  placeholder={prixParM2.toString()}
                  style={{
                    width: '120px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `2px solid ${colors.primary}`,
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                  autoFocus
                />
                <button
                  onClick={updatePrixParM2}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: colors.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  <i className="fas fa-check" style={{ marginRight: '4px' }}></i>
                  Valider
                </button>
                <button
                  onClick={() => { setEditingPrix(false); setTempPrix(''); }}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#e0e0e0',
                    color: '#666',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </>
            ) : (
              <>
                <span style={{ fontSize: '18px', fontWeight: '700', color: colors.primary }}>
                  {prixParM2.toLocaleString()} Ar
                </span>
                <button
                  onClick={() => { setEditingPrix(true); setTempPrix(prixParM2.toString()); }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'white',
                    color: colors.primary,
                    border: `1px solid ${colors.primary}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                >
                  <i className="fas fa-edit" style={{ marginRight: '4px' }}></i>
                  Modifier
                </button>
              </>
            )}
          </div>

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
              <i className="fas fa-chart-bar" style={{ marginRight: '6px', fontSize: '16px' }}></i>
              Statistiques
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
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
                <i className="fas fa-building" style={{ marginRight: '8px', fontSize: '20px', color: colors.primary }}></i>
                Compléter les informations
              </h3>
              <button style={styles.modalClose} onClick={() => setShowModal(false)}>
                <i className="fas fa-times" style={{ fontSize: '20px' }}></i>
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
                  <i className="fas fa-chevron-down" style={{ ...styles.selectIcon, fontSize: '14px' }}></i>
                </div>
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
              <div style={styles.formGroup}>
                <label style={styles.label}>Niveau de réparation (1-10)</label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '8px',
                  marginTop: '8px'
                }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <label
                      key={n}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px 8px',
                        borderRadius: '8px',
                        border: `2px solid ${modalData.niveau === n ? colors.primary : '#e0e0e0'}`,
                        backgroundColor: modalData.niveau === n ? `${colors.primary}15` : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontWeight: modalData.niveau === n ? '600' : '400',
                        color: modalData.niveau === n ? colors.primary : '#666'
                      }}
                    >
                      <input
                        type="radio"
                        name="niveau"
                        value={n}
                        checked={modalData.niveau === n}
                        onChange={() => setModalData({ ...modalData, niveau: n })}
                        style={{ display: 'none' }}
                      />
                      {n}
                    </label>
                  ))}
                </div>
              </div>
              {/* Budget calculé automatiquement */}
              <div style={{
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                marginTop: '16px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#666', fontSize: '14px' }}>Budget estimé :</span>
                  <span style={{ 
                    fontSize: '20px', 
                    fontWeight: '700', 
                    color: colors.primary 
                  }}>
                    {(prixParM2 * (modalData.niveau || 1) * (parseFloat(modalData.surface) || 0)).toLocaleString()} Ar
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  Formule: {prixParM2.toLocaleString()} Ar/m² × niveau {modalData.niveau || 1} × {parseFloat(modalData.surface) || 0} m²
                </div>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.btnCancel} onClick={() => setShowModal(false)}>
                Annuler
              </button>
              <button 
                style={styles.btnSubmit} 
                onClick={handleSubmitInfos}
                disabled={!modalData.entreprise_id || !modalData.surface}
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
