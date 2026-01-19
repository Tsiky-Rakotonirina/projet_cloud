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
  type = 'button'
}) => {
  const variants = {
    primary: {
      background: colors.primary,
      color: 'white',
      hoverBackground: '#6BA9CC',
      border: 'none'
    },
    secondary: {
      background: 'transparent',
      color: colors.primary,
      hoverBackground: `${colors.primary}20`,
      border: `2px solid ${colors.primary}`
    },
    outline: {
      background: 'transparent',
      color: 'white',
      hoverBackground: colors.primary,
      border: `2px solid ${colors.primary}`
    },
    ghost: {
      background: 'transparent',
      color: colors.primary,
      hoverBackground: `${colors.primary}15`,
      border: 'none'
    }
  };

  const sizes = {
    small: { padding: '8px 20px', fontSize: '14px' },
    medium: { padding: '12px 30px', fontSize: '16px' },
    large: { padding: '16px 40px', fontSize: '18px' }
  };

  const baseStyle = {
    ...sizes[size],
    borderRadius: '8px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.2s',
    border: variants[variant].border,
    backgroundColor: disabled ? '#ccc' : variants[variant].background,
    color: disabled ? '#666' : variants[variant].color,
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.6 : 1,
    fontFamily: 'inherit'
  };

  const [isHovered, setIsHovered] = React.useState(false);

  const dynamicStyle = !disabled && isHovered ? {
    ...baseStyle,
    backgroundColor: variants[variant].hoverBackground
  } : baseStyle;

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
