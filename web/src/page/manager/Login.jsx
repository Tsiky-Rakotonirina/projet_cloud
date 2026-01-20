import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors } from '@assets/colors';
import { useAuth } from '@context/AuthContext';
import authApi from '@api/manager/Auth';
import { Lock, Mail, LogIn, ArrowLeft, AlertCircle } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login(email, password);
      login(response.user, response.token);
      navigate('/manager/synchronisation');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    page: {
      minHeight: '100vh',
      backgroundColor: colors.darker,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    },
    bgShape1: {
      position: 'absolute',
      top: '-10%',
      left: '-5%',
      width: '400px',
      height: '400px',
      borderRadius: '50%',
      background: `radial-gradient(circle, ${colors.primary}15 0%, transparent 70%)`,
      pointerEvents: 'none'
    },
    bgShape2: {
      position: 'absolute',
      bottom: '-15%',
      right: '-10%',
      width: '500px',
      height: '500px',
      borderRadius: '50%',
      background: `radial-gradient(circle, ${colors.secondary}12 0%, transparent 70%)`,
      pointerEvents: 'none'
    },
    bgLines: {
      position: 'absolute',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      backgroundImage: `
        linear-gradient(${colors.primary}05 1px, transparent 1px),
        linear-gradient(90deg, ${colors.primary}05 1px, transparent 1px)
      `,
      backgroundSize: '60px 60px',
      pointerEvents: 'none'
    },
    content: {
      position: 'relative',
      zIndex: 1,
      width: '100%',
      maxWidth: '400px'
    },
    header: {
      textAlign: 'center',
      marginBottom: '48px'
    },
    logoContainer: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '80px',
      height: '80px',
      backgroundColor: `${colors.primary}15`,
      borderRadius: '20px',
      marginBottom: '24px',
      border: `1px solid ${colors.primary}30`
    },
    logo: {
      width: '48px',
      height: '48px'
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      color: 'white',
      margin: '0 0 8px 0',
      letterSpacing: '-0.5px'
    },
    subtitle: {
      fontSize: '15px',
      color: `${colors.primary}`,
      margin: 0,
      fontWeight: '500'
    },
    formCard: {
      backgroundColor: `${colors.dark}`,
      borderRadius: '24px',
      padding: '40px',
      border: `1px solid ${colors.primary}20`
    },
    formTitle: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      marginBottom: '32px'
    },
    formTitleIcon: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '44px',
      height: '44px',
      backgroundColor: `${colors.primary}20`,
      borderRadius: '12px'
    },
    formTitleText: {
      fontSize: '20px',
      fontWeight: '600',
      color: 'white',
      margin: 0
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    label: {
      fontSize: '13px',
      fontWeight: '600',
      color: `rgba(255,255,255,0.7)`,
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    inputWrapper: {
      position: 'relative'
    },
    inputIcon: {
      position: 'absolute',
      left: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: colors.primary,
      display: 'flex',
      pointerEvents: 'none'
    },
    input: {
      width: '100%',
      padding: '16px 16px 16px 52px',
      fontSize: '15px',
      fontFamily: 'inherit',
      color: 'white',
      backgroundColor: `${colors.darker}`,
      border: `2px solid ${colors.primary}30`,
      borderRadius: '12px',
      outline: 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxSizing: 'border-box'
    },
    errorBox: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '14px 16px',
      fontSize: '14px',
      color: '#F87171',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: '12px'
    },
    submitBtn: {
      width: '100%',
      padding: '16px 24px',
      fontSize: '16px',
      fontWeight: '600',
      fontFamily: 'inherit',
      color: colors.darker,
      backgroundColor: colors.primary,
      border: 'none',
      borderRadius: '12px',
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.7 : 1,
      transition: 'all 0.2s',
      marginTop: '8px'
    },
    divider: {
      height: '1px',
      backgroundColor: `${colors.primary}20`,
      margin: '24px 0'
    },
    backBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      width: '100%',
      padding: '12px',
      fontSize: '14px',
      fontWeight: '500',
      fontFamily: 'inherit',
      color: `rgba(255,255,255,0.6)`,
      backgroundColor: 'transparent',
      border: `1px solid ${colors.primary}20`,
      borderRadius: '10px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.bgShape1} />
      <div style={styles.bgShape2} />
      <div style={styles.bgLines} />

      <div style={styles.content}>
        <header style={styles.header}>
          <div style={styles.logoContainer}>
            <img src="/logo.svg" alt="Lalan-tsara" style={styles.logo} />
          </div>
          <h1 style={styles.title}>Lalan-tsara</h1>
          <p style={styles.subtitle}>Espace Administration</p>
        </header>

        <div style={styles.formCard}>
          <div style={styles.formTitle}>
            <div style={styles.formTitleIcon}>
              <LogIn size={22} color={colors.primary} />
            </div>
            <h2 style={styles.formTitleText}>Connexion</h2>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email</label>
              <div style={styles.inputWrapper}>
                <div style={styles.inputIcon}>
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  style={styles.input}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.primary;
                    e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = `${colors.primary}30`;
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Mot de passe</label>
              <div style={styles.inputWrapper}>
                <div style={styles.inputIcon}>
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={styles.input}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.primary;
                    e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = `${colors.primary}30`;
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {error && (
              <div style={styles.errorBox}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={styles.submitBtn}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = `0 8px 20px ${colors.primary}40`;
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>

          <div style={styles.divider} />

          <button
            onClick={() => navigate('/')}
            style={styles.backBtn}
            onMouseEnter={(e) => {
              e.target.style.borderColor = colors.primary;
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = `${colors.primary}20`;
              e.target.style.color = 'rgba(255,255,255,0.6)';
            }}
          >
            <ArrowLeft size={16} />
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
