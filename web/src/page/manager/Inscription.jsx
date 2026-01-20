import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors } from '@assets/colors';
import Button from '@components/Button';
import NavbarManager from '@components/NavbarManager';
import { utilisateurApi } from '@api/manager/Utilisateur';
import { UserPlus, Mail, Lock, Calendar, Shield } from 'lucide-react';

const Inscription = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    date_naissance: '',
    profil_id: 2, // Par défaut: utilisateur standard
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'profil_id' ? parseInt(value) : value
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.email || !formData.password) {
      setError('Email et mot de passe sont requis');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      const result = await utilisateurApi.register(
        formData.email,
        formData.password,
        formData.date_naissance || null,
        formData.profil_id
      );

      setSuccess(`Utilisateur créé avec succès ! ID: ${result.id_utilisateurs}`);
      
      // Réinitialiser le formulaire
      setTimeout(() => {
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          date_naissance: '',
          profil_id: 2,
        });
        setSuccess('');
      }, 3000);

    } catch (err) {
      setError(err.message || 'Erreur lors de la création de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      paddingTop: '80px',
      backgroundColor: colors.light,
    },
    content: {
      maxWidth: '600px',
      margin: '40px auto',
      padding: '0 20px',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '40px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    header: {
      textAlign: 'center',
      marginBottom: '32px',
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: colors.dark,
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
    },
    subtitle: {
      fontSize: '14px',
      color: colors.textSecondary,
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    label: {
      fontSize: '14px',
      fontWeight: '600',
      color: colors.dark,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    input: {
      padding: '12px 16px',
      borderRadius: '8px',
      border: `1px solid ${colors.border}`,
      fontSize: '14px',
      transition: 'border-color 0.2s',
      outline: 'none',
    },
    select: {
      padding: '12px 16px',
      borderRadius: '8px',
      border: `1px solid ${colors.border}`,
      fontSize: '14px',
      backgroundColor: 'white',
      cursor: 'pointer',
      outline: 'none',
    },
    alert: {
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      marginBottom: '16px',
    },
    errorAlert: {
      backgroundColor: '#fee',
      color: '#c00',
      border: '1px solid #fcc',
    },
    successAlert: {
      backgroundColor: '#efe',
      color: '#060',
      border: '1px solid #cfc',
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      marginTop: '8px',
    },
  };

  return (
    <div style={styles.container}>
      <NavbarManager />
      
      <div style={styles.content}>
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.title}>
              <UserPlus size={32} />
              Inscription d'un Utilisateur
            </h1>
            <p style={styles.subtitle}>
              Créer un nouveau compte utilisateur (réservé aux administrateurs)
            </p>
          </div>

          {error && (
            <div style={{ ...styles.alert, ...styles.errorAlert }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ ...styles.alert, ...styles.successAlert }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <Mail size={18} />
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="utilisateur@exemple.com"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                <Lock size={18} />
                Mot de passe *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Au moins 6 caractères"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                <Lock size={18} />
                Confirmer le mot de passe *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Répéter le mot de passe"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                <Calendar size={18} />
                Date de naissance (optionnel)
              </label>
              <input
                type="date"
                name="date_naissance"
                value={formData.date_naissance}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                <Shield size={18} />
                Profil
              </label>
              <select
                name="profil_id"
                value={formData.profil_id}
                onChange={handleChange}
                style={styles.select}
              >
                <option value={2}>Utilisateur standard</option>
                <option value={1}>Administrateur</option>
              </select>
            </div>

            <div style={styles.buttonGroup}>
              <Button
                type="submit"
                variant="primary"
                size="large"
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? 'Création en cours...' : 'Créer l\'utilisateur'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="large"
                onClick={() => navigate('/manager/utilisateurs')}
              >
                Annuler
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Inscription;
