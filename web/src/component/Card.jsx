import React from 'react';
import { colors } from '@assets/colors';

/**
 * Composant carte réutilisable avec effet glassmorphism
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
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: padding,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: `1px solid ${colors.primary}20`,
    transition: 'box-shadow 0.2s',
    cursor: onClick ? 'pointer' : 'default',
    ...style
  };

  const hoverStyle = hoverable && isHovered ? {
    ...baseStyle,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    borderColor: colors.primary
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
