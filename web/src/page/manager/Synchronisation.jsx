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
      switch(type) {
        case 'all':
          await synchronisationApi.syncAll();
          break;
        case 'utilisateurs':
          await synchronisationApi.syncUtilisateurs();
          break;
        case 'points':
          await synchronisationApi.syncPoints();
          break;
        case 'signalements':
          await synchronisationApi.syncSignalements();
          break;
      }
      await loadStatus();
    } catch (err) {
      console.error(err);
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
              {/* Statut général */}
              <Card style={{ marginBottom: '32px' }} padding="32px">
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: colors.dark, marginBottom: '16px' }}>
                  Dernière synchronisation
                </h3>
                <p style={{ color: colors.tertiary }}>
                  {status?.lastSync ? new Date(status.lastSync).toLocaleString('fr-FR') : 'Jamais synchronisé'}
                </p>
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
