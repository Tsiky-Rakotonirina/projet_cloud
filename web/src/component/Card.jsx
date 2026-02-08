import React from 'react';
import { colors } from '@assets/colors';

/**
 * Composant carte réutilisable avec style épuré
 */
const Card = ({ 
  children, 
  onClick, 
  hoverable = true,
  padding = '24px',
  className = '',
  style = {}
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const baseStyle = {
    backgroundColor: colors.surface,
    borderRadius: '16px',
    padding: padding,
    boxShadow: '0 2px 12px rgba(39, 76, 119, 0.08)',
    border: `1px solid ${colors.border}`,
    transition: 'all 0.2s ease',
    cursor: onClick ? 'pointer' : 'default',
    ...style
  };

  const hoverStyle = hoverable && isHovered ? {
    ...baseStyle,
    boxShadow: '0 8px 24px rgba(39, 76, 119, 0.12)',
    borderColor: colors.primary,
    transform: 'translateY(-2px)'
  } : baseStyle;

  return (
    <div
      style={hoverStyle}
      className={className}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  );
};

export default Card;
