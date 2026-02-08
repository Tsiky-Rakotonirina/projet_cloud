import React from 'react';
import { colors } from '@assets/colors';

/**
 * Composant bouton réutilisable avec plusieurs variantes
 */
const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium',
  fullWidth = false,
  disabled = false,
  type = 'button',
  style = {}
}) => {
  const variants = {
    primary: {
      background: colors.primary,
      color: '#FFFFFF',
      hoverBackground: '#1e3a5f',
      border: 'none'
    },
    secondary: {
      background: colors.secondary,
      color: '#FFFFFF',
      hoverBackground: '#4a7fa8',
      border: 'none'
    },
    outline: {
      background: 'transparent',
      color: colors.primary,
      hoverBackground: `${colors.primary}12`,
      border: `2px solid ${colors.primary}`
    },
    ghost: {
      background: 'transparent',
      color: colors.text,
      hoverBackground: `${colors.primary}08`,
      border: 'none'
    }
  };

  const sizes = {
    small: { padding: '8px 20px', fontSize: '14px' },
    medium: { padding: '12px 28px', fontSize: '15px' },
    large: { padding: '14px 36px', fontSize: '16px' }
  };

  const baseStyle = {
    ...sizes[size],
    borderRadius: '10px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    border: variants[variant].border,
    backgroundColor: disabled ? '#E5E5E5' : variants[variant].background,
    color: disabled ? '#999' : variants[variant].color,
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.7 : 1,
    fontFamily: 'inherit'
  };

  const [isHovered, setIsHovered] = React.useState(false);

  const dynamicStyle = !disabled && isHovered ? {
    ...baseStyle,
    backgroundColor: variants[variant].hoverBackground,
    ...style
  } : {
    ...baseStyle,
    ...style
  };

  return (
    <button
      type={type}
      style={dynamicStyle}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </button>
  );
};

export default Button;
