import React from 'react';
import { useSyncProgress } from '@context/SyncProgressContext';
import { colors } from '@assets/colors';

/**
 * Barre de progression de synchronisation globale
 * S'affiche en haut de l'écran pendant la synchronisation
 * Persiste même en changeant de page
 */
const SyncProgressBar = () => {
  const { 
    isSyncing, 
    currentProgress, 
    syncError, 
    dismissProgress 
  } = useSyncProgress();

  // Ne rien afficher si pas de sync en cours et pas d'erreur
  if (!isSyncing && !syncError) {
    return null;
  }

  const { percentage = 0, currentStep = '' } = currentProgress || {};

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Icône de synchronisation animée */}
        <div style={styles.iconContainer}>
          <svg 
            style={{
              ...styles.syncIcon,
              animation: isSyncing && !syncError ? 'spin 1s linear infinite' : 'none'
            }}
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
        </div>

        {/* Informations de progression */}
        <div style={styles.infoContainer}>
          <div style={styles.header}>
            <span style={styles.status}>
              {syncError ? '⚠️ Erreur de synchronisation' : currentStep || 'Synchronisation en cours...'}
            </span>
            <span style={styles.percentage}>
              {Math.round(percentage)}%
            </span>
          </div>

          {/* Barre de progression */}
          <div style={styles.progressBarContainer}>
            <div 
              style={{
                ...styles.progressBar,
                width: `${percentage}%`,
                backgroundColor: syncError ? colors.danger : colors.success
              }}
            />
          </div>

          {/* Détails supplémentaires */}
          {currentProgress.processedItems > 0 && (
            <div style={styles.details}>
              {currentProgress.processedItems} / {currentProgress.totalItems} éléments traités
              {currentProgress.sessionsCount > 1 && 
                ` • ${currentProgress.sessionsCount} opérations en parallèle`
              }
            </div>
          )}
        </div>

        {/* Bouton de fermeture (seulement si terminé ou erreur) */}
        {(percentage >= 100 || syncError) && (
          <button 
            onClick={dismissProgress}
            style={styles.closeButton}
            title="Fermer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Message d'erreur */}
      {syncError && (
        <div style={styles.errorMessage}>
          {syncError}
        </div>
      )}

      {/* Animation CSS pour le spinner */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes slideDown {
            from { transform: translateY(-100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    animation: 'slideDown 0.3s ease-out',
    padding: '12px 20px'
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  iconContainer: {
    flexShrink: 0
  },
  syncIcon: {
    width: '28px',
    height: '28px',
    color: '#fff'
  },
  infoContainer: {
    flex: 1,
    minWidth: 0
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  status: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  percentage: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: '700',
    marginLeft: '12px',
    flexShrink: 0
  },
  progressBarContainer: {
    width: '100%',
    height: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s ease, background-color 0.3s ease'
  },
  details: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '12px',
    marginTop: '6px'
  },
  closeButton: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    flexShrink: 0,
    transition: 'background 0.2s ease'
  },
  errorMessage: {
    color: '#ffcccb',
    fontSize: '12px',
    marginTop: '8px',
    textAlign: 'center'
  }
};

export default SyncProgressBar;
