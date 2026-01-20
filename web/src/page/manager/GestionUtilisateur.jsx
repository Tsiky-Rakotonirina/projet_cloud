import React, { useState, useEffect } from 'react';
import NavbarManager from '@components/NavbarManager';
import { colors } from '@assets/colors';
import utilisateurApi from '@api/manager/Utilisateur';
import { Users, Unlock, Search, RefreshCw, UserPlus, Mail, Lock, Calendar, Shield, ChevronDown, ChevronUp } from 'lucide-react';

const GestionUtilisateur = () => {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInscriptionForm, setShowInscriptionForm] = useState(false);
  
  // État formulaire d'inscription
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    date_naissance: '',
    profil_id: 2,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    loadUtilisateurs();
  }, []);

  const loadUtilisateurs = async () => {
    try {
      setLoading(true);
      const data = await utilisateurApi.getBlocked();
      setUtilisateurs(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs bloqués:', err);
      setUtilisateurs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDebloquer = async (id) => {
    try {
      await utilisateurApi.unblock(id);
      await loadUtilisateurs();
    } catch (err) {
      console.error('Erreur lors du déblocage:', err);
      alert('Erreur lors du déblocage de l\'utilisateur');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'profil_id' ? parseInt(value) : value
    }));
    setFormError('');
    setFormSuccess('');
  };

  const handleInscriptionSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Validation
    if (!formData.email || !formData.password) {
      setFormError('Email et mot de passe sont requis');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      setFormError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setFormLoading(true);

    try {
      const result = await utilisateurApi.register(
        formData.email,
        formData.password,
        formData.date_naissance || null,
        formData.profil_id
      );

      setFormSuccess(`Utilisateur créé avec succès !`);
      
      // Réinitialiser le formulaire
      setTimeout(() => {
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          date_naissance: '',
          profil_id: 2,
        });
        setFormSuccess('');
        setShowInscriptionForm(false);
      }, 2000);

    } catch (err) {
      setFormError(err.message || 'Erreur lors de la création de l\'utilisateur');
    } finally {
      setFormLoading(false);
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
    },
    // Styles pour le formulaire d'inscription
    toggleBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '14px 20px',
      fontSize: '14px',
      fontWeight: '500',
      fontFamily: 'inherit',
      color: 'white',
      backgroundColor: colors.secondary,
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    formCard: {
      backgroundColor: colors.dark,
      borderRadius: '16px',
      border: `1px solid ${colors.secondary}30`,
      padding: '24px',
      marginBottom: '24px'
    },
    formTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: 'white',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    form: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    formGroupFull: {
      gridColumn: '1 / -1'
    },
    label: {
      fontSize: '13px',
      fontWeight: '500',
      color: 'rgba(255,255,255,0.7)',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    input: {
      padding: '12px 16px',
      fontSize: '14px',
      fontFamily: 'inherit',
      color: 'white',
      backgroundColor: colors.darker,
      border: `1px solid ${colors.primary}30`,
      borderRadius: '10px',
      outline: 'none',
      transition: 'border-color 0.2s',
      boxSizing: 'border-box'
    },
    select: {
      padding: '12px 16px',
      fontSize: '14px',
      fontFamily: 'inherit',
      color: 'white',
      backgroundColor: colors.darker,
      border: `1px solid ${colors.primary}30`,
      borderRadius: '10px',
      outline: 'none',
      cursor: 'pointer',
      boxSizing: 'border-box'
    },
    submitBtn: {
      gridColumn: '1 / -1',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '14px',
      fontSize: '14px',
      fontWeight: '600',
      fontFamily: 'inherit',
      color: 'white',
      backgroundColor: colors.secondary,
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      marginTop: '8px'
    },
    alert: {
      gridColumn: '1 / -1',
      padding: '12px 16px',
      borderRadius: '10px',
      fontSize: '13px',
      fontWeight: '500',
      marginBottom: '16px'
    },
    alertError: {
      color: '#EF4444',
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      border: '1px solid rgba(239, 68, 68, 0.3)'
    },
    alertSuccess: {
      color: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      border: '1px solid rgba(16, 185, 129, 0.3)'
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
              onClick={() => setShowInscriptionForm(!showInscriptionForm)}
              style={styles.toggleBtn}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              {showInscriptionForm ? <ChevronUp size={16} /> : <UserPlus size={16} />}
              {showInscriptionForm ? 'Masquer' : 'Nouvel utilisateur'}
            </button>
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

          {/* Formulaire d'inscription */}
          {showInscriptionForm && (
            <div style={styles.formCard}>
              <h3 style={styles.formTitle}>
                <UserPlus size={20} />
                Inscrire un nouvel utilisateur
              </h3>
              
              <form onSubmit={handleInscriptionSubmit}>
                <div style={styles.form}>
                  {formError && (
                    <div style={{ ...styles.alert, ...styles.alertError }}>
                      {formError}
                    </div>
                  )}
                  
                  {formSuccess && (
                    <div style={{ ...styles.alert, ...styles.alertSuccess }}>
                      {formSuccess}
                    </div>
                  )}

                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      <Mail size={14} />
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      required
                      placeholder="email@exemple.com"
                      style={styles.input}
                      onFocus={(e) => e.target.style.borderColor = colors.secondary}
                      onBlur={(e) => e.target.style.borderColor = `${colors.primary}30`}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      <Calendar size={14} />
                      Date de naissance
                    </label>
                    <input
                      type="date"
                      name="date_naissance"
                      value={formData.date_naissance}
                      onChange={handleFormChange}
                      style={styles.input}
                      onFocus={(e) => e.target.style.borderColor = colors.secondary}
                      onBlur={(e) => e.target.style.borderColor = `${colors.primary}30`}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      <Lock size={14} />
                      Mot de passe *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleFormChange}
                      required
                      minLength={6}
                      placeholder="Min. 6 caractères"
                      style={styles.input}
                      onFocus={(e) => e.target.style.borderColor = colors.secondary}
                      onBlur={(e) => e.target.style.borderColor = `${colors.primary}30`}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      <Lock size={14} />
                      Confirmer mot de passe *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleFormChange}
                      required
                      placeholder="Même mot de passe"
                      style={styles.input}
                      onFocus={(e) => e.target.style.borderColor = colors.secondary}
                      onBlur={(e) => e.target.style.borderColor = `${colors.primary}30`}
                    />
                  </div>

                  <div style={{ ...styles.formGroup, ...styles.formGroupFull }}>
                    <label style={styles.label}>
                      <Shield size={14} />
                      Profil
                    </label>
                    <select
                      name="profil_id"
                      value={formData.profil_id}
                      onChange={handleFormChange}
                      style={styles.select}
                      onFocus={(e) => e.target.style.borderColor = colors.secondary}
                      onBlur={(e) => e.target.style.borderColor = `${colors.primary}30`}
                    >
                      <option value={2}>Utilisateur standard</option>
                      <option value={1}>Administrateur</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={formLoading}
                    style={{
                      ...styles.submitBtn,
                      opacity: formLoading ? 0.7 : 1,
                      cursor: formLoading ? 'not-allowed' : 'pointer'
                    }}
                    onMouseEnter={(e) => !formLoading && (e.target.style.opacity = '0.9')}
                    onMouseLeave={(e) => !formLoading && (e.target.style.opacity = '1')}
                  >
                    <UserPlus size={16} />
                    {formLoading ? 'Création en cours...' : 'Créer l\'utilisateur'}
                  </button>
                </div>
              </form>
            </div>
          )}

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
