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
  const [signalementsEnCours, setSignalementsEnCours] = useState([]);
  const [signalementsResolus, setSignalementsResolus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('nouveaux');
  const [showModal, setShowModal] = useState(false);
  const [selectedSignalement, setSelectedSignalement] = useState(null);
  const [entreprises, setEntreprises] = useState([]);
  const [modalData, setModalData] = useState({
    entreprise_id: '',
    budget: '',
    surface: ''
  });

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
          probleme_statut_id: 1 // Statut par défaut
        })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la création du problème');
      }
      
      await loadData();
      setShowModal(false);
      setSelectedSignalement(null);
      alert('Informations ajoutées avec succès!');
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      alert('Erreur lors de la mise à jour des informations: ' + err.message);
    }
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
              <th style={styles.th}>Ville</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Description</th>
              <th style={{ ...styles.th, textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {signalements.map((s) => (
              <tr key={s.id_signalements}>
                <td style={styles.td}>
                  <span style={styles.pointLink}>
                    <MapPin size={14} />
                    {s.ville || 'N/A'}
                  </span>
                </td>
                <td style={styles.td}>{s.email_utilisateur || 'N/A'}</td>
                <td style={styles.td}>{s.description}</td>
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
              <th style={styles.th}>Ville</th>
              <th style={styles.th}>Email Utilisateur</th>
              <th style={styles.th}>Description</th>
              <th style={{ ...styles.th, textAlign: 'center' }}>Budget</th>
              <th style={{ ...styles.th, textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {signalementsEnCours.map((s) => (
              <tr key={s.id_signalements}>
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

  const renderResolus = () => (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={styles.cardTitle}>Signalements résolus</h3>
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
              <th style={styles.th}>Ville</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Budget</th>
              <th style={styles.th}>Surface</th>
              <th style={styles.th}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {signalementsResolus.map((s) => (
              <tr key={s.id_signalements}>
                <td style={styles.td}>
                  <span style={styles.pointLink}>
                    <MapPin size={14} />
                    {s.ville || 'N/A'}
                  </span>
                </td>
                <td style={styles.td}>{s.description}</td>
                <td style={styles.td}>{s.email_utilisateur || 'N/A'}</td>
                <td style={styles.td}>{s.total_budget ? `${s.total_budget.toLocaleString()} Ar` : 'N/A'}</td>
                <td style={styles.td}>{s.total_surface ? `${s.total_surface} m²` : 'N/A'}</td>
                <td style={styles.td}>
                  <span style={getStatutStyle(s.statut)}>{s.statut?.replace('_', ' ')}</span>
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
              style={{ ...styles.tab, ...(activeTab === 'en_cours' ? styles.tabActive : styles.tabInactive) }}
              onClick={() => setActiveTab('en_cours')}
            >
              En cours ({signalementsEnCours.length})
            </button>
            <button
              style={{ ...styles.tab, ...(activeTab === 'resolus' ? styles.tabActive : styles.tabInactive) }}
              onClick={() => setActiveTab('resolus')}
            >
              Résolus ({signalementsResolus.length})
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.5)' }}>
              Chargement...
            </div>
          ) : (
            <>
              {activeTab === 'nouveaux' && renderNouveaux()}
              {activeTab === 'en_cours' && renderEnCours()}
              {activeTab === 'resolus' && renderResolus()}
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
    </>
  );
};

export default GestionSignalement;
