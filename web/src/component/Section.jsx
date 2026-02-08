import React from 'react';
import { colors } from '@assets/colors';

/**
 * Composant section pour organiser le contenu
 */
const Section = ({ 
  children, 
  title,
  subtitle,
  maxWidth = '1400px',
  padding = '48px 40px',
  titleColor = colors.text,
  style = {}
}) => {
  const sectionStyle = {
    maxWidth: maxWidth,
    margin: '0 auto',
    padding: padding,
    ...style
  };

  const titleStyle = {
    fontSize: '32px',
    fontWeight: '700',
    color: titleColor,
    marginBottom: subtitle ? '12px' : '32px',
    textAlign: 'center',
    letterSpacing: '-0.5px'
  };

  const subtitleStyle = {
    fontSize: '16px',
    color: colors.tertiary,
    marginBottom: '40px',
    textAlign: 'center',
    fontWeight: '400',
    opacity: 0.8
  };

  return (
    <section style={sectionStyle}>
      {title && <h2 style={titleStyle}>{title}</h2>}
      {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
      {children}
    </section>
  );
};

export default Section;
