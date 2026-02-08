import React from 'react';
import { colors } from '@assets/colors';
import Card from '@components/Card';

/**
 * Composant carte pour afficher un point visiteur
 */
const PointCard = ({ point, onClick }) => {
  if (!point) return null;

  const titleStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: colors.text,
    marginBottom: '12px',
    letterSpacing: '-0.3px'
  };

  const locationStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: colors.tertiary,
    fontSize: '14px',
    marginBottom: '12px'
  };

  const descriptionStyle = {
    color: colors.tertiary,
    fontSize: '14px',
    lineHeight: '1.6',
    marginBottom: '16px',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  };

  const badgeStyle = {
    display: 'inline-block',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: `${colors.primary}15`,
    color: colors.primary
  };

  return (
    <Card onClick={onClick} padding="20px">
      <h3 style={titleStyle}>{point.nom || 'Sans nom'}</h3>
      
      <div style={locationStyle}>
        <i className="fas fa-map-marker-alt" style={{ color: colors.primary }}></i>
        <span>{point.adresse || 'Adresse non disponible'}</span>
      </div>

      {point.description && (
        <p style={descriptionStyle}>{point.description}</p>
      )}

      {point.type && (
        <span style={badgeStyle}>
          {point.type}
        </span>
      )}
    </Card>
  );
};

export default PointCard;
