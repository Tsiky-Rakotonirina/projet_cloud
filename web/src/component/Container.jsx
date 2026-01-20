import React from 'react';
import { colors } from '@assets/colors';

/**
 * Composant conteneur principal
 */
const Container = ({ children, className = '', style = {} }) => {
  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: colors.darker,
    position: 'relative',
    ...style
  };

  return (
    <div style={containerStyle} className={className}>
      {children}
    </div>
  );
};

export default Container;
