import React, { useState, useEffect } from 'react';
import Navbar from '@components/Navbar';
import { colors } from '@assets/colors';
import tableauVisiteurApi from '@api/visiteur/TableauVisiteur';
import { BarChart3, MapPin, Ruler, TrendingUp, Wallet, RefreshCw } from 'lucide-react';

const TableauPage = () => {
  const [totals, setTotals] = useState({
    nbPoints: 0,
    totalSurface: 0,
    avancement: 0,
    totalBudget: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const totalsData = await tableauVisiteurApi.getStats();
      setTotals(totalsData || {
        nbPoints: 0,
        totalSurface: 0,
        avancement: 0,
        totalBudget: 0
      });
    } catch (err) {
      console.error(err);
      // Données de démonstration
      setTotals({
        nbPoints: 107,
        totalSurface: 28300,
        avancement: 56,
        totalBudget: 5870000000
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

  const getAvancementColor = (pct) => {
    if (pct >= 70) return '#10B981';
    if (pct >= 40) return '#F59E0B';
    return colors.secondary;
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
      color: 'white',
      margin: 0
    },
    subtitle: {
      fontSize: '15px',
      color: 'rgba(255,255,255,0.6)',
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
      backgroundColor: colors.dark,
      borderRadius: '16px',
      padding: '24px',
      border: `1px solid ${colors.primary}15`
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
      color: 'rgba(255,255,255,0.6)',
      margin: 0,
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    statValue: {
      fontSize: '28px',
      fontWeight: '700',
      color: 'white',
      margin: 0
    },
    card: {
      backgroundColor: colors.dark,
      borderRadius: '16px',
      border: `1px solid ${colors.primary}15`,
      overflow: 'hidden'
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
    refreshBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 14px',
      fontSize: '13px',
      fontWeight: '500',
      fontFamily: 'inherit',
      color: colors.primary,
      backgroundColor: `${colors.primary}15`,
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      padding: '16px 24px',
      fontSize: '12px',
      fontWeight: '600',
      color: 'rgba(255,255,255,0.5)',
      textAlign: 'left',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      backgroundColor: `${colors.darker}50`,
      borderBottom: `1px solid ${colors.primary}10`
    },
    thRight: {
      textAlign: 'right'
    },
    thCenter: {
      textAlign: 'center'
    },
    td: {
      padding: '16px 24px',
      fontSize: '14px',
      color: 'rgba(255,255,255,0.85)',
      borderBottom: `1px solid ${colors.primary}08`
    },
    tdRight: {
      textAlign: 'right',
      fontFamily: 'monospace',
      fontSize: '14px'
    },
    tdCenter: {
      textAlign: 'center'
    },
    zoneCell: {
      fontWeight: '600',
      color: 'white'
    },
    progressContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      justifyContent: 'center'
    },
    progressBar: {
      flex: 1,
      height: '8px',
      backgroundColor: `${colors.primary}15`,
      borderRadius: '4px',
      overflow: 'hidden',
      maxWidth: '100px'
    },
    progressFill: {
      height: '100%',
      borderRadius: '4px',
      transition: 'width 0.3s ease'
    },
    progressText: {
      fontSize: '13px',
      fontWeight: '600',
      minWidth: '45px',
      textAlign: 'right'
    },
    totalRow: {
      backgroundColor: `${colors.primary}08`
    },
    totalLabel: {
      fontWeight: '700',
      color: 'white',
      fontSize: '15px'
    },
    totalValue: {
      fontWeight: '700',
      color: colors.primary,
      fontSize: '15px'
    },
    loadingState: {
      padding: '60px 24px',
      textAlign: 'center',
      color: 'rgba(255,255,255,0.5)'
    }
  };

  return (
    <>
      <Navbar />
      <div style={styles.page}>
        <div style={styles.container}>
          <header style={styles.header}>
            <div style={styles.titleRow}>
              <div style={styles.titleIcon}>
                <BarChart3 size={24} color={colors.primary} />
              </div>
              <h1 style={styles.title}>Tableau de Bord</h1>
            </div>
            <p style={styles.subtitle}>Statistiques et avancement des travaux</p>
          </header>

          {/* Stats Cards */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statHeader}>
                <div style={{ ...styles.statIcon, backgroundColor: `${colors.primary}20` }}>
                  <MapPin size={22} color={colors.primary} />
                </div>
              </div>
              <p style={styles.statLabel}>Nombre de Points</p>
              <h3 style={styles.statValue}>{totals.nbPoints}</h3>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statHeader}>
                <div style={{ ...styles.statIcon, backgroundColor: `${colors.secondary}20` }}>
                  <Ruler size={22} color={colors.secondary} />
                </div>
              </div>
              <p style={styles.statLabel}>Surface Totale</p>
              <h3 style={styles.statValue}>{formatSurface(totals.totalSurface)}</h3>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statHeader}>
                <div style={{ ...styles.statIcon, backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                  <TrendingUp size={22} color="#10B981" />
                </div>
              </div>
              <p style={styles.statLabel}>Avancement Moyen</p>
              <h3 style={styles.statValue}>{totals.avancement}%</h3>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statHeader}>
                <div style={{ ...styles.statIcon, backgroundColor: 'rgba(245, 158, 11, 0.2)' }}>
                  <Wallet size={22} color="#F59E0B" />
                </div>
              </div>
              <p style={styles.statLabel}>Budget Total</p>
              <h3 style={styles.statValue}>{formatBudget(totals.totalBudget)}</h3>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TableauPage;
