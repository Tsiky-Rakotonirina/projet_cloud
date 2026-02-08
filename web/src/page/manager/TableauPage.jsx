import React, { useState, useEffect } from 'react';
import NavbarManager from '@components/NavbarManager';
import { colors } from '@assets/colors';
import tableauVisiteurApi from '@api/visiteur/TableauVisiteur';

const TableauPage = () => {
  const [totals, setTotals] = useState({
    nbPoints: 0,
    totalSurface: 0,
    avancement: 0,
    totalBudget: 0,
    nombreProblemes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tableauVisiteurApi.getStats();
      // Mapper les données de l'API vers le format attendu
      setTotals({
        nbPoints: response.total_points || 0,
        totalSurface: response.total_surface || 0,
        avancement: response.avancement_moyen_pourcent || 0,
        totalBudget: response.total_budget || 0,
        nombreProblemes: response.nombre_problemes || 0
      });
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
      setError('Impossible de charger les statistiques depuis le serveur');
      // Réinitialiser avec des valeurs vides en cas d'erreur
      setTotals({
        nbPoints: 0,
        totalSurface: 0,
        avancement: 0,
        totalBudget: 0,
        nombreProblemes: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const formatBudget = (budget) => {
    if (!budget) return '0 MGA';
    if (budget >= 1000000000) {
      return `${(budget / 1000000000).toFixed(1)} Mrd MGA`;
    }
    if (budget >= 1000000) {
      return `${(budget / 1000000).toFixed(0)} M MGA`;
    }
    return `${budget.toLocaleString()} MGA`;
  };

  const formatSurface = (surface) => {
    if (!surface) return '0 m²';
    if (surface >= 10000) {
      return `${(surface / 10000).toFixed(1)} ha`;
    }
    return `${surface.toLocaleString()} m²`;
  };

  const styles = {
    page: {
      minHeight: '100vh',
      backgroundColor: colors.darker,
      paddingTop: '80px'
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 24px'
    },
    header: {
      marginBottom: '40px'
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
      backgroundColor: `${colors.primary}20`,
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
      color: colors.tertiary,
      margin: 0,
      marginLeft: '64px'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '20px',
      marginBottom: '32px'
    },
    statCard: {
      backgroundColor: colors.surface,
      borderRadius: '16px',
      padding: '24px',
      border: `1px solid ${colors.border}`
    },
    statHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '12px'
    },
    statIcon: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '44px',
      height: '44px',
      borderRadius: '12px'
    },
    statLabel: {
      fontSize: '13px',
      fontWeight: '500',
      color: colors.tertiary,
      margin: 0,
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    statValue: {
      fontSize: '28px',
      fontWeight: '700',
      color: colors.text,
      margin: 0
    }
  };

  return (
    <>
      <NavbarManager />
      <div style={styles.page}>
        <div style={styles.container}>
          <header style={styles.header}>
            <div style={styles.titleRow}>
              <div style={styles.titleIcon}>
                <i className="fas fa-chart-bar" style={{ fontSize: '24px', color: colors.primary }}></i>
              </div>
              <h1 style={styles.title}>Tableau de Bord</h1>
            </div>
            <p style={styles.subtitle}>Statistiques et avancement des travaux</p>
          </header>

          {/* Message d'erreur */}
          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '24px',
              color: '#EF4444',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Stats Cards */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statHeader}>
                <div style={{ ...styles.statIcon, backgroundColor: `${colors.primary}20` }}>
                  <i className="fas fa-map-marker-alt" style={{ fontSize: '22px', color: colors.primary }}></i>
                </div>
              </div>
              <p style={styles.statLabel}>Nombre de Points</p>
              <h3 style={styles.statValue}>{loading ? '...' : totals.nbPoints}</h3>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statHeader}>
                <div style={{ ...styles.statIcon, backgroundColor: `${colors.secondary}20` }}>
                  <i className="fas fa-ruler" style={{ fontSize: '22px', color: colors.secondary }}></i>
                </div>
              </div>
              <p style={styles.statLabel}>Surface Totale</p>
              <h3 style={styles.statValue}>{loading ? '...' : formatSurface(totals.totalSurface)}</h3>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statHeader}>
                <div style={{ ...styles.statIcon, backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                  <i className="fas fa-arrow-trend-up" style={{ fontSize: '22px', color: '#10B981' }}></i>
                </div>
              </div>
              <p style={styles.statLabel}>Avancement Moyen</p>
              <h3 style={styles.statValue}>{loading ? '...' : `${totals.avancement}%`}</h3>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statHeader}>
                <div style={{ ...styles.statIcon, backgroundColor: 'rgba(245, 158, 11, 0.2)' }}>
                  <i className="fas fa-wallet" style={{ fontSize: '22px', color: '#F59E0B' }}></i>
                </div>
              </div>
              <p style={styles.statLabel}>Budget Total</p>
              <h3 style={styles.statValue}>{loading ? '...' : formatBudget(totals.totalBudget)}</h3>
            </div>
          </div>

          {/* Bouton de rafraîchissement */}
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={loadData}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: 'inherit',
                color: colors.primary,
                backgroundColor: `${colors.primary}15`,
                border: 'none',
                borderRadius: '10px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              <i className="fas fa-sync" style={{ fontSize: '18px', animation: loading ? 'spin 1s linear infinite' : 'none' }}></i>
              {loading ? 'Chargement...' : 'Actualiser'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TableauPage;
