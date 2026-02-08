import React from 'react';
import { colors } from '@assets/colors';

/**
 * Composant loader moderne avec animation
 */
const Loader = ({ size = 'medium', text = 'Chargement...', variant = 'default' }) => {
  const sizes = {
    small: { spinner: 28, dot: 6 },
    medium: { spinner: 40, dot: 8 },
    large: { spinner: 56, dot: 10 }
  };

  const { spinner: spinnerSize, dot: dotSize } = sizes[size];

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
    padding: '60px 40px'
  };

  // Modern dots loader
  const dotsContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const dotStyle = {
    width: `${dotSize}px`,
    height: `${dotSize}px`,
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
  };

  // Pulse loader for map
  const pulseLoaderStyle = {
    position: 'relative',
    width: `${spinnerSize}px`,
    height: `${spinnerSize}px`
  };

  const textStyle = {
    color: variant === 'overlay' ? '#FFFFFF' : colors.tertiary,
    fontSize: '14px',
    fontWeight: '500',
    letterSpacing: '0.3px'
  };

  const animations = `
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }
    @keyframes pulse {
      0% { transform: scale(0.8); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.5; }
      100% { transform: scale(0.8); opacity: 1; }
    }
    @keyframes ripple {
      0% { transform: scale(0.8); opacity: 1; }
      100% { transform: scale(2.4); opacity: 0; }
    }
  `;

  return (
    <div style={containerStyle}>
      <style>{animations}</style>
      
      {variant === 'dots' ? (
        <div style={dotsContainerStyle}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                ...dotStyle,
                animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`
              }}
            />
          ))}
        </div>
      ) : variant === 'pulse' ? (
        <div style={pulseLoaderStyle}>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: `${spinnerSize * 0.4}px`,
              height: `${spinnerSize * 0.4}px`,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              animation: 'pulse 1.5s ease-in-out infinite'
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: `${spinnerSize}px`,
              height: `${spinnerSize}px`,
              borderRadius: '50%',
              border: `2px solid ${colors.primary}`,
              animation: 'ripple 1.5s ease-out infinite'
            }}
          />
        </div>
      ) : (
        <div style={dotsContainerStyle}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                ...dotStyle,
                animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`
              }}
            />
          ))}
        </div>
      )}
      
      {text && <div style={textStyle}>{text}</div>}
    </div>
  );
};

export default Loader;
