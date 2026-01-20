import React, { useState, useEffect } from 'react';
import NavbarManager from '@components/NavbarManager';
import { colors } from '@assets/colors';
import signalementApi from '@api/manager/Signalement';
import { 
  Flag, Check, X, MapPin, Edit3, ArrowUpCircle, 
  Search, RefreshCw, Building, ChevronDown 
} from 'lucide-react';

const GestionSignalement = () => {
  const [signalements, setSignalements] = useState([]);
  const [signalementsVides, setSignalementsVides] = useState([]);
  const [signalementsComplets, setSignalementsComplets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('nouveaux');
  const [showModal, setShowModal] = useState(false);
  const [selectedSignalement, setSelectedSignalement] = useState(null);
  const [modalData, setModalData] = useState({
    entreprise: '',
    budget: '',
    surface: ''
  });

  const entreprises = [
    'Colas Madagascar',
    'SOGEA SATOM',
    'RAZEL-BEC',
    'ENTREPRISE JEAN LEFEBVRE',
    'BOUYGUES TP'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [nouveaux, vides, complets] = await Promise.all([
        signalementApi.getNouveaux(),
        signalementApi.getVides(),
        signalementApi.getComplets()
      ]);
      setSignalements(nouveaux || []);
      setSignalementsVides(vides || []);
      setSignalementsComplets(complets || []);
    } catch (err) {
      console.error(err);
      // Données de démonstration
      setSignalements([
        { id: 1, point: { lat: -18.9137, lng: 47.5361 }, email: 'user1@mail.com', description: 'Route endommagée près du marché' },
        { id: 2, point: { lat: -18.9200, lng: 47.5400 }, email: 'user2@mail.com', description: 'Nid de poule dangereux' },
      ]);
      setSignalementsVides([
        { id: 3, point: { lat: -18.9100, lng: 47.5300 }, email: 'user3@mail.com', description: 'Tronçon à réhabiliter' },
        { id: 4, point: { lat: -18.9050, lng: 47.5450 }, email: 'user4@mail.com', description: 'Carrefour problématique' },
      ]);
      setSignalementsComplets([
        { id: 5, point: { lat: -18.9180, lng: 47.5380 }, description: 'Réfection complète', budget: 50000000, surface: 1200, entreprise: 'Colas Madagascar', statut: 'planifié' },
        { id: 6, point: { lat: -18.9220, lng: 47.5420 }, description: 'Élargissement route', budget: 120000000, surface: 3500, entreprise: 'SOGEA SATOM', statut: 'en_cours' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprouver = async (id) => {
    try {
      await signalementApi.approuver(id);
      await loadData();
    } catch (err) {
      console.error(err);
      setSignalements(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleRefuser = async (id) => {
    try {
      await signalementApi.refuser(id);
      await loadData();
    } catch (err) {
      console.error(err);
      setSignalements(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleMettreInfos = (signalement) => {
    setSelectedSignalement(signalement);
    setModalData({ entreprise: '', budget: '', surface: '' });
    setShowModal(true);
  };

  const handleSubmitInfos = async () => {
    try {
      await signalementApi.mettreInfos(selectedSignalement.id, modalData);
      await loadData();
    } catch (err) {
      console.error(err);
      setSignalementsVides(prev => prev.filter(s => s.id !== selectedSignalement.id));
      setSignalementsComplets(prev => [...prev, {
        ...selectedSignalement,
        ...modalData,
        statut: 'planifié'
      }]);
    }
    setShowModal(false);
    setSelectedSignalement(null);
  };

  const handleUpgrade = async (id) => {
    try {
      await signalementApi.upgrade(id);
      await loadData();
    } catch (err) {
      console.error(err);
      setSignalementsComplets(prev => prev.map(s => 
        s.id === id ? { ...s, statut: 'en_cours' } : s
      ));
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
      case 'planifié':
        return { ...base, color: colors.primary, backgroundColor: `${colors.primary}20` };
      case 'en_cours':
        return { ...base, color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.2)' };
      case 'terminé':
        return { ...base, color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.2)' };
      default:
        return { ...base, color: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.1)' };
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
      overflow: 'hidden',
      marginBottom: '24px'
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
    }
  };

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
              <th style={styles.th}>Point</th>
              <th style={styles.th}>Email Utilisateur</th>
              <th style={styles.th}>Description</th>
              <th style={{ ...styles.th, textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {signalements.map((s) => (
              <tr key={s.id}>
                <td style={styles.td}>
                  <span style={styles.pointLink}>
                    <MapPin size={14} />
                    {formatCoords(s.point)}
                  </span>
                </td>
                <td style={styles.td}>{s.email}</td>
                <td style={styles.td}>{s.description}</td>
                <td style={styles.td}>
                  <div style={styles.actionBtns}>
                    <button style={styles.btnApprouver} onClick={() => handleApprouver(s.id)}>
                      <Check size={14} /> Approuver
                    </button>
                    <button style={styles.btnRefuser} onClick={() => handleRefuser(s.id)}>
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

  const renderVides = () => (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={styles.cardTitle}>Signalements sans informations</h3>
        <span style={{ ...styles.badge, color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.2)' }}>
          {signalementsVides.length} signalement(s)
        </span>
      </div>
      {signalementsVides.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>Tous les signalements ont des informations</p>
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Point</th>
              <th style={styles.th}>Email Utilisateur</th>
              <th style={styles.th}>Description</th>
              <th style={{ ...styles.th, textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {signalementsVides.map((s) => (
              <tr key={s.id}>
                <td style={styles.td}>
                  <span style={styles.pointLink}>
                    <MapPin size={14} />
                    {formatCoords(s.point)}
                  </span>
                </td>
                <td style={styles.td}>{s.email}</td>
                <td style={styles.td}>{s.description}</td>
                <td style={{ ...styles.td, textAlign: 'center' }}>
                  <button style={styles.btnInfo} onClick={() => handleMettreInfos(s)}>
                    <Edit3 size={14} /> Mettre Infos
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderComplets = () => (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={styles.cardTitle}>Signalements complets</h3>
        <span style={{ ...styles.badge, color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
          {signalementsComplets.length} signalement(s)
        </span>
      </div>
      {signalementsComplets.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>Aucun signalement complet</p>
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Point</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Budget</th>
              <th style={styles.th}>Surface</th>
              <th style={styles.th}>Entreprise</th>
              <th style={styles.th}>Statut</th>
              <th style={{ ...styles.th, textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {signalementsComplets.map((s) => (
              <tr key={s.id}>
                <td style={styles.td}>
                  <span style={styles.pointLink}>
                    <MapPin size={14} />
                    {formatCoords(s.point)}
                  </span>
                </td>
                <td style={styles.td}>{s.description}</td>
                <td style={styles.td}>{formatBudget(s.budget)}</td>
                <td style={styles.td}>{s.surface} m²</td>
                <td style={styles.td}>{s.entreprise}</td>
                <td style={styles.td}>
                  <span style={getStatutStyle(s.statut)}>{s.statut?.replace('_', ' ')}</span>
                </td>
                <td style={{ ...styles.td, textAlign: 'center' }}>
                  {s.statut !== 'en_cours' && s.statut !== 'terminé' && (
                    <button style={styles.btnUpgrade} onClick={() => handleUpgrade(s.id)}>
                      <ArrowUpCircle size={14} /> Avancement
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

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
              style={{ ...styles.tab, ...(activeTab === 'nouveaux' ? styles.tabActive : styles.tabInactive) }}
              onClick={() => setActiveTab('nouveaux')}
            >
              Nouveaux ({signalements.length})
            </button>
            <button
              style={{ ...styles.tab, ...(activeTab === 'vides' ? styles.tabActive : styles.tabInactive) }}
              onClick={() => setActiveTab('vides')}
            >
              Sans infos ({signalementsVides.length})
            </button>
            <button
              style={{ ...styles.tab, ...(activeTab === 'complets' ? styles.tabActive : styles.tabInactive) }}
              onClick={() => setActiveTab('complets')}
            >
              Complets ({signalementsComplets.length})
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.5)' }}>
              Chargement...
            </div>
          ) : (
            <>
              {activeTab === 'nouveaux' && renderNouveaux()}
              {activeTab === 'vides' && renderVides()}
              {activeTab === 'complets' && renderComplets()}
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
                    value={modalData.entreprise}
                    onChange={(e) => setModalData({ ...modalData, entreprise: e.target.value })}
                    style={styles.select}
                  >
                    <option value="">Sélectionner une entreprise</option>
                    {entreprises.map((e) => (
                      <option key={e} value={e}>{e}</option>
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
                disabled={!modalData.entreprise || !modalData.budget || !modalData.surface}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GestionSignalement;
