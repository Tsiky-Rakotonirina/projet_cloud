import React from 'react';

/**
 * Composant section pour organiser le contenu
 */
const Section = ({ 
  children, 
  title,
  subtitle,
  maxWidth = '1400px',
  padding = '60px 40px',
  titleColor = 'white',
  style = {}
}) => {
  const sectionStyle = {
    maxWidth: maxWidth,
    margin: '0 auto',
    padding: padding,
    ...style
  };

  const titleStyle = {
    fontSize: '36px',
    fontWeight: '700',
    color: titleColor,
    marginBottom: subtitle ? '12px' : '32px',
    textAlign: 'center',
    letterSpacing: '-0.5px'
  };

  const subtitleStyle = {
    fontSize: '18px',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: '48px',
    textAlign: 'center',
    fontWeight: '400'
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
