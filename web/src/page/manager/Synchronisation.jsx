import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadStatus();
  }, []);

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
        case 'points':
          result = await synchronisationApi.syncPoints();
          break;
        case 'signalements':
          result = await synchronisationApi.syncSignalements();
          break;
      }
      setSyncResult(result);
      await loadStatus();
    } catch (err) {
      console.error(err);
      setSyncError(err.message || 'Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const syncCardStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  };

  const syncInfoStyle = {
    flex: 1
  };

  const syncTitleStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: colors.dark,
    marginBottom: '8px'
  };

  const syncDescStyle = {
    fontSize: '14px',
    color: colors.tertiary
  };

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
                        Détails des erreurs Firebase (Clique pour voir)
                      </summary>
                      <div style={{ 
                        marginTop: '12px',
                        padding: '16px',
                        backgroundColor: '#fff',
                        borderRadius: '6px',
                        border: '1px solid #ffc107'
                      }}>
                        <p style={{ fontSize: '13px', color: '#856404', marginBottom: '12px' }}>
                          <strong>Problème d'authentification Firebase détecté</strong><br/>
                          Les clés d'authentification Firebase ont expiré ou sont invalides.
                        </p>
                        <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                          <strong>Solution:</strong>
                        </p>
                        <ol style={{ fontSize: '12px', color: '#666', paddingLeft: '20px', margin: 0 }}>
                          <li>Aller sur <a href="https://console.firebase.google.com" target="_blank" style={{ color: '#1976d2' }}>Firebase Console</a></li>
                          <li>Sélectionner le projet "tp-firebase-b195d"</li>
                          <li>Project Settings → Service Accounts → Generate New Private Key</li>
                          <li>Remplacer le fichier API/src/config/firebase-admin-sdk.json</li>
                          <li>Redémarrer l'API: <code>docker compose restart API</code></li>
                        </ol>
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
              <Card style={{ marginBottom: '32px' }} padding="32px">
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: colors.dark, marginBottom: '16px' }}>
                  Dernière synchronisation
                </h3>
                <p style={{ color: colors.tertiary }}>
                  {status?.lastSync ? new Date(status.lastSync).toLocaleString('fr-FR') : 'Jamais synchronisé'}
                </p>
                {status?.utilisateurs && (
                  <div style={{ marginTop: '16px' }}>
                    <p style={{ color: colors.dark }}>
                      <strong>Utilisateurs:</strong> {status.utilisateurs.synchronises}/{status.utilisateurs.total_postgres} synchronisés
                    </p>
                    <p style={{ color: colors.dark }}>
                      <strong>Signalements:</strong> {status.signalements?.synchronises}/{status.signalements?.total_postgres} synchronisés
                    </p>
                  </div>
                )}
              </Card>

              {/* Actions de synchronisation */}
              <Card padding="32px">
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: colors.dark, marginBottom: '24px' }}>
                  Actions disponibles
                </h3>

                <div style={syncCardStyle}>
                  <div style={syncInfoStyle}>
                    <div style={syncTitleStyle}>Synchronisation complète</div>
                    <div style={syncDescStyle}>Synchronise toutes les données</div>
                  </div>
                  <Button
                    onClick={() => handleSync('all')}
                    disabled={syncing}
                  >
                    {syncing ? 'En cours...' : 'Tout synchroniser'}
                  </Button>
                </div>

                <div style={syncCardStyle}>
                  <div style={syncInfoStyle}>
                    <div style={syncTitleStyle}>Utilisateurs</div>
                    <div style={syncDescStyle}>Synchroniser les utilisateurs uniquement</div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => handleSync('utilisateurs')}
                    disabled={syncing}
                  >
                    Synchroniser
                  </Button>
                </div>

                <div style={syncCardStyle}>
                  <div style={syncInfoStyle}>
                    <div style={syncTitleStyle}>Signalements</div>
                    <div style={syncDescStyle}>Synchroniser les signalements</div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => handleSync('signalements')}
                    disabled={syncing}
                  >
                    Synchroniser
                  </Button>
                </div>
              </Card>
            </>
          )}
        </Section>
      </Container>
    </>
  );
};

export default Synchronisation;
