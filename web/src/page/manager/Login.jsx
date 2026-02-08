import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors } from '@assets/colors';
import { useAuth } from '@context/AuthContext';
import authApi from '@api/manager/Auth';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('admin@route.mg');
  const [password, setPassword] = useState('admin123');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Tentative de login avec:', email);
      const response = await authApi.login(email, password);
      console.log('Réponse API:', response);
      
      // L'API retourne { success, message, data: { token, user } }
      if (response.success && response.data) {
        console.log('Login réussi, token:', response.data.token);
        login(response.data.user, response.data.token);
        navigate('/manager/synchronisation');
      } else {
        console.error('Login échoué, réponse:', response);
        setError(response.message || 'Erreur de connexion');
      }
    } catch (err) {
      // Rester sur /manager/login en cas d'erreur
      console.error('Erreur login:', err);
      console.error('Response data:', err.response?.data);
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    page: {
      minHeight: '100vh',
      backgroundColor: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    },
    // Animated background gradient
    bgGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#F8FAFC',
      pointerEvents: 'none'
    },
    // Floating shapes - disabled for cleaner look
    floatingShape1: {
      display: 'none'
    },
    floatingShape2: {
      display: 'none'
    },
    floatingShape3: {
      display: 'none'
    },
    content: {
      position: 'relative',
      zIndex: 1,
      width: '100%',
      maxWidth: '420px'
    },
    header: {
      textAlign: 'center',
      marginBottom: '32px'
    },
    logoContainer: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '72px',
      height: '72px',
      backgroundColor: colors.primary,
      borderRadius: '20px',
      marginBottom: '20px'
    },
    logo: {
      fontSize: '32px',
      color: '#FFFFFF'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: colors.text,
      margin: '0 0 6px 0',
      letterSpacing: '-0.5px'
    },
    subtitle: {
      fontSize: '14px',
      color: colors.tertiary,
      margin: 0,
      fontWeight: '500',
      opacity: 0.8
    },
    formCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: '28px',
      padding: '36px',
      border: `1px solid ${colors.border}`,
      boxShadow: '0 20px 60px rgba(39, 76, 119, 0.12)'
    },
    formTitle: {
      display: 'none'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    },
    label: {
      fontSize: '13px',
      fontWeight: '600',
      color: colors.text,
      marginLeft: '4px'
    },
    inputWrapper: {
      position: 'relative'
    },
    inputIcon: {
      position: 'absolute',
      left: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: colors.tertiary,
      display: 'flex',
      alignItems: 'center',
      pointerEvents: 'none',
      fontSize: '15px',
      transition: 'color 0.2s'
    },
    input: {
      width: '100%',
      padding: '14px 16px 14px 48px',
      fontSize: '15px',
      fontFamily: 'inherit',
      color: colors.text,
      backgroundColor: colors.surface,
      border: `2px solid transparent`,
      borderRadius: '14px',
      outline: 'none',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box'
    },
    errorBox: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '14px 16px',
      fontSize: '14px',
      color: colors.danger,
      backgroundColor: `${colors.danger}10`,
      border: `1px solid ${colors.danger}30`,
      borderRadius: '12px'
    },
    submitBtn: {
      width: '100%',
      padding: '15px 24px',
      fontSize: '15px',
      fontWeight: '600',
      fontFamily: 'inherit',
      color: '#FFFFFF',
      backgroundColor: colors.primary,
      border: 'none',
      borderRadius: '14px',
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.7 : 1,
      transition: 'all 0.3s ease',
      marginTop: '8px'
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      margin: '24px 0'
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      backgroundColor: colors.border
    },
    dividerText: {
      fontSize: '12px',
      color: colors.tertiary,
      fontWeight: '500'
    },
    backBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      width: '100%',
      padding: '13px',
      fontSize: '14px',
      fontWeight: '500',
      fontFamily: 'inherit',
      color: colors.text,
      backgroundColor: 'transparent',
      border: `1.5px solid ${colors.border}`,
      borderRadius: '14px',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    // Animation keyframes in style tag
    animations: `
      @keyframes float1 {
        0%, 100% { transform: rotate(15deg) translateY(0); }
        50% { transform: rotate(15deg) translateY(-20px); }
      }
      @keyframes float2 {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-15px) scale(1.05); }
      }
      @keyframes float3 {
        0%, 100% { transform: rotate(-20deg) translateX(0); }
        50% { transform: rotate(-20deg) translateX(10px); }
      }
    `
  };

  return (
    <div style={styles.page}>
      <style>{styles.animations}</style>
      <div style={styles.bgGradient} />
      <div style={styles.floatingShape1} />
      <div style={styles.floatingShape2} />
      <div style={styles.floatingShape3} />

      <div style={styles.content}>
        <header style={styles.header}>
          <div style={styles.logoContainer}>
            <i className="fas fa-road" style={styles.logo}></i>
          </div>
          <h1 style={styles.title}>Lalan-tsara</h1>
          <p style={styles.subtitle}>Espace Administration</p>
        </header>

        <div style={styles.formCard}>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Adresse email</label>
              <div style={styles.inputWrapper}>
                <div style={styles.inputIcon}>
                  <i className="fas fa-envelope"></i>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  style={styles.input}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.primary;
                    e.target.style.backgroundColor = '#FFFFFF';
                    e.target.parentNode.querySelector('.fa-envelope').parentNode.style.color = colors.primary;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'transparent';
                    e.target.style.backgroundColor = colors.surface;
                    e.target.parentNode.querySelector('.fa-envelope').parentNode.style.color = colors.tertiary;
                  }}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Mot de passe</label>
              <div style={styles.inputWrapper}>
                <div style={styles.inputIcon}>
                  <i className="fas fa-lock"></i>
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
                    e.target.style.backgroundColor = '#FFFFFF';
                    e.target.parentNode.querySelector('.fa-lock').parentNode.style.color = colors.primary;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'transparent';
                    e.target.style.backgroundColor = colors.surface;
                    e.target.parentNode.querySelector('.fa-lock').parentNode.style.color = colors.tertiary;
                  }}
                />
              </div>
            </div>

            {error && (
              <div style={styles.errorBox}>
                <i className="fas fa-exclamation-circle"></i>
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
                  e.target.style.boxShadow = `0 8px 24px ${colors.primary}40`;
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = `0 4px 16px ${colors.primary}30`;
              }}
            >
              {loading ? (
                <>
                  <i className="fas fa-circle-notch fa-spin" style={{ marginRight: '8px' }}></i>
                  Connexion...
                </>
              ) : 'Se connecter'}
            </button>
          </form>

          <div style={styles.divider}>
            <div style={styles.dividerLine} />
            <span style={styles.dividerText}>ou</span>
            <div style={styles.dividerLine} />
          </div>

          <button
            onClick={() => navigate('/')}
            style={styles.backBtn}
            onMouseEnter={(e) => {
              e.target.style.borderColor = colors.primary;
              e.target.style.backgroundColor = `${colors.primary}08`;
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = colors.border;
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            <i className="fas fa-arrow-left"></i>
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
