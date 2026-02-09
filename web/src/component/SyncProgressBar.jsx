import React from 'react';
import { useSyncProgress } from '@context/SyncProgressContext';
import { colors } from '@assets/colors';

/**
 * Barre de progression de synchronisation globale
 * Version modale flottante en bas à droite
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
  const isComplete = percentage >= 100 && !syncError;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <svg 
              style={{
                ...styles.icon,
                animation: isSyncing && !isComplete && !syncError ? 'spin 1s linear infinite' : 'none'
              }}
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor"
            >
              {isComplete ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : syncError ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              )}
            </svg>
            <span style={styles.title}>
              {syncError ? 'Erreur' : isComplete ? 'Terminé' : 'Synchronisation'}
            </span>
          </div>
          <button onClick={dismissProgress} style={styles.closeBtn}>×</button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          <div style={styles.statusText}>
            {syncError ? syncError : (currentStep || 'Traitement des données...')}
          </div>
          
          {/* Progress bar */}
          <div style={styles.progressTrack}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${percentage}%`,
                backgroundColor: syncError ? colors.danger : isComplete ? colors.success : colors.primary
              }}
            />
          </div>
          
          <div style={styles.footer}>
            <span style={styles.percentage}>{Math.round(percentage)}%</span>
            {currentProgress.processedItems > 0 && (
              <span style={styles.items}>
                {currentProgress.processedItems}/{currentProgress.totalItems} éléments
              </span>
            )}
          </div>
        </div>

        {/* Animation CSS */}
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          `}
        </style>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 9999,
    animation: 'slideIn 0.3s ease-out'
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)',
    width: '320px',
    overflow: 'hidden',
    border: '1px solid #e5e7eb'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e5e7eb'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  icon: {
    width: '18px',
    height: '18px',
    color: colors.primary
  },
  title: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a2e'
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
    transition: 'color 0.2s'
  },
  content: {
    padding: '16px'
  },
  statusText: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '12px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  progressTrack: {
    height: '6px',
    backgroundColor: '#e5e7eb',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s ease, background-color 0.3s ease'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '10px'
  },
  percentage: {
    fontSize: '13px',
    fontWeight: '600',
    color: colors.primary
  },
  items: {
    fontSize: '12px',
    color: '#9ca3af'
  }
};

export default SyncProgressBar;
