import React from 'react';
import { colors } from '@assets/colors';
import { AlertTriangle } from 'lucide-react';
import Card from '@components/Card';

/**
 * Composant pour afficher un message d'erreur élégant
 */
const ErrorMessage = ({ message, onRetry }) => {
  const containerStyle = {
    padding: '80px 40px',
    textAlign: 'center'
  };

  const iconStyle = {
    fontSize: '64px',
    marginBottom: '16px',
    opacity: 0.5
  };

  const messageStyle = {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '18px',
    marginBottom: '24px'
  };

  const retryButtonStyle = {
    backgroundColor: colors.primary,
    color: 'white',
    border: 'none',
    padding: '12px 32px',
    borderRadius: '25px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: `0 4px 15px ${colors.primary}40`
  };

  return (
    <div style={containerStyle}>
      <Card padding="48px">
        <div style={iconStyle}><AlertTriangle size={48} /></div>
        <p style={messageStyle}>{message || 'Une erreur est survenue'}</p>
        {onRetry && (
          <button
            style={retryButtonStyle}
            onClick={onRetry}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = `0 6px 20px ${colors.primary}50`;
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = `0 4px 15px ${colors.primary}40`;
            }}
          >
            Réessayer
          </button>
        )}
      </Card>
    </div>
  );
};

export default ErrorMessage;
