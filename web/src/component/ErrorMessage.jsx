import React from 'react';
import { colors } from '@assets/colors';
import Card from '@components/Card';

/**
 * Composant pour afficher un message d'erreur élégant
 */
const ErrorMessage = ({ message, onRetry }) => {
  const containerStyle = {
    padding: '60px 40px',
    textAlign: 'center'
  };

  const iconStyle = {
    fontSize: '48px',
    marginBottom: '16px',
    color: colors.danger,
    opacity: 0.8
  };

  const messageStyle = {
    color: colors.text,
    fontSize: '16px',
    marginBottom: '24px'
  };

  const retryButtonStyle = {
    backgroundColor: colors.primary,
    color: colors.surface,
    border: 'none',
    padding: '12px 28px',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(228, 187, 151, 0.25)'
  };

  return (
    <div style={containerStyle}>
      <Card padding="48px">
        <div style={iconStyle}><i className="fas fa-exclamation-triangle"></i></div>
        <p style={messageStyle}>{message || 'Une erreur est survenue'}</p>
        {onRetry && (
          <button
            style={retryButtonStyle}
            onClick={onRetry}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(228, 187, 151, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 8px rgba(228, 187, 151, 0.25)';
            }}
          >
            <i className="fas fa-redo" style={{ marginRight: '8px' }}></i>
            Réessayer
          </button>
        )}
      </Card>
    </div>
  );
};

export default ErrorMessage;
