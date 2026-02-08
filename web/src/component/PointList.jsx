import React from 'react';
import { colors } from '@assets/colors';
import Grid from '@components/Grid';
import PointCard from '@components/PointCard';

/**
 * Composant liste pour afficher plusieurs points visiteurs
 */
const PointList = ({ points, onPointClick }) => {
  const emptyStyle = {
    textAlign: 'center',
    padding: '60px 40px',
    color: colors.tertiary,
    fontSize: '16px'
  };

  const emptyIconStyle = {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.4,
    color: colors.primary
  };

  if (!points || points.length === 0) {
    return (
      <div style={emptyStyle}>
        <div style={emptyIconStyle}><i className="fas fa-map"></i></div>
        <p>Aucun point visiteur disponible</p>
      </div>
    );
  }

  return (
    <Grid gap="24px">
      {points.map((point, index) => (
        <PointCard
          key={point.id || index}
          point={point}
          onClick={() => onPointClick && onPointClick(point)}
        />
      ))}
    </Grid>
  );
};

export default PointList;
