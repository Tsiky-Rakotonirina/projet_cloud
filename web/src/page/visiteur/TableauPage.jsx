import React, { useState, useEffect } from 'react';
import Navbar from '@components/Navbar';
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

  // Cercle de progression SVG
  const ProgressCircle = ({ percentage, size = 120, strokeWidth = 10 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;
    
    const getColor = (pct) => {
      if (pct >= 70) return '#10B981';
      if (pct >= 40) return '#F59E0B';
      return colors.primary;
    };

    return (
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`${colors.border}`}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(percentage)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
    );
  };

  const styles = {
    page: {
      minHeight: '100vh',
      backgroundColor: '#FFFFFF',
      paddingTop: '80px'
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 24px'
    },
    // Hero Section
    heroSection: {
      backgroundColor: '#F8FAFC',
      borderRadius: '24px',
      padding: '40px',
      marginBottom: '32px',
      position: 'relative',
      overflow: 'hidden',
      border: `1px solid ${colors.border}`
    },
    heroPattern: {
      display: 'none'
    },
    heroContent: {
      position: 'relative',
      zIndex: 1
    },
    heroTitle: {
      fontSize: '32px',
      fontWeight: '800',
      color: colors.text,
      margin: '0 0 8px 0',
      letterSpacing: '-0.5px'
    },
    heroSubtitle: {
      fontSize: '16px',
      color: colors.tertiary,
      margin: 0,
      maxWidth: '500px'
    },
    refreshBtn: {
      position: 'absolute',
      top: '40px',
      right: '40px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 20px',
      fontSize: '14px',
      fontWeight: '600',
      fontFamily: 'inherit',
      color: '#FFFFFF',
      backgroundColor: colors.primary,
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    // Stats Grid
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '24px',
      marginBottom: '32px'
    },
    // Main Stat Card (Avancement)
    mainStatCard: {
      gridColumn: 'span 2',
      gridRow: 'span 2',
      backgroundColor: colors.surface,
      borderRadius: '24px',
      padding: '32px',
      border: `1px solid ${colors.border}`,
      boxShadow: '0 4px 16px rgba(39, 76, 119, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    },
    mainStatBg: {
      display: 'none'
    },
    progressWrapper: {
      position: 'relative',
      marginBottom: '24px'
    },
    progressValue: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center'
    },
    progressPercent: {
      fontSize: '36px',
      fontWeight: '800',
      color: colors.text,
      lineHeight: 1
    },
    progressLabel: {
      fontSize: '12px',
      fontWeight: '500',
      color: colors.tertiary,
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    mainStatTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: colors.text,
      margin: '0 0 4px 0'
    },
    mainStatDesc: {
      fontSize: '14px',
      color: colors.tertiary,
      margin: 0
    },
    // Small Stat Cards
    statCard: {
      backgroundColor: colors.surface,
      borderRadius: '20px',
      padding: '24px',
      border: `1px solid ${colors.border}`,
      boxShadow: '0 2px 12px rgba(39, 76, 119, 0.06)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease'
    },
    statCardHover: {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 24px rgba(39, 76, 119, 0.12)'
    },
    statIconWrapper: {
      width: '56px',
      height: '56px',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '20px'
    },
    statValue: {
      fontSize: '32px',
      fontWeight: '800',
      color: colors.text,
      margin: '0 0 4px 0',
      lineHeight: 1.2
    },
    statUnit: {
      fontSize: '16px',
      fontWeight: '500',
      color: colors.tertiary,
      marginLeft: '4px'
    },
    statLabel: {
      fontSize: '14px',
      fontWeight: '500',
      color: colors.tertiary,
      margin: 0
    },
    statTrend: {
      position: 'absolute',
      top: '24px',
      right: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '6px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600'
    },
    // Info Cards Section
    infoSection: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '24px'
    },
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: '20px',
      padding: '28px',
      border: `1px solid ${colors.border}`,
      boxShadow: '0 2px 12px rgba(39, 76, 119, 0.06)'
    },
    infoCardHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '20px'
    },
    infoCardIcon: {
      width: '44px',
      height: '44px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    infoCardTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: colors.text,
      margin: 0
    },
    infoItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: `1px solid ${colors.border}`
    },
    infoItemLast: {
      borderBottom: 'none'
    },
    infoLabel: {
      fontSize: '14px',
      color: colors.tertiary
    },
    infoValue: {
      fontSize: '15px',
      fontWeight: '600',
      color: colors.text
    },
    errorBox: {
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
      border: '1px solid rgba(239, 68, 68, 0.2)',
      borderRadius: '16px',
      padding: '20px 24px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      color: '#EF4444',
      fontSize: '14px'
    }
  };

  // Responsive grid for mobile
  const responsiveStyles = `
    @media (max-width: 900px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr) !important;
      }
      .main-stat-card {
        grid-column: span 2 !important;
        grid-row: span 1 !important;
      }
      .info-section {
        grid-template-columns: 1fr !important;
      }
    }
    @media (max-width: 600px) {
      .stats-grid {
        grid-template-columns: 1fr !important;
      }
      .main-stat-card {
        grid-column: span 1 !important;
      }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  return (
    <>
      <style>{responsiveStyles}</style>
      <Navbar />
      <div style={styles.page}>
        <div style={styles.container}>
          {/* Hero Section */}
          <div style={styles.heroSection}>
            <div style={styles.heroPattern}></div>
            <div style={styles.heroContent}>
              <h1 style={styles.heroTitle}>
                <i className="fas fa-chart-pie" style={{ marginRight: '12px', color: colors.primary }}></i>
                Tableau de Bord
              </h1>
              <p style={styles.heroSubtitle}>
                Vue d'ensemble des statistiques et de l'avancement des travaux routiers
              </p>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              style={{
                ...styles.refreshBtn,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)')}
            >
              <i className="fas fa-sync-alt" style={{ 
                fontSize: '16px', 
                animation: loading ? 'spin 1s linear infinite' : 'none' 
              }}></i>
              {loading ? 'Chargement...' : 'Actualiser'}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div style={styles.errorBox}>
              <i className="fas fa-exclamation-circle" style={{ fontSize: '20px' }}></i>
              <span>{error}</span>
            </div>
          )}

          {/* Stats Grid */}
          <div className="stats-grid" style={styles.statsGrid}>
            {/* Main Card - Avancement */}
            <div className="main-stat-card" style={styles.mainStatCard}>
              <div style={styles.mainStatBg}></div>
              <div style={styles.progressWrapper}>
                <ProgressCircle percentage={loading ? 0 : totals.avancement} size={160} strokeWidth={12} />
                <div style={styles.progressValue}>
                  <div style={styles.progressPercent}>
                    {loading ? '...' : totals.avancement}%
                  </div>
                </div>
              </div>
              <h3 style={styles.mainStatTitle}>Avancement Global</h3>
              <p style={styles.mainStatDesc}>Progression moyenne des travaux</p>
            </div>

            {/* Card - Points */}
            <div style={styles.statCard}>
              <div style={{ 
                ...styles.statIconWrapper, 
                backgroundColor: `${colors.primary}15`
              }}>
                <i className="fas fa-map-marker-alt" style={{ fontSize: '24px', color: colors.primary }}></i>
              </div>
              <h3 style={styles.statValue}>{loading ? '...' : totals.nbPoints}</h3>
              <p style={styles.statLabel}>Points enregistrés</p>
            </div>

            {/* Card - Surface */}
            <div style={styles.statCard}>
              <div style={{ 
                ...styles.statIconWrapper, 
                backgroundColor: 'rgba(59, 130, 246, 0.15)'
              }}>
                <i className="fas fa-vector-square" style={{ fontSize: '24px', color: '#3B82F6' }}></i>
              </div>
              <h3 style={styles.statValue}>
                {loading ? '...' : formatSurface(totals.totalSurface)}
              </h3>
              <p style={styles.statLabel}>Surface totale</p>
            </div>

            {/* Card - Budget */}
            <div style={styles.statCard}>
              <div style={{ 
                ...styles.statIconWrapper, 
                backgroundColor: 'rgba(245, 158, 11, 0.15)'
              }}>
                <i className="fas fa-coins" style={{ fontSize: '24px', color: '#F59E0B' }}></i>
              </div>
              <h3 style={styles.statValue}>
                {loading ? '...' : formatBudget(totals.totalBudget)}
              </h3>
              <p style={styles.statLabel}>Budget alloué</p>
            </div>

            {/* Card - Problèmes */}
            <div style={styles.statCard}>
              <div style={{ 
                ...styles.statIconWrapper, 
                backgroundColor: 'rgba(16, 185, 129, 0.15)'
              }}>
                <i className="fas fa-tools" style={{ fontSize: '24px', color: '#10B981' }}></i>
              </div>
              <h3 style={styles.statValue}>{loading ? '...' : totals.nombreProblemes}</h3>
              <p style={styles.statLabel}>Travaux en cours</p>
            </div>
          </div>

          {/* Info Cards */}
          <div className="info-section" style={styles.infoSection}>
            {/* Résumé rapide */}
            <div style={styles.infoCard}>
              <div style={styles.infoCardHeader}>
                <div style={{ ...styles.infoCardIcon, backgroundColor: `${colors.primary}15` }}>
                  <i className="fas fa-clipboard-list" style={{ fontSize: '20px', color: colors.primary }}></i>
                </div>
                <h3 style={styles.infoCardTitle}>Résumé rapide</h3>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Points de contrôle</span>
                <span style={styles.infoValue}>{loading ? '...' : totals.nbPoints} points</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Surface couverte</span>
                <span style={styles.infoValue}>{loading ? '...' : formatSurface(totals.totalSurface)}</span>
              </div>
              <div style={{ ...styles.infoItem, ...styles.infoItemLast }}>
                <span style={styles.infoLabel}>Budget total</span>
                <span style={{ ...styles.infoValue, color: '#F59E0B' }}>
                  {loading ? '...' : formatBudget(totals.totalBudget)}
                </span>
              </div>
            </div>

            {/* État des travaux */}
            <div style={styles.infoCard}>
              <div style={styles.infoCardHeader}>
                <div style={{ ...styles.infoCardIcon, backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
                  <i className="fas fa-tasks" style={{ fontSize: '20px', color: '#10B981' }}></i>
                </div>
                <h3 style={styles.infoCardTitle}>État des travaux</h3>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Avancement moyen</span>
                <span style={{ ...styles.infoValue, color: totals.avancement >= 70 ? '#10B981' : totals.avancement >= 40 ? '#F59E0B' : colors.primary }}>
                  {loading ? '...' : `${totals.avancement}%`}
                </span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Travaux actifs</span>
                <span style={styles.infoValue}>{loading ? '...' : totals.nombreProblemes} chantiers</span>
              </div>
              <div style={{ ...styles.infoItem, ...styles.infoItemLast }}>
                <span style={styles.infoLabel}>Statut global</span>
                <span style={{ 
                  ...styles.infoValue, 
                  color: totals.avancement >= 70 ? '#10B981' : totals.avancement >= 40 ? '#F59E0B' : colors.primary 
                }}>
                  {totals.avancement >= 70 ? 'Excellent' : totals.avancement >= 40 ? 'En bonne voie' : 'En cours'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TableauPage;
