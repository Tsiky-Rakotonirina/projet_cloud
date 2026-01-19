import React, { useState, useEffect } from 'react';
import NavbarManager from '@components/NavbarManager';
import { colors } from '@assets/colors';
import utilisateurApi from '@api/manager/Utilisateur';
import { Users, Unlock, Search, RefreshCw } from 'lucide-react';

const GestionUtilisateur = () => {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUtilisateurs();
  }, []);

  const loadUtilisateurs = async () => {
    try {
      setLoading(true);
      const data = await utilisateurApi.getBlocked();
      setUtilisateurs(data || []);
    } catch (err) {
      console.error(err);
      // Données de démonstration
      setUtilisateurs([
        { id: 1, email: 'user1@example.com', githubName: 'user1_github', age: 25 },
        { id: 2, email: 'blocked@test.com', githubName: 'blocked_user', age: 32 },
        { id: 3, email: 'spam@mail.com', githubName: 'spammer123', age: 19 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDebloquer = async (id) => {
    try {
      await utilisateurApi.unblock(id);
      await loadUtilisateurs();
    } catch (err) {
      console.error(err);
      setUtilisateurs(prev => prev.filter(u => u.id !== id));
    }
  };

  const filteredUsers = utilisateurs.filter(u =>
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.githubName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    toolbar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      marginBottom: '24px',
      flexWrap: 'wrap'
    },
    searchBox: {
      position: 'relative',
      flex: '1',
      maxWidth: '400px'
    },
    searchIcon: {
      position: 'absolute',
      left: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: colors.primary,
      pointerEvents: 'none'
    },
    searchInput: {
      width: '100%',
      padding: '14px 16px 14px 48px',
      fontSize: '14px',
      fontFamily: 'inherit',
      color: 'white',
      backgroundColor: colors.dark,
      border: `1px solid ${colors.primary}30`,
      borderRadius: '12px',
      outline: 'none',
      boxSizing: 'border-box'
    },
    refreshBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '14px 20px',
      fontSize: '14px',
      fontWeight: '500',
      fontFamily: 'inherit',
      color: 'white',
      backgroundColor: colors.dark,
      border: `1px solid ${colors.primary}30`,
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s'
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
    badge: {
      padding: '6px 12px',
      fontSize: '12px',
      fontWeight: '600',
      color: colors.secondary,
      backgroundColor: `${colors.secondary}20`,
      borderRadius: '20px'
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
    td: {
      padding: '16px 24px',
      fontSize: '14px',
      color: 'rgba(255,255,255,0.85)',
      borderBottom: `1px solid ${colors.primary}08`,
      verticalAlign: 'middle'
    },
    emailCell: {
      fontWeight: '500',
      color: 'white'
    },
    githubCell: {
      color: colors.primary
    },
    ageCell: {
      color: 'rgba(255,255,255,0.7)'
    },
    actionBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 16px',
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
    emptyState: {
      padding: '60px 24px',
      textAlign: 'center'
    },
    emptyIcon: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '64px',
      height: '64px',
      backgroundColor: `${colors.primary}15`,
      borderRadius: '16px',
      marginBottom: '16px'
    },
    emptyText: {
      fontSize: '15px',
      color: 'rgba(255,255,255,0.5)',
      margin: 0
    },
    loadingRow: {
      padding: '40px 24px',
      textAlign: 'center',
      color: 'rgba(255,255,255,0.5)'
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
                <Users size={24} color={colors.primary} />
              </div>
              <h1 style={styles.title}>Gestion des Utilisateurs</h1>
            </div>
            <p style={styles.subtitle}>Liste des utilisateurs bloqués</p>
          </header>

          <div style={styles.toolbar}>
            <div style={styles.searchBox}>
              <Search size={18} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Rechercher par email ou GitHub..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            <button
              onClick={loadUtilisateurs}
              style={styles.refreshBtn}
              onMouseEnter={(e) => e.target.style.borderColor = colors.primary}
              onMouseLeave={(e) => e.target.style.borderColor = `${colors.primary}30`}
            >
              <RefreshCw size={16} />
              Actualiser
            </button>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Utilisateurs Bloqués</h3>
              <span style={styles.badge}>{filteredUsers.length} utilisateur(s)</span>
            </div>

            {loading ? (
              <div style={styles.loadingRow}>Chargement...</div>
            ) : filteredUsers.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>
                  <Users size={28} color={colors.primary} />
                </div>
                <p style={styles.emptyText}>Aucun utilisateur bloqué</p>
              </div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>GitHub Name</th>
                    <th style={styles.th}>Âge</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td style={{ ...styles.td, ...styles.emailCell }}>{user.email}</td>
                      <td style={{ ...styles.td, ...styles.githubCell }}>{user.githubName}</td>
                      <td style={{ ...styles.td, ...styles.ageCell }}>{user.age} ans</td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <button
                          onClick={() => handleDebloquer(user.id)}
                          style={styles.actionBtn}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(16, 185, 129, 0.25)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
                          }}
                        >
                          <Unlock size={14} />
                          Débloquer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default GestionUtilisateur;
