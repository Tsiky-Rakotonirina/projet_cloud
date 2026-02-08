import React, { useState, useEffect, useCallback } from 'react';
import Container from '@components/Container';
import Section from '@components/Section';
import Card from '@components/Card';
import Button from '@components/Button';
import NavbarManager from '@components/NavbarManager';
import Loader from '@components/Loader';
import { colors } from '@assets/colors';
import synchronisationApi from '@api/manager/Synchronisation';

const Synchronisation = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [syncError, setSyncError] = useState(null);

  // États pour le tracking des sessions
  const [globalStatus, setGlobalStatus] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [sessionHistory, setSessionHistory] = useState({ sessions: [], pagination: {} });
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionUsers, setSessionUsers] = useState({ items: [], pagination: {}, summary: {} });
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState('sync'); // 'sync' ou 'history'

  useEffect(() => {
    loadStatus();
    loadGlobalStatus();
    loadActiveSessions();
    loadSessionHistory();
  }, []);

  // Polling pour les sessions actives
  useEffect(() => {
    if (activeSessions.length > 0 || syncing) {
      const interval = setInterval(() => {
        loadActiveSessions();
        loadGlobalStatus();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [activeSessions.length, syncing]);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await synchronisationApi.getStatus();
      setStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadGlobalStatus = async () => {
    try {
      const data = await synchronisationApi.getGlobalStatus();
      setGlobalStatus(data);
    } catch (err) {
      console.error('Erreur chargement statut global:', err);
    }
  };

  const loadActiveSessions = async () => {
    try {
      const data = await synchronisationApi.getActiveSessions();
      // S'assurer que c'est toujours un tableau
      setActiveSessions(Array.isArray(data) ? data : (data?.sessions || []));
    } catch (err) {
      console.error('Erreur chargement sessions actives:', err);
      setActiveSessions([]);
    }
  };

  const loadSessionHistory = async (page = 1) => {
    try {
      const data = await synchronisationApi.getSessionHistory(page, 10);
      // Adapter la structure
      const adaptedData = data ? {
        sessions: data.sessions || [],
        pagination: {
          total: data.total || 0,
          currentPage: data.page || 1,
          totalPages: data.totalPages || 1
        }
      } : { sessions: [], pagination: {} };
      setSessionHistory(adaptedData);
    } catch (err) {
      console.error('Erreur chargement historique:', err);
    }
  };

  const loadSessionUsers = async (sessionId, page = 1) => {
    try {
      setLoadingUsers(true);
      const data = await synchronisationApi.getSessionUsers(sessionId, page, 50);
      // Adapter la structure de l'API (users au lieu de items)
      const adaptedData = data ? {
        items: data.users || [],
        pagination: {
          total: data.total || 0,
          currentPage: data.page || 1,
          totalPages: data.totalPages || 1
        },
        summary: {
          total: data.total || 0,
          inserted: data.users?.filter(u => u.action === 'insert').length || 0,
          updated: data.users?.filter(u => u.action === 'update').length || 0,
          skipped: data.users?.filter(u => u.action === 'skip').length || 0,
          errors: data.users?.filter(u => u.action === 'error' || u.status === 'failed').length || 0
        }
      } : { items: [], pagination: {}, summary: {} };
      setSessionUsers(adaptedData);
    } catch (err) {
      console.error('Erreur chargement utilisateurs:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleViewSessionUsers = async (session) => {
    setSelectedSession(session);
    await loadSessionUsers(session.id);
    setShowUsersModal(true);
  };

  const handleSync = async (type) => {
    try {
      setSyncing(true);
      setSyncResult(null);
      setSyncError(null);
      let result;
      switch(type) {
        case 'all':
          result = await synchronisationApi.syncAll();
          break;
        case 'utilisateurs':
          result = await synchronisationApi.syncUtilisateurs();
          break;
        case 'utilisateurs_tracked':
          // Synchronisation avec tracking détaillé
          const pullResult = await synchronisationApi.pullUtilisateursWithTracking('web');
          const pushResult = await synchronisationApi.pushUtilisateursWithTracking('web');
          result = { 
            tracked: true, 
            pull: pullResult, 
            push: pushResult,
            sessionId: pullResult.data?.sessionId || pushResult.data?.sessionId 
          };
          // Rafraîchir les sessions
          await loadActiveSessions();
          await loadSessionHistory();
          break;
        case 'signalements':
          result = await synchronisationApi.syncSignalements();
          break;
        case 'problemes':
          result = await synchronisationApi.syncProblemes();
          break;
        case 'entreprises':
          result = await synchronisationApi.syncEntreprises();
          break;
        case 'villes':
          result = await synchronisationApi.syncVilles();
          break;
        case 'profils':
          result = await synchronisationApi.syncProfils();
          break;
        case 'statuts_utilisateur':
          result = await synchronisationApi.syncStatutsUtilisateur();
          break;
        case 'signalement_statuts':
          result = await synchronisationApi.syncSignalementStatuts();
          break;
        case 'probleme_statuts':
          result = await synchronisationApi.syncProblemeStatuts();
          break;
      }
      setSyncResult(result);
      await loadStatus();
      await loadGlobalStatus();
      await loadSessionHistory();
    } catch (err) {
      console.error(err);
      setSyncError(err.message || 'Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: { bg: '#e8f5e9', color: '#2e7d32', text: 'Terminé' },
      failed: { bg: '#ffebee', color: '#c62828', text: 'Échoué' },
      in_progress: { bg: '#fff3e0', color: '#ef6c00', text: 'En cours' },
      pending: { bg: '#e3f2fd', color: '#1565c0', text: 'En attente' },
      success: { bg: '#e8f5e9', color: '#2e7d32', text: 'Succès' },
      error: { bg: '#ffebee', color: '#c62828', text: 'Erreur' }
    };
    const style = styles[status] || styles.pending;
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        backgroundColor: style.bg,
        color: style.color,
        fontSize: '12px',
        fontWeight: '600'
      }}>
        {style.text}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const syncCardStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: '#FAFBFC',
    borderRadius: '10px',
    marginBottom: '12px',
    border: '1px solid #E5E7EB'
  };

  const syncInfoStyle = {
    flex: 1
  };

  const syncTitleStyle = {
    fontSize: '15px',
    fontWeight: '600',
    color: colors.dark,
    marginBottom: '4px'
  };

  const syncDescStyle = {
    fontSize: '13px',
    color: '#6B7280'
  };

  // Modal pour afficher la liste des utilisateurs synchronisés
  const UsersModal = () => {
    if (!showUsersModal) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '900px',
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: colors.dark, margin: 0 }}>
                Utilisateurs synchronisés
              </h3>
              {selectedSession && (
                <p style={{ fontSize: '14px', color: colors.tertiary, margin: '4px 0 0 0' }}>
                  Session #{selectedSession.id} - {selectedSession.type?.toUpperCase()} - {formatDate(selectedSession.startedAt || selectedSession.createdAt)}
                </p>
              )}
            </div>
            <button
              onClick={() => setShowUsersModal(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: colors.tertiary
              }}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Stats résumé */}
          {sessionUsers.summary && (
            <div style={{
              padding: '16px 24px',
              backgroundColor: '#f8f9fa',
              display: 'flex',
              gap: '24px',
              flexWrap: 'wrap'
            }}>
              <div>
                <span style={{ fontSize: '12px', color: '#666' }}>Total: </span>
                <span style={{ fontWeight: '600' }}>{sessionUsers.summary.total || 0}</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#666' }}>Insérés: </span>
                <span style={{ fontWeight: '600', color: '#2e7d32' }}>{sessionUsers.summary.inserted || 0}</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#666' }}>Modifiés: </span>
                <span style={{ fontWeight: '600', color: '#1565c0' }}>{sessionUsers.summary.updated || 0}</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#666' }}>Ignorés: </span>
                <span style={{ fontWeight: '600', color: '#757575' }}>{sessionUsers.summary.skipped || 0}</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#666' }}>Erreurs: </span>
                <span style={{ fontWeight: '600', color: '#c62828' }}>{sessionUsers.summary.errors || 0}</span>
              </div>
            </div>
          )}

          {/* Liste des utilisateurs */}
          <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
            {loadingUsers ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Loader text="Chargement des utilisateurs..." />
              </div>
            ) : sessionUsers.items?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: colors.tertiary }}>
                Aucun utilisateur dans cette session
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#666' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#666' }}>Nom</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#666' }}>Action</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#666' }}>Statut</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#666' }}>Direction</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#666' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionUsers.items?.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        {item.email || item.label || item.entityId || '-'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        {item.label || '-'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: item.action === 'insert' ? '#e3f2fd' : item.action === 'update' ? '#fff3e0' : item.action === 'skip' ? '#f5f5f5' : '#ffebee',
                          color: item.action === 'insert' ? '#1565c0' : item.action === 'update' ? '#ef6c00' : item.action === 'skip' ? '#757575' : '#c62828'
                        }}>
                          {item.action === 'insert' ? 'Nouveau' : item.action === 'update' ? 'Modifié' : item.action === 'skip' ? 'Ignoré' : 'Erreur'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {getStatusBadge(item.status)}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px' }}>
                        {item.direction === 'firebase_to_postgres' ? <><i className="fas fa-arrow-down" style={{ color: '#3B82F6', marginRight: '4px' }}></i> Firebase → PG</> : <><i className="fas fa-arrow-up" style={{ color: '#10B981', marginRight: '4px' }}></i> PG → Firebase</>}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: colors.tertiary }}>
                        {formatDate(item.syncedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {sessionUsers.pagination?.totalPages > 1 && (
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #eee',
              display: 'flex',
              justifyContent: 'center',
              gap: '8px'
            }}>
              {Array.from({ length: sessionUsers.pagination.totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => loadSessionUsers(selectedSession.id, page)}
                  style={{
                    padding: '8px 12px',
                    border: page === sessionUsers.pagination.currentPage ? 'none' : '1px solid #ddd',
                    borderRadius: '6px',
                    backgroundColor: page === sessionUsers.pagination.currentPage ? colors.primary : 'white',
                    color: page === sessionUsers.pagination.currentPage ? 'white' : colors.dark,
                    cursor: 'pointer',
                    fontWeight: page === sessionUsers.pagination.currentPage ? '600' : '400'
                  }}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Composant pour afficher les sessions actives
  const ActiveSessionsCard = () => {
    // Vérifier que activeSessions est un tableau valide
    if (!Array.isArray(activeSessions) || activeSessions.length === 0) return null;

    return (
      <Card style={{ marginBottom: '24px', border: '2px solid #ff9800', backgroundColor: '#fff8e1' }} padding="24px">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            borderRadius: '50%', 
            backgroundColor: '#ff9800',
            marginRight: '12px',
            animation: 'pulse 1.5s infinite'
          }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.dark, margin: 0 }}>
            Sessions en cours ({activeSessions.length})
          </h3>
        </div>
        {activeSessions.map(session => (
          <div key={session.id} style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <span style={{ fontWeight: '600', color: colors.dark }}>
                  {session.type?.toUpperCase()} - {session.entityType}
                </span>
                {getStatusBadge(session.status)}
              </div>
              <Button
                variant="secondary"
                onClick={() => handleViewSessionUsers(session)}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Voir détails
              </Button>
            </div>
            {/* Barre de progression */}
            <div style={{ backgroundColor: '#e0e0e0', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
              <div style={{
                width: `${session.totalItems > 0 ? (session.processedItems / session.totalItems) * 100 : 0}%`,
                height: '100%',
                backgroundColor: '#4caf50',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: colors.tertiary }}>
              <span>{session.processedItems || 0} / {session.totalItems || 0} éléments</span>
              <span>{session.successCount || 0} succès, {session.errorCount || 0} erreurs</span>
            </div>
          </div>
        ))}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </Card>
    );
  };

  // Composant pour l'historique des sessions
  const SessionHistoryCard = () => (
    <Card padding="24px">
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.dark, marginBottom: '20px' }}>
        Historique des synchronisations
      </h3>
      
      {sessionHistory.sessions?.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: colors.tertiary }}>
          Aucune synchronisation effectuée
        </div>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#666' }}>ID</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#666' }}>Type</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#666' }}>Entité</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#666' }}>Statut</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#666' }}>Traités</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#666' }}>Succès</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#666' }}>Erreurs</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#666' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#666' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessionHistory.sessions?.map(session => (
                <tr key={session.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>#{session.id?.substring(0, 8)}...</td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: session.type === 'pull' ? '#e3f2fd' : session.type === 'push' ? '#e8f5e9' : '#f3e5f5',
                      color: session.type === 'pull' ? '#1565c0' : session.type === 'push' ? '#2e7d32' : '#7b1fa2'
                    }}>
                      {session.type?.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{session.entityType}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{getStatusBadge(session.status)}</td>
                  <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>{(session.inserted || 0) + (session.updated || 0)}</td>
                  <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#2e7d32', fontWeight: '500' }}>{(session.inserted || 0) + (session.updated || 0)}</td>
                  <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: session.errors > 0 ? '#c62828' : '#757575', fontWeight: '500' }}>{session.errors || 0}</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: colors.tertiary }}>{formatDate(session.completedAt || session.startedAt)}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <Button
                      variant="secondary"
                      onClick={() => handleViewSessionUsers(session)}
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      Voir utilisateurs
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {sessionHistory.pagination?.totalPages > 1 && (
            <div style={{
              marginTop: '20px',
              display: 'flex',
              justifyContent: 'center',
              gap: '8px'
            }}>
              {Array.from({ length: sessionHistory.pagination.totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => loadSessionHistory(page)}
                  style={{
                    padding: '8px 12px',
                    border: page === sessionHistory.pagination.currentPage ? 'none' : '1px solid #ddd',
                    borderRadius: '6px',
                    backgroundColor: page === sessionHistory.pagination.currentPage ? colors.primary : 'white',
                    color: page === sessionHistory.pagination.currentPage ? 'white' : colors.dark,
                    cursor: 'pointer',
                    fontWeight: page === sessionHistory.pagination.currentPage ? '600' : '400'
                  }}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );

  // Tabs pour switcher entre sync et historique
  const TabButtons = () => (
    <div style={{ 
      display: 'flex', 
      gap: '0', 
      marginBottom: '28px',
      borderBottom: '2px solid #E5E7EB'
    }}>
      <button
        onClick={() => setActiveTab('sync')}
        style={{
          padding: '14px 28px',
          border: 'none',
          borderBottom: activeTab === 'sync' ? `3px solid ${colors.primary}` : '3px solid transparent',
          backgroundColor: 'transparent',
          color: activeTab === 'sync' ? colors.primary : '#6B7280',
          fontWeight: '600',
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          marginBottom: '-2px'
        }}
      >
        <i className="fas fa-sync-alt" style={{ marginRight: '8px' }}></i>
        Synchronisation
      </button>
      <button
        onClick={() => { setActiveTab('history'); loadSessionHistory(); }}
        style={{
          padding: '14px 28px',
          border: 'none',
          borderBottom: activeTab === 'history' ? `3px solid ${colors.primary}` : '3px solid transparent',
          backgroundColor: 'transparent',
          color: activeTab === 'history' ? colors.primary : '#6B7280',
          fontWeight: '600',
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          marginBottom: '-2px'
        }}
      >
        <i className="fas fa-history" style={{ marginRight: '8px' }}></i>
        Historique
      </button>
    </div>
  );

  return (
    <>
      <NavbarManager />
      <Container>
        <Section
          title="Synchronisation"
          subtitle="Synchronisez les données avec la base centrale"
          style={{ paddingTop: '120px' }}
        >
          {loading ? (
            <Loader text="Chargement du statut..." />
          ) : (
            <>
              {/* Tabs */}
              <TabButtons />

              {/* Sessions actives (toujours visibles) */}
              <ActiveSessionsCard />

              {/* Modal des utilisateurs */}
              <UsersModal />

              {activeTab === 'history' ? (
                <SessionHistoryCard />
              ) : (
                <>
                  {/* Résultat de synchronisation */}
                  {syncResult && (
                    <Card style={{ marginBottom: '32px', border: '2px solid #4caf50', backgroundColor: '#f1f8f4' }} padding="24px">
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '50%', 
                          backgroundColor: '#4caf50',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '16px'
                        }}>        
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: '700', color: colors.dark, marginBottom: '16px' }}>
                          Résultat de la synchronisation
                        </h3>
                      </div>
                      
                      {/* Si tracked, afficher lien vers session */}
                      {syncResult.tracked && syncResult.sessionId && (
                        <div style={{ 
                          backgroundColor: '#e3f2fd', 
                          padding: '12px', 
                          borderRadius: '8px', 
                          marginBottom: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span style={{ color: '#1565c0' }}>
                            <i className="fas fa-check-circle" style={{ marginRight: '6px', color: '#10B981' }}></i> Synchronisation avec tracking activé - Session #{syncResult.pull?.data?.sessionId || syncResult.push?.data?.sessionId}
                          </span>
                          <Button
                            variant="primary"
                            onClick={() => {
                              setActiveTab('history');
                              loadSessionHistory();
                            }}
                            style={{ padding: '8px 16px', fontSize: '13px' }}
                          >
                            Voir les détails
                          </Button>
                        </div>
                      )}

                      {/* Résumé des statistiques */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '20px'
                  }}>
                    {syncResult.utilisateurs_pull?.data?.stats && (
                      <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Utilisateurs (Pull)</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
                          {syncResult.utilisateurs_pull.data.stats.inserted + syncResult.utilisateurs_pull.data.stats.updated}
                        </div>
                        <div style={{ fontSize: '11px', color: '#999' }}>
                          {syncResult.utilisateurs_pull.data.stats.inserted} créés, {syncResult.utilisateurs_pull.data.stats.updated} modifiés
                        </div>
                        {syncResult.utilisateurs_pull.data.stats.errors?.length > 0 && (
                          <div style={{ fontSize: '11px', color: '#d32f2f', marginTop: '4px' }}>
                            {syncResult.utilisateurs_pull.data.stats.errors.length} erreurs
                          </div>
                        )}
                      </div>
                    )}
                    
                    {syncResult.signalements_pull?.data?.stats && (
                      <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Signalements (Pull)</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
                          {syncResult.signalements_pull.data.stats.inserted + syncResult.signalements_pull.data.stats.updated}
                        </div>
                        <div style={{ fontSize: '11px', color: '#999' }}>
                          {syncResult.signalements_pull.data.stats.inserted} créés, {syncResult.signalements_pull.data.stats.updated} modifiés
                        </div>
                        {syncResult.signalements_pull.data.stats.errors?.length > 0 && (
                          <div style={{ fontSize: '11px', color: '#d32f2f', marginTop: '4px' }}>
                            {syncResult.signalements_pull.data.stats.errors.length} erreurs
                          </div>
                        )}
                      </div>
                    )}
                    
                    {syncResult.utilisateurs_push && (
                      <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Utilisateurs (Push)</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: syncResult.utilisateurs_push.success ? '#2e7d32' : '#d32f2f' }}>
                          {syncResult.utilisateurs_push.success ? 'Succès' : 'Erreur'}
                        </div>
                        {!syncResult.utilisateurs_push.success && (
                          <div style={{ fontSize: '11px', color: '#d32f2f', marginTop: '4px' }}>
                            Erreur d'authentification
                          </div>
                        )}
                      </div>
                    )}
                    
                    {syncResult.signalements_push && (
                      <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Signalements (Push)</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: syncResult.signalements_push.success ? '#2e7d32' : '#d32f2f' }}>
                          {syncResult.signalements_push.success ? 'Succès' : 'Erreur'}
                        </div>
                        {!syncResult.signalements_push.success && (
                          <div style={{ fontSize: '11px', color: '#d32f2f', marginTop: '4px' }}>
                            Erreur d'authentification
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Erreurs Firebase détaillées */}
                  {(syncResult.utilisateurs_pull?.data?.stats?.errors?.length > 0 || 
                    syncResult.signalements_pull?.data?.stats?.errors?.length > 0 ||
                    !syncResult.utilisateurs_push?.success ||
                    !syncResult.signalements_push?.success) && (
                    <details style={{ marginTop: '16px' }}>
                      <summary style={{ 
                        cursor: 'pointer', 
                        padding: '12px',
                        backgroundColor: '#fff3cd',
                        borderRadius: '6px',
                        color: '#856404',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}>
                        <i className="fas fa-exclamation-triangle" style={{ marginRight: '6px' }}></i> Détails des avertissements ({
                          (syncResult.utilisateurs_pull?.data?.stats?.errors?.length || 0) +
                          (syncResult.signalements_pull?.data?.stats?.errors?.length || 0)
                        } éléments avec erreurs)
                      </summary>
                      <div style={{ 
                        marginTop: '12px',
                        padding: '16px',
                        backgroundColor: '#fff',
                        borderRadius: '6px',
                        border: '1px solid #ffc107'
                      }}>
                        <p style={{ fontSize: '13px', color: '#856404', marginBottom: '12px' }}>
                          <strong>Certains éléments n'ont pas pu être synchronisés</strong><br/>
                          Ces erreurs sont généralement dues à des données manquantes ou invalides (email, validation, etc.)
                        </p>
                        <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                          <strong>Causes possibles:</strong>
                        </p>
                        <ul style={{ fontSize: '12px', color: '#666', paddingLeft: '20px', margin: 0 }}>
                          <li>Données utilisateur incomplètes (email manquant, format invalide)</li>
                          <li>Références manquantes (profil_id, statut_id non trouvé)</li>
                          <li>Utilisateurs de test avec données factices</li>
                        </ul>
                        <details style={{ marginTop: '12px' }}>
                          <summary style={{ fontSize: '12px', color: '#999', cursor: 'pointer' }}>Voir les erreurs techniques</summary>
                          <pre style={{ 
                            backgroundColor: '#f5f5f5', 
                            padding: '12px', 
                            borderRadius: '6px', 
                            overflow: 'auto',
                            fontSize: '11px',
                            maxHeight: '200px',
                            marginTop: '8px'
                          }}>
                            {JSON.stringify({
                              utilisateurs_pull_errors: syncResult.utilisateurs_pull?.data?.stats?.errors,
                              signalements_pull_errors: syncResult.signalements_pull?.data?.stats?.errors,
                              utilisateurs_push_error: !syncResult.utilisateurs_push?.success ? syncResult.utilisateurs_push?.message : null,
                              signalements_push_error: !syncResult.signalements_push?.success ? syncResult.signalements_push?.message : null
                            }, null, 2)}
                          </pre>
                        </details>
                      </div>
                    </details>
                  )}
                </Card>
              )}

              {syncError && (
                <Card style={{ marginBottom: '32px', border: '2px solid #f44336', backgroundColor: '#ffebee' }} padding="24px">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      backgroundColor: '#f44336',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '16px'
                    }}>
                      <span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>X</span>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#c62828', margin: 0 }}>
                        Erreur de synchronisation
                      </h3>
                      <p style={{ color: '#c62828', margin: '8px 0 0 0', fontSize: '14px' }}>{syncError}</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Statut général */}
              <Card style={{ marginBottom: '28px', border: '1px solid #E5E7EB' }} padding="24px">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.dark, margin: 0 }}>
                    <i className="fas fa-clock" style={{ marginRight: '10px', color: colors.primary }}></i>
                    Statut de synchronisation
                  </h3>
                  <span style={{ 
                    fontSize: '13px', 
                    color: '#6B7280',
                    backgroundColor: '#F3F4F6',
                    padding: '6px 12px',
                    borderRadius: '6px'
                  }}>
                    {status?.lastSync ? new Date(status.lastSync).toLocaleString('fr-FR') : 'Jamais synchronisé'}
                  </span>
                </div>
                {status?.utilisateurs && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Utilisateurs</div>
                      <div style={{ fontSize: '22px', fontWeight: '700', color: colors.primary }}>
                        {status.utilisateurs.synchronises}<span style={{ fontSize: '14px', color: '#9CA3AF', fontWeight: '400' }}>/{status.utilisateurs.total_postgres}</span>
                      </div>
                    </div>
                    <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Signalements</div>
                      <div style={{ fontSize: '22px', fontWeight: '700', color: colors.primary }}>
                        {status.signalements?.synchronises}<span style={{ fontSize: '14px', color: '#9CA3AF', fontWeight: '400' }}>/{status.signalements?.total_postgres}</span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Actions de synchronisation */}
              <Card style={{ border: '1px solid #E5E7EB' }} padding="24px">
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  backgroundColor: colors.primary,
                  borderRadius: '10px',
                  marginBottom: '24px'
                }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#FFFFFF', marginBottom: '4px' }}>
                      Synchronisation complète
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                      Synchronise toutes les données en une seule opération
                    </div>
                  </div>
                  <Button
                    onClick={() => handleSync('all')}
                    disabled={syncing}
                    style={{ 
                      backgroundColor: '#FFFFFF', 
                      color: colors.primary,
                      fontWeight: '600',
                      padding: '10px 20px'
                    }}
                  >
                    {syncing ? 'En cours...' : 'Tout synchroniser'}
                  </Button>
                </div>

                <h4 style={{ 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  color: '#6B7280', 
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Données principales
                </h4>

                <div style={syncCardStyle}>
                  <div style={syncInfoStyle}>
                    <div style={syncTitleStyle}>Utilisateurs</div>
                    <div style={syncDescStyle}>Synchroniser les utilisateurs (inclut profils et statuts)</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      variant="secondary"
                      onClick={() => handleSync('utilisateurs')}
                      disabled={syncing}
                    >
                      Sync rapide
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => handleSync('utilisateurs_tracked')}
                      disabled={syncing}
                      style={{ backgroundColor: colors.primary }}
                    >
                      Avec tracking
                    </Button>
                  </div>
                </div>

                <div style={syncCardStyle}>
                  <div style={syncInfoStyle}>
                    <div style={syncTitleStyle}>Signalements</div>
                    <div style={syncDescStyle}>Synchroniser les signalements (inclut statuts et villes)</div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => handleSync('signalements')}
                    disabled={syncing}
                  >
                    Synchroniser
                  </Button>
                </div>

                <div style={syncCardStyle}>
                  <div style={syncInfoStyle}>
                    <div style={syncTitleStyle}>Problèmes</div>
                    <div style={syncDescStyle}>Synchroniser les problèmes (inclut entreprises et statuts)</div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => handleSync('problemes')}
                    disabled={syncing}
                  >
                    Synchroniser
                  </Button>
                </div>

                <h4 style={{ 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  color: '#6B7280', 
                  marginTop: '28px',
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Tables de référence
                </h4>

                <div style={syncCardStyle}>
                  <div style={syncInfoStyle}>
                    <div style={syncTitleStyle}>Entreprises</div>
                    <div style={syncDescStyle}>Synchroniser les entreprises</div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => handleSync('entreprises')}
                    disabled={syncing}
                  >
                    Synchroniser
                  </Button>
                </div>

                <div style={syncCardStyle}>
                  <div style={syncInfoStyle}>
                    <div style={syncTitleStyle}>Villes</div>
                    <div style={syncDescStyle}>Synchroniser les villes</div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => handleSync('villes')}
                    disabled={syncing}
                  >
                    Synchroniser
                  </Button>
                </div>

                <div style={syncCardStyle}>
                  <div style={syncInfoStyle}>
                    <div style={syncTitleStyle}>Profils</div>
                    <div style={syncDescStyle}>Synchroniser les profils utilisateur (admin, utilisateur, etc.)</div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => handleSync('profils')}
                    disabled={syncing}
                  >
                    Synchroniser
                  </Button>
                </div>

                <h4 style={{ 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  color: '#6B7280', 
                  marginTop: '28px',
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Tables de statuts
                </h4>

                <div style={syncCardStyle}>
                  <div style={syncInfoStyle}>
                    <div style={syncTitleStyle}>Statuts utilisateur</div>
                    <div style={syncDescStyle}>Synchroniser les statuts d'utilisateur (actif, bloqué, etc.)</div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => handleSync('statuts_utilisateur')}
                    disabled={syncing}
                  >
                    Synchroniser
                  </Button>
                </div>

                <div style={syncCardStyle}>
                  <div style={syncInfoStyle}>
                    <div style={syncTitleStyle}>Statuts signalement</div>
                    <div style={syncDescStyle}>Synchroniser les statuts de signalement</div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => handleSync('signalement_statuts')}
                    disabled={syncing}
                  >
                    Synchroniser
                  </Button>
                </div>

                <div style={syncCardStyle}>
                  <div style={syncInfoStyle}>
                    <div style={syncTitleStyle}>Statuts problème</div>
                    <div style={syncDescStyle}>Synchroniser les statuts de problème</div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => handleSync('probleme_statuts')}
                    disabled={syncing}
                  >
                    Synchroniser
                  </Button>
                </div>
              </Card>
                </>
              )}
            </>
          )}
        </Section>
      </Container>
    </>
  );
};

export default Synchronisation;
