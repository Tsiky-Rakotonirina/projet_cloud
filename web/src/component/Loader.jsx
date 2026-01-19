import React from 'react';
import { colors } from '@assets/colors';

/**
 * Composant loader élégant
 */
const Loader = ({ size = 'medium', text = 'Chargement...' }) => {
  const sizes = {
    small: 32,
    medium: 48,
    large: 64
  };

  const spinnerSize = sizes[size];

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
    padding: '80px 40px'
  };

  const spinnerStyle = {
    width: `${spinnerSize}px`,
    height: `${spinnerSize}px`,
    border: `4px solid ${colors.primary}30`,
    borderTop: `4px solid ${colors.primary}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  const textStyle = {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '16px',
    fontWeight: '500'
  };

  return (
    <div style={containerStyle}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={spinnerStyle}></div>
      {text && <div style={textStyle}>{text}</div>}
    </div>
  );
};

export default Loader;
